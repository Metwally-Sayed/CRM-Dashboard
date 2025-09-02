import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Order creation schema
const OrderCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price must be non-negative')
  })).min(1, 'At least one item is required'),
  shippingAddressId: z.string().optional(),
  notes: z.string().optional()
})

// GET /api/orders - Fetch orders with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const customerId = searchParams.get('customerId') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.OrderWhereInput = {}

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { orderNumber: { contains: search } },
        { customer: { email: { contains: search } } },
        { customer: { firstName: { contains: search } } },
        { customer: { lastName: { contains: search } } }
      ]
    }

    if (status && ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      where.status = status as 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Fetch orders with related data
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
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
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create orders
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = OrderCreateSchema.parse(body)

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: validatedData.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Verify all products exist and have sufficient stock
    const productIds = validatedData.items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      )
    }

    // Check stock availability
    for (const item of validatedData.items) {
      const product = products.find(p => p.id === item.productId)
      if (product && product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${product.name}` },
          { status: 400 }
        )
      }
    }

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    const tax = subtotal * 0.1 // 10% tax
    const shipping = 10.00 // Fixed shipping
    const total = subtotal + tax + shipping

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: validatedData.customerId,
          subtotal,
          tax,
          shipping,
          total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          shippingStatus: 'NOT_SHIPPED',
          shippingAddressId: validatedData.shippingAddressId,
          notes: validatedData.notes,
          items: {
            create: validatedData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            }))
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            }
          }
        }
      })

      // Update product stock
      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      return newOrder
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}