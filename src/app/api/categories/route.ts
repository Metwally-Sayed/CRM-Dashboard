import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  image: z.string().optional()
})

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'

    const categories = await prisma.category.findMany({
      include: {
        products: includeProducts ? {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            status: true
          }
        } : false,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'MANAGER')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)

    // Check if category name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: validatedData.name }
    })

    if (existingCategory) {
      return NextResponse.json(
        { message: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Create the category
    const category = await prisma.category.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json(
      { message: 'Category created successfully', category },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating category:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}