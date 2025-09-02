import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// System settings schema
const SystemSettingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  siteDescription: z.string().max(500),
  contactEmail: z.string().email(),
  supportEmail: z.string().email(),
  timezone: z.string(),
  currency: z.string().length(3),
  language: z.string().length(2),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  emailVerificationRequired: z.boolean(),
  twoFactorEnabled: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440),
  maxLoginAttempts: z.number().min(3).max(10),
  passwordMinLength: z.number().min(6).max(32),
  requirePasswordComplexity: z.boolean(),
  dataRetentionDays: z.number().min(30).max(3650),
  backupFrequency: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
  enableAnalytics: z.boolean(),
  enableNotifications: z.boolean(),
  defaultUserRole: z.enum(['USER', 'MANAGER']),
  maxFileUploadSize: z.number().min(1).max(100),
  allowedFileTypes: z.array(z.string()),
  smtpHost: z.string(),
  smtpPort: z.number().min(1).max(65535),
  smtpUsername: z.string(),
  smtpPassword: z.string(),
  smtpSecure: z.boolean()
})

// In-memory storage for demo purposes
// In production, this would be stored in a database
let systemSettings: z.infer<typeof SystemSettingsSchema> = {
  siteName: 'CRM System',
  siteDescription: 'Customer Relationship Management System',
  contactEmail: 'contact@crmsystem.com',
  supportEmail: 'support@crmsystem.com',
  timezone: 'UTC',
  currency: 'USD',
  language: 'en',
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
  twoFactorEnabled: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  requirePasswordComplexity: true,
  dataRetentionDays: 365,
  backupFrequency: 'daily',
  logLevel: 'info',
  enableAnalytics: true,
  enableNotifications: true,
  defaultUserRole: 'USER',
  maxFileUploadSize: 10,
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpSecure: true
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Only admins can access system settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    // Don't return sensitive information like SMTP password
    const { smtpPassword, ...safeSettings } = systemSettings
    
    return NextResponse.json({
      ...safeSettings,
      smtpPassword: smtpPassword ? '••••••••' : ''
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Only admins can modify system settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate the request body
    const validatedData = SystemSettingsSchema.parse(body)
    
    // Update system settings
    systemSettings = {
      ...systemSettings,
      ...validatedData
    }
    
    // Log the settings change
    console.log(`System settings updated by ${session.user.email} at ${new Date().toISOString()}`)
    
    return NextResponse.json({
      message: 'System settings updated successfully',
      settings: systemSettings
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}