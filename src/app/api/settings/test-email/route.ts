import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Test email schema
const TestEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(1000)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Only admins can test email configuration
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate the request body
    const validatedData = TestEmailSchema.parse(body)
    
    // In a real implementation, you would:
    // 1. Get SMTP settings from system configuration
    // 2. Create a nodemailer transporter with those settings
    // 3. Send the test email
    // 4. Return success/failure based on the result
    
    // For demo purposes, we'll simulate a successful email send
    console.log(`Test email would be sent to: ${validatedData.to}`)
    console.log(`Subject: ${validatedData.subject}`)
    console.log(`Message: ${validatedData.message}`)
    console.log(`Sent by: ${session.user.email} at ${new Date().toISOString()}`)
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return NextResponse.json({
      message: 'Test email sent successfully',
      details: {
        to: validatedData.to,
        subject: validatedData.subject,
        sentAt: new Date().toISOString(),
        sentBy: session.user.email
      }
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
    
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}