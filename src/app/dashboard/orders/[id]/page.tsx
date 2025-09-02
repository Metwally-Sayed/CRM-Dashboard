'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  MapPin,
  Edit,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

interface Address {
  id: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
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

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  transactionId?: string
  createdAt: string
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
  shippingAddress?: Address
  items: OrderItem[]
  payments: Payment[]
}

export default function OrderDetailsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    shippingStatus: '',
    notes: ''
  })

  const canManageOrders = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const orderData: Order = await response.json()
        setOrder(orderData)
        setFormData({
          status: orderData.status,
          paymentStatus: orderData.paymentStatus,
          shippingStatus: orderData.shippingStatus,
          notes: orderData.notes || ''
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch order details',
          variant: 'destructive'
        })
        router.push('/dashboard/orders')
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch order details',
        variant: 'destructive'
      })
      router.push('/dashboard/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order updated successfully'
        })
        setEditing(false)
        fetchOrder()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to update order',
          variant: 'destructive'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string, type: 'order' | 'payment' | 'shipping') => {
    // Handle undefined or null status
    if (!status) {
      status = type === 'order' ? 'PENDING' : type === 'payment' ? 'PENDING' : 'NOT_SHIPPED'
    }

    const orderConfigs = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      PROCESSING: { color: 'bg-purple-100 text-purple-800', icon: Package },
      SHIPPED: { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const paymentConfigs = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      PAID: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle },
      REFUNDED: { color: 'bg-gray-100 text-gray-800', icon: DollarSign }
    }

    const shippingConfigs = {
      NOT_SHIPPED: { color: 'bg-gray-100 text-gray-800', icon: Package },
      SHIPPED: { color: 'bg-blue-100 text-blue-800', icon: Truck },
      IN_TRANSIT: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }

    let config
    if (type === 'order') {
      config = orderConfigs[status as keyof typeof orderConfigs] || orderConfigs.PENDING
    } else if (type === 'payment') {
      config = paymentConfigs[status as keyof typeof paymentConfigs] || paymentConfigs.PENDING
    } else {
      config = shippingConfigs[status as keyof typeof shippingConfigs] || shippingConfigs.NOT_SHIPPED
    }
    
    const Icon = config.icon

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
            <p className="text-muted-foreground">Order details and management</p>
          </div>
        </div>
        {canManageOrders && (
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleUpdateOrder}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Order Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select value={formData.paymentStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentStatus: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Status</Label>
                    <Select value={formData.shippingStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, shippingStatus: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_SHIPPED">Not Shipped</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  {getStatusBadge(order.status, 'order')}
                  {getStatusBadge(order.paymentStatus, 'payment')}
                  {getStatusBadge(order.shippingStatus, 'shipping')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{order.items?.length || 0} items in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.total)}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No items in this order</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add notes about this order..."
                    rows={4}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {order.notes || 'No notes added to this order.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.customer ? (
                <div className="space-y-2">
                  <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
                  <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                  {order.customer.phone && (
                    <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Guest Order</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Order Created</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          {order.payments && order.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">{payment.method}</p>
                          {payment.transactionId && (
                            <p className="text-xs text-muted-foreground">ID: {payment.transactionId}</p>
                          )}
                        </div>
                        <Badge className={payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(payment.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}