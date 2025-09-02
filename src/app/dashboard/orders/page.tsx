'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Product {
  id: string
  name: string
  sku: string
  image?: string
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  total: number
  product: Product
}

interface Order {
  id: string
  orderNumber: string
  customerId?: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  shippingStatus: 'NOT_SHIPPED' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED'
  subtotal: number
  tax: number
  shipping: number
  total: number
  currency: string
  notes?: string
  createdAt: string
  updatedAt: string
  customer?: Customer
  items: OrderItem[]
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)

  const canManageOrders = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  useEffect(() => {
    fetchOrders()
  }, [currentPage, searchTerm, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/orders?${params}`)
      if (response.ok) {
        const data: OrdersResponse = await response.json()
        setOrders(data.orders)
        setTotalPages(data.pagination.pages)
        setTotalOrders(data.pagination.total)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch orders',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order status updated successfully'
        })
        fetchOrders()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to update order status',
          variant: 'destructive'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order status'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order deleted successfully'
        })
        fetchOrders()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete order',
          variant: 'destructive'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete order'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PROCESSING: { color: 'bg-purple-100 text-purple-800', icon: Package },
      SHIPPED: { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800' },
      PAID: { color: 'bg-green-100 text-green-800' },
      FAILED: { color: 'bg-red-100 text-red-800' },
      REFUNDED: { color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return (
      <Badge className={`${config.color} border-0`}>
        <DollarSign className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
        </div>
        {canManageOrders && (
          <Link href="/dashboard/orders/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter orders by search term and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by order number, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Order Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setCurrentPage(1)
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({totalOrders})</CardTitle>
          <CardDescription>A list of all orders in your system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-semibold">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest Order'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(order.status)}
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium">{formatCurrency(order.total)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Items</p>
                          <p className="font-medium">{order.items.length} items</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Shipping</p>
                          <p className="font-medium">{order.shippingStatus.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      {canManageOrders && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Order
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')}>
                              <Package className="h-4 w-4 mr-2" />
                              Mark Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}>
                              <Truck className="h-4 w-4 mr-2" />
                              Mark Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Delivered
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                            {session?.user?.role === 'ADMIN' && order.status === 'PENDING' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteOrder(order.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}