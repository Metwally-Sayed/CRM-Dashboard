'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Upload, Plus, X, ImageIcon, Package, DollarSign, BarChart3 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  description?: string
}

interface ProductVariant {
  id: string
  name: string
  value: string
}

interface ProductImage {
  id: string
  url: string
  alt?: string
  order: number
}

interface ProductFormData {
  name: string
  description: string
  sku: string
  price: number
  costPrice: number
  stock: number
  lowStock: number
  categoryId: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  image?: string
  variants: Omit<ProductVariant, 'id'>[]
  images: Omit<ProductImage, 'id'>[]
}

export default function NewProductPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    lowStock: 10,
    categoryId: '',
    status: 'ACTIVE',
    image: '',
    variants: [],
    images: []
  })
  const [newVariant, setNewVariant] = useState({ name: '', value: '' })
  const [newImage, setNewImage] = useState({ url: '', alt: '', order: 0 })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      })
    }
  }

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addVariant = () => {
    if (newVariant.name && newVariant.value) {
      setFormData(prev => ({
        ...prev,
        variants: [...prev.variants, { ...newVariant }]
      }))
      setNewVariant({ name: '', value: '' })
    }
  }

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  const addImage = () => {
    if (newImage.url) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { ...newImage, order: prev.images.length }]
      }))
      setNewImage({ url: '', alt: '', order: 0 })
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase()
    const sku = `PRD-${timestamp}-${randomStr}`
    handleInputChange('sku', sku)
  }

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.name && formData.sku && formData.categoryId
      case 2:
        return formData.price > 0
      case 3:
        return true // Optional step
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4))
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields before proceeding.',
        variant: 'destructive'
      })
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast({
        title: 'Validation Error',
        description: 'Please complete all required fields.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          variants: undefined, // Remove variants for now as they need separate API
          images: undefined   // Remove images for now as they need separate API
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: 'Product created successfully'
        })
        router.push(`/dashboard/products/${data.product.id}`)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.message || 'Failed to create product',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating product:', error)
      toast({
        title: 'Error',
        description: 'Failed to create product',
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

  const calculateProfitMargin = () => {
    if (formData.price > 0 && formData.costPrice > 0) {
      return ((formData.price - formData.costPrice) / formData.price * 100).toFixed(1)
    }
    return '0'
  }

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Basic Info', icon: Package },
      { number: 2, title: 'Pricing', icon: DollarSign },
      { number: 3, title: 'Media & Variants', icon: ImageIcon },
      { number: 4, title: 'Review', icon: BarChart3 }
    ]

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((stepItem, index) => {
          const Icon = stepItem.icon
          const isActive = step === stepItem.number
          const isCompleted = step > stepItem.number
          const isValid = validateStep(stepItem.number)

          return (
            <div key={stepItem.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                isActive ? 'bg-blue-500 border-blue-500 text-white' :
                isValid ? 'border-blue-300 text-blue-500' :
                'border-gray-300 text-gray-400'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="ml-2 mr-4">
                <div className={`text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {stepItem.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Product Information</CardTitle>
          <CardDescription>Enter the essential details for your new product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <div className="flex space-x-2">
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Enter SKU"
                  required
                />
                <Button type="button" variant="outline" onClick={generateSKU}>
                  Generate
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description"
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED') => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Inventory</CardTitle>
          <CardDescription>Set pricing and stock information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Initial Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStock">Low Stock Alert</Label>
              <Input
                id="lowStock"
                type="number"
                min="0"
                value={formData.lowStock}
                onChange={(e) => handleInputChange('lowStock', parseInt(e.target.value) || 0)}
                placeholder="10"
              />
            </div>
          </div>
          
          {formData.price > 0 && formData.costPrice > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Profit Margin:</span>
                <span className="text-lg font-bold text-blue-600">{calculateProfitMargin()}%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-blue-900">Profit per Unit:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(formData.price - formData.costPrice)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Image</CardTitle>
          <CardDescription>Add a primary image for your product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image">Primary Image URL</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => handleInputChange('image', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          {formData.image && (
            <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
              <Image
                src={formData.image}
                alt="Product preview"
                fill
                className="object-cover"
                onError={() => handleInputChange('image', '')}
              />
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>Add variants like size, color, etc. (Optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={newVariant.name}
              onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Variant name (e.g., Size)"
            />
            <Input
              value={newVariant.value}
              onChange={(e) => setNewVariant(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Variant value (e.g., Large)"
            />
          </div>
          <Button type="button" onClick={addVariant} disabled={!newVariant.name || !newVariant.value}>
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
          
          {formData.variants.length > 0 && (
            <div className="space-y-2">
              <Label>Current Variants:</Label>
              <div className="flex flex-wrap gap-2">
                {formData.variants.map((variant, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {variant.name}: {variant.value}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeVariant(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Product Details</CardTitle>
          <CardDescription>Please review all information before creating the product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Product Name</Label>
                <p className="text-lg font-semibold">{formData.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">SKU</Label>
                <p className="font-mono">{formData.sku}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Category</Label>
                <p>{categories.find(c => c.id === formData.categoryId)?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge className={formData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {formData.status}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Selling Price</Label>
                <p className="text-lg font-semibold">{formatCurrency(formData.price)}</p>
              </div>
              {formData.costPrice > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cost Price</Label>
                  <p>{formatCurrency(formData.costPrice)}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-500">Initial Stock</Label>
                <p>{formData.stock} units</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Low Stock Alert</Label>
                <p>{formData.lowStock} units</p>
              </div>
            </div>
          </div>
          
          {formData.description && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Description</Label>
              <p className="mt-1 text-gray-700">{formData.description}</p>
            </div>
          )}
          
          {formData.variants.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Variants</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {formData.variants.map((variant, index) => (
                  <Badge key={index} variant="outline">
                    {variant.name}: {variant.value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {formData.image && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Product Image</Label>
              <div className="relative w-32 h-32 mt-2 border rounded-lg overflow-hidden">
                <Image
                  src={formData.image}
                  alt="Product preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

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
            <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
            <p className="text-gray-600">Add a new product to your inventory</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
        >
          Previous
        </Button>
        
        <div className="text-sm text-gray-500">
          Step {step} of 4
        </div>
        
        {step < 4 ? (
          <Button
            onClick={nextStep}
            disabled={!validateStep(step)}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading || !validateStep(1) || !validateStep(2)}
          >
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        )}
      </div>
    </div>
  )
}