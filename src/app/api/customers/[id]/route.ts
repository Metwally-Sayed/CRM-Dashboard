import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CustomerUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    image: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Calculate customer statistics
    const customerWithStats = {
      ...customer,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: customer.orders.length > 0 
        ? customer.orders.reduce((sum, order) => sum + order.total, 0) / customer.orders.length
        : 0,
      lastOrderDate: customer.orders.length > 0 ? customer.orders[0].createdAt : null
    }

    return NextResponse.json(customerWithStats)
  } catch (error) {
    console.error('Failed to fetch customer:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update customers
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = CustomerUpdateSchema.parse(body)

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if email is being updated and if it's already taken
    if (validatedData.email && validatedData.email !== existingCustomer.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...validatedData,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : undefined
      },
      include: {
        addresses: true,
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to update customer:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete customers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: true
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if customer has orders
    if (existingCustomer.orders.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete customer with existing orders' },
        { status: 400 }
      )
    }

    // Delete customer (addresses will be deleted due to cascade)
    await prisma.customer.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to delete customer:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}