import { PrismaClient, UserRole, OrderStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  // Create categories
  console.log('📂 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Electronics',
        description: 'Electronic devices and gadgets'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Clothing',
        description: 'Fashion and apparel'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Books',
        description: 'Books and educational materials'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Home & Garden',
        description: 'Home improvement and gardening supplies'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Sports',
        description: 'Sports equipment and accessories'
      }
    })
  ])

  // Create users
  console.log('👥 Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@crmsystem.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date()
      }
    }),
    prisma.user.create({
      data: {
        name: 'Manager Smith',
        email: 'manager@crmsystem.com',
        password: hashedPassword,
        role: UserRole.MANAGER,
        emailVerified: new Date()
      }
    }),
    prisma.user.create({
      data: {
        name: 'John Employee',
        email: 'employee@crmsystem.com',
        password: hashedPassword,
        role: UserRole.USER,
        emailVerified: new Date()
      }
    })
  ])

  // Create customers
  console.log('🛍️ Creating customers...')
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@email.com',
        phone: '+1-555-0101'
      }
    }),
    prisma.customer.create({
      data: {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@email.com',
        phone: '+1-555-0102'
      }
    }),
    prisma.customer.create({
      data: {
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@email.com',
        phone: '+1-555-0103'
      }
    }),
    prisma.customer.create({
      data: {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@email.com',
        phone: '+1-555-0104'
      }
    }),
    prisma.customer.create({
      data: {
        firstName: 'Emma',
        lastName: 'Taylor',
        email: 'emma.taylor@email.com',
        phone: '+1-555-0105'
      }
    }),
    prisma.customer.create({
      data: {
        firstName: 'Frank',
        lastName: 'Miller',
        email: 'frank.miller@email.com',
        phone: '+1-555-0106'
      }
    }),
    prisma.customer.create({
      data: {
        firstName: 'Grace',
        lastName: 'Lee',
        email: 'grace.lee@email.com',
        phone: '+1-555-0107'
      }
    }),
    prisma.customer.create({
      data: {
        firstName: 'Henry',
        lastName: 'Garcia',
        email: 'henry.garcia@email.com',
        phone: '+1-555-0108'
      }
    })
  ])

  // Create products
  console.log('📦 Creating products...')
  const products = await Promise.all([
    // Electronics
    prisma.product.create({
      data: {
        name: 'Smartphone Pro Max',
        description: 'Latest flagship smartphone with advanced camera system',
        price: 999.99,
        stock: 50,
        sku: 'PHONE-001',
        categoryId: categories[0].id,
        image: '/images/smartphone.jpg'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Wireless Headphones',
        description: 'Premium noise-cancelling wireless headphones',
        price: 299.99,
        stock: 75,
        sku: 'AUDIO-001',
        categoryId: categories[0].id,
        image: '/images/headphones.jpg'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Laptop Ultra',
        description: 'High-performance laptop for professionals',
        price: 1499.99,
        stock: 25,
        sku: 'COMP-001',
        categoryId: categories[0].id,
        image: '/images/laptop.jpg'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Smart Watch',
        description: 'Fitness tracking smartwatch with health monitoring',
        price: 399.99,
        stock: 100,
        sku: 'WATCH-001',
        categoryId: categories[0].id,
        image: '/images/smartwatch.jpg'
      }
    }),
    
    // Clothing
    prisma.product.create({
      data: {
        name: 'Premium T-Shirt',
        description: 'Comfortable cotton t-shirt in various colors',
        price: 29.99,
        stock: 200,
        sku: 'CLOTH-001',
        categoryId: categories[1].id,
        image: '/images/tshirt.jpg'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Designer Jeans',
        description: 'Stylish denim jeans with perfect fit',
        price: 89.99,
        stock: 150,
        sku: 'CLOTH-002',
        categoryId: categories[1].id,
        image: '/images/jeans.jpg'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Winter Jacket',
        description: 'Warm and waterproof winter jacket',
        price: 199.99,
        stock: 80,
        sku: 'CLOTH-003',
        categoryId: categories[1].id,
        image: '/images/jacket.jpg'
      }
    }),
    
    // Books
    prisma.product.create({
      data: {
        name: 'Programming Guide',
        description: 'Comprehensive guide to modern programming',
        price: 49.99,
        stock: 120,
        sku: 'BOOK-001',
        categoryId: categories[2].id,
        image: '/images/programming-book.jpg'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Business Strategy',
        description: 'Essential business strategy and management book',
        price: 39.99,
        stock: 90,
        sku: 'BOOK-002',
        categoryId: categories[2].id,
        image: '/images/business-book.jpg'
      }
    }),
    
    // Home & Garden
    prisma.product.create({
      data: {
        name: 'Coffee Maker Deluxe',
        description: 'Professional-grade coffee maker with timer',
        price: 149.99,
        stock: 60,
        sku: 'HOME-001',
        categoryId: categories[3].id,
        image: '/images/coffee-maker.jpg'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Garden Tool Set',
        description: 'Complete set of essential gardening tools',
        price: 79.99,
        stock: 40,
        sku: 'GARDEN-001',
        categoryId: categories[3].id,
        image: '/images/garden-tools.jpg'
      }
    }),
    
    // Sports
    prisma.product.create({
      data: {
        name: 'Yoga Mat Pro',
        description: 'Non-slip yoga mat for all fitness levels',
        price: 59.99,
        stock: 180,
        sku: 'SPORT-001',
        categoryId: categories[4].id,
        image: '/images/yoga-mat.jpg'
      }
    }),
    prisma.product.create({
      data: {
        name: 'Running Shoes',
        description: 'Lightweight running shoes with cushioning',
        price: 129.99,
        stock: 95,
        sku: 'SPORT-002',
        categoryId: categories[4].id,
        image: '/images/running-shoes.jpg'
      }
    })
  ])

  // Create orders with different statuses and dates
  console.log('🛒 Creating orders...')
  const orderStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED]
  
  const orders = []
  for (let i = 0; i < 25; i++) {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)]
    const randomStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
    const orderDate = new Date()
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 90)) // Orders from last 90 days
    
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i.toString().padStart(3, '0')}`,
        customerId: randomCustomer.id,
        status: randomStatus,
        subtotal: 0, // Will be calculated after adding items
        total: 0, // Will be calculated after adding items
        createdAt: orderDate,
        updatedAt: orderDate
      }
    })
    
    // Add 1-4 random items to each order
    const numItems = Math.floor(Math.random() * 4) + 1
    let orderTotal = 0
    
    for (let j = 0; j < numItems; j++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const itemTotal = randomProduct.price * quantity
      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: randomProduct.id,
          quantity: quantity,
          price: randomProduct.price,
          total: itemTotal
        }
      })
      
      orderTotal += itemTotal
    }
    
    // Update order total
    await prisma.order.update({
      where: { id: order.id },
      data: { 
        subtotal: orderTotal,
        total: orderTotal 
      }
    })
    
    orders.push(order)
  }

  console.log('✅ Database seeding completed!')
  console.log(`Created:`)
  console.log(`  - ${categories.length} categories`)
  console.log(`  - ${users.length} users`)
  console.log(`  - ${customers.length} customers`)
  console.log(`  - ${products.length} products`)
  console.log(`  - ${orders.length} orders`)
  
  console.log('\n🔑 Test accounts created:')
  console.log('  Admin: admin@crmsystem.com / password123')
  console.log('  Manager: manager@crmsystem.com / password123')
  console.log('  User: employee@crmsystem.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })