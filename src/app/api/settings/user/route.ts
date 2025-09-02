import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// User preferences schema
const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().length(2),
  timezone: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  weeklyReports: z.boolean(),
  orderUpdates: z.boolean(),
  securityAlerts: z.boolean(),
  dashboardLayout: z.enum(['grid', 'list']),
  itemsPerPage: z.number().min(5).max(100)
})

// In-memory storage for demo purposes
// In production, this would be stored in a database
const userPreferences: Record<string, z.infer<typeof UserPreferencesSchema>> = {}

const defaultPreferences: z.infer<typeof UserPreferencesSchema> = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  weeklyReports: true,
  orderUpdates: true,
  securityAlerts: true,
  dashboardLayout: 'grid',
  itemsPerPage: 10
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user preferences or return defaults
    const preferences = userPreferences[session.user.id] || defaultPreferences
    
    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validate the request body
    const validatedData = UserPreferencesSchema.parse(body)
    
    // Update user preferences
    userPreferences[session.user.id] = {
      ...defaultPreferences,
      ...userPreferences[session.user.id],
      ...validatedData
    }
    
    // Log the preferences change
    console.log(`User preferences updated for ${session.user.email} at ${new Date().toISOString()}`)
    
    return NextResponse.json({
      message: 'User preferences updated successfully',
      preferences: userPreferences[session.user.id]
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
    
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}