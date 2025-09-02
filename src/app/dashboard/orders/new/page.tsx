'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  User,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  image?: string
}

interface Address {
  id: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface OrderItem {
  productId: string
  quantity: number
  price: number
  product?: Product
}

export default function NewOrderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [searchingProducts, setSearchingProducts] = useState(false)
  
  const [formData, setFormData] = useState({
    customerId: '',
    shippingAddressId: '',
    notes: '',
    items: [] as OrderItem[]
  })
  
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const canCreateOrders = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'

  useEffect(() => {
    if (!canCreateOrders) {
      router.push('/dashboard/orders')
    }
  }, [canCreateOrders, router])

  useEffect(() => {
    if (customerSearch) {
      searchCustomers()
    } else {
      setCustomers([])
    }
  }, [customerSearch])

  useEffect(() => {
    if (productSearch) {
      searchProducts()
    } else {
      setProducts([])
    }
  }, [productSearch])

  useEffect(() => {
    if (formData.customerId) {
      fetchCustomerAddresses(formData.customerId)
    } else {
      setAddresses([])
    }
  }, [formData.customerId])

  const searchCustomers = async () => {
    try {
      setSearchingCustomers(true)
      const response = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Failed to search customers:', error)
    } finally {
      setSearchingCustomers(false)
    }
  }

  const searchProducts = async () => {
    try {
      setSearchingProducts(true)
      const response = await fetch(`/api/products?search=${encodeURIComponent(productSearch)}&limit=10&status=ACTIVE`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Failed to search products:', error)
    } finally {
      setSearchingProducts(false)
    }
  }

  const fetchCustomerAddresses = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/addresses`)
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Failed to fetch customer addresses:', error)
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({ ...prev, customerId: customer.id }))
    setCustomerSearch('')
    setCustomers([])
  }

  const handleAddProduct = (product: Product) => {
    const existingItem = formData.items.find(item => item.productId === product.id)
    
    if (existingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, {
          productId: product.id,
          quantity: 1,
          price: product.price,
          product
        }]
      }))
    }
    
    setProductSearch('')
    setProducts([])
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId)
      return
    }
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.productId === productId 
          ? { ...item, quantity }
          : item
      )
    }))
  }

  const handleRemoveItem = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }))
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.08 // 8% tax rate
  }

  const calculateShipping = () => {
    return 10.00 // Fixed shipping rate
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    const shipping = calculateShipping()
    return subtotal + tax + shipping
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerId) {
      toast({
        title: 'Error',
        description: 'Please select a customer',
        variant: 'destructive'
      })
      return
    }
    
    if (formData.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the order',
        variant: 'destructive'
      })
      return
    }
    
    try {
      setLoading(true)
      
      const subtotal = calculateSubtotal()
      const tax = calculateTax(subtotal)
      const shipping = calculateShipping()
      const total = calculateTotal()
      
      const orderData = {
        customerId: formData.customerId,
        shippingAddressId: formData.shippingAddressId || undefined,
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        tax,
        shipping,
        total,
        notes: formData.notes || undefined
      }
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })
      
      if (response.ok) {
        const order = await response.json()
        toast({
          title: 'Success',
          description: 'Order created successfully'
        })
        router.push(`/dashboard/orders/${order.id}`)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to create order',
          variant: 'destructive'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (!canCreateOrders) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
          <p className="text-muted-foreground">Add a new order to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
              <CardDescription>Select the customer for this order</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null)
                      setFormData(prev => ({ ...prev, customerId: '', shippingAddressId: '' }))
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers by name or email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchingCustomers && (
                    <p className="text-sm text-muted-foreground">Searching customers...</p>
                  )}
                  {customers.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customers.map((customer) => (
                        <div 
                          key={customer.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
                <CardDescription>Select the shipping address for this order</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={formData.shippingAddressId} onValueChange={(value) => setFormData(prev => ({ ...prev, shippingAddressId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shipping address" />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        {address.street}, {address.city}, {address.state} {address.zipCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
              <CardDescription>Add products to this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Product Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchingProducts && (
                  <p className="text-sm text-muted-foreground">Searching products...</p>
                )}
                
                {products.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {products.map((product) => (
                      <div 
                        key={product.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                        onClick={() => handleAddProduct(product)}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {product.sku} | Stock: {product.stock}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(product.price)}</p>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Selected Items */}
                {formData.items.length > 0 && (
                  <div className="space-y-3">
                    <Separator />
                    <h4 className="font-medium">Selected Items</h4>
                    {formData.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.product?.sku}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label>Qty:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                        </div>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
              <CardDescription>Add any additional notes for this order</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this order..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>{formatCurrency(calculateTax(calculateSubtotal()))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatCurrency(calculateShipping())}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.customerId || formData.items.length === 0}
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}