import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import * as z from 'zod'

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  sku: z.string().min(1, 'SKU is required'),
  stock: z.number().int().min(0, 'Stock quantity must be non-negative'),
  costPrice: z.number().positive().optional(),
  lowStock: z.number().int().min(0).optional(),
  image: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).default('ACTIVE')
})

// GET /api/products - Get all products with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ProductWhereInput = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } }
      ]
    }
    
    if (category) {
      where.categoryId = category
    }
    
    if (status && ['ACTIVE', 'INACTIVE', 'DISCONTINUED'].includes(status)) {
      where.status = status as 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
    }

    // Get products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: true,
          images: true
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.product.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: validatedData.sku }
    })

    if (existingProduct) {
      return NextResponse.json(
        { message: 'Product with this SKU already exists' },
        { status: 400 }
      )
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        categoryId: validatedData.categoryId,
        sku: validatedData.sku,
        stock: validatedData.stock,
        costPrice: validatedData.costPrice,
        lowStock: validatedData.lowStock,
        image: validatedData.image,
        status: validatedData.status
      },
      include: {
        category: true,
        variants: true,
        images: true
      }
    })

    return NextResponse.json(
      { message: 'Product created successfully', product },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating product:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}