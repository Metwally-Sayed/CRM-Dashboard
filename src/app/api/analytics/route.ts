import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get overview statistics
    const [totalCustomers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          total: true
        }
      })
    ])

    // Get period-specific statistics
    const [periodOrders, periodRevenue, periodCustomers] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        }
      }),
      prisma.customer.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      })
    ])

    // Get daily sales data for the period
    const dailySales = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    })

    // Process daily sales data
    const salesByDay = dailySales.reduce((acc: Record<string, { date: string; revenue: number; orders: number }>, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, orders: 0 }
      }
      acc[date].revenue += sale._sum.total || 0
      acc[date].orders += sale._count.id
      return acc
    }, {})

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startDate
          }
        }
      },
      _sum: {
        quantity: true,
        price: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    })

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, image: true }
        })
        return {
          ...product,
          totalSold: item._sum.quantity || 0,
          revenue: item._sum.price || 0
        }
      })
    )

    // Get order status distribution
    const orderStatusDistribution = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    })

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Calculate growth rates
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period))
    
    const [previousPeriodOrders, previousPeriodRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        },
        _sum: {
          total: true
        }
      })
    ])

    const orderGrowth = previousPeriodOrders > 0 
      ? ((periodOrders - previousPeriodOrders) / previousPeriodOrders) * 100 
      : 0
    
    const revenueGrowth = (previousPeriodRevenue._sum.total || 0) > 0 
      ? (((periodRevenue._sum.total || 0) - (previousPeriodRevenue._sum.total || 0)) / (previousPeriodRevenue._sum.total || 0)) * 100 
      : 0

    return NextResponse.json({
      overview: {
        totalCustomers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0
      },
      period: {
        days: parseInt(period),
        orders: periodOrders,
        revenue: periodRevenue._sum.total || 0,
        customers: periodCustomers,
        orderGrowth,
        revenueGrowth
      },
      charts: {
        dailySales: Object.values(salesByDay),
        topProducts: topProductsWithDetails,
        orderStatus: orderStatusDistribution.map(item => ({
          status: item.status,
          count: item._count.id
        }))
      },
      recentOrders
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}