import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Order update schema
const OrderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  shippingStatus: z.enum(['NOT_SHIPPED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED']).optional(),
  notes: z.string().optional(),
  shippingAddressId: z.string().optional()
})

// GET /api/orders/[id] - Get specific order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        shippingAddress: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                image: true,
                price: true
              }
            }
          }
        },
        payments: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update orders
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = OrderUpdateSchema.parse(body)

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // If order is being cancelled, restore product stock
    let stockUpdates: Array<{ productId: string; quantity: number }> = []
    if (validatedData.status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
      stockUpdates = existingOrder.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    }

    // Update order with transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update the order
      const order = await tx.order.update({
        where: { id: params.id },
        data: {
          ...validatedData,
          updatedAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          shippingAddress: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  image: true
                }
              }
            }
          },
          payments: true
        }
      })

      // Restore stock if order was cancelled
      if (stockUpdates.length > 0) {
        for (const update of stockUpdates) {
          await tx.product.update({
            where: { id: update.productId },
            data: {
              stock: {
                increment: update.quantity
              }
            }
          })
        }
      }

      return order
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - Delete order (only if pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete orders
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if order exists and is deletable
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending orders
    if (existingOrder.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending orders can be deleted' },
        { status: 400 }
      )
    }

    // Delete order and restore stock
    await prisma.$transaction(async (tx) => {
      // Restore product stock
      for (const item of existingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })
      }

      // Delete the order (cascade will delete items and payments)
      await tx.order.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Order deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    )
  }
}