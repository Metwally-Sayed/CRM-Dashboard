'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Edit, Trash2, Package, DollarSign, BarChart3, Calendar, Tag, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description?: string
  sku: string
  price: number
  costPrice?: number
  stock: number
  lowStock: number
  image?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  categoryId: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    description?: string
  }
  variants: Array<{
    id: string
    name: string
    value: string
  }>
  images: Array<{
    id: string
    url: string
    alt?: string
    order: number
  }>
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    order: {
      id: string
      status: string
      createdAt: string
    }
  }>
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const productId = params.id as string

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
      } else if (response.status === 404) {
        toast({
          title: 'Product not found',
          description: 'The requested product could not be found.',
          variant: 'destructive'
        })
        router.push('/dashboard/products')
      } else {
        throw new Error('Failed to fetch product')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Product deleted successfully'
        })
        router.push('/dashboard/products')
      } else {
        const data = await response.json()
        toast({
          title: 'Error',
          description: data.message || 'Failed to delete product',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'DISCONTINUED':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
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

  const calculateTotalSold = () => {
    if (!product?.orderItems) return 0
    return product.orderItems.reduce((total, item) => total + item.quantity, 0)
  }

  const calculateTotalRevenue = () => {
    if (!product?.orderItems) return 0
    return product.orderItems.reduce((total, item) => total + (item.quantity * item.price), 0)
  }

  const isLowStock = () => {
    return product && product.stock <= product.lowStock
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <p className="text-gray-600 mt-2">The requested product could not be found.</p>
          <Button onClick={() => router.push('/dashboard/products')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/products')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">SKU: {product.sku}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(product.status)}>
            {product.status}
          </Badge>
          {isLowStock() && (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Low Stock
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image and Gallery */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Primary Image */}
                {product.image && (
                  <div className="relative aspect-square w-full max-w-md mx-auto">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                
                {/* Additional Images */}
                {product.images && product.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images
                      .sort((a, b) => a.order - b.order)
                      .map((image) => (
                        <div key={image.id} className="relative aspect-square">
                          <Image
                            src={image.url}
                            alt={image.alt || product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ))
                    }
                  </div>
                )}
                
                {!product.image && (!product.images || product.images.length === 0) && (
                  <div className="aspect-square w-full max-w-md mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {product.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {/* Product Variants */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{variant.name}:</span>
                      <span>{variant.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales History */}
          {product.orderItems && product.orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  Latest orders containing this product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.orderItems
                    .sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime())
                    .slice(0, 10)
                    .map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Order #{item.order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(item.order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.quantity}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                className="w-full"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
              
              {session?.user?.role === 'ADMIN' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Product
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product
                        and remove it from our servers.
                        {product.orderItems && product.orderItems.length > 0 && (
                          <span className="block mt-2 text-red-600 font-medium">
                            Warning: This product has existing orders and cannot be deleted.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting || (product.orderItems && product.orderItems.length > 0)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Price</span>
                </div>
                <span className="font-medium">{formatCurrency(product.price)}</span>
              </div>
              
              {product.costPrice && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Cost Price</span>
                  </div>
                  <span className="font-medium">{formatCurrency(product.costPrice)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Stock</span>
                </div>
                <span className={`font-medium ${isLowStock() ? 'text-red-600' : ''}`}>
                  {product.stock} units
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Low Stock Alert</span>
                </div>
                <span className="font-medium">{product.lowStock} units</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Category</span>
                </div>
                <span className="font-medium">{product.category.name}</span>
              </div>
            </CardContent>
          </Card>

          {/* Sales Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Sold</span>
                </div>
                <span className="font-medium">{calculateTotalSold()} units</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Revenue</span>
                </div>
                <span className="font-medium">{formatCurrency(calculateTotalRevenue())}</span>
              </div>
              
              {product.costPrice && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Profit Margin</span>
                  </div>
                  <span className="font-medium">
                    {((product.price - product.costPrice) / product.price * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created</span>
                </div>
                <span className="text-sm">{formatDate(product.createdAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Last Updated</span>
                </div>
                <span className="text-sm">{formatDate(product.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}