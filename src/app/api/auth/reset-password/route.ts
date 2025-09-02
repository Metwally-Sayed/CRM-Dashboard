import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/auth-utils'
import * as z from 'zod'

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = resetPasswordSchema.parse(body)
    const { email } = validatedData

    // Check if user exists
    const user = await getUserByEmail(email)
    if (!user) {
      // For security reasons, we don't reveal if the email exists or not
      return NextResponse.json(
        { message: 'If an account with that email exists, we have sent a password reset link.' },
        { status: 200 }
      )
    }

    // TODO: In a real application, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with an expiration time
    // 3. Send an email with the reset link
    // For now, we'll just return a success message
    
    console.log(`Password reset requested for: ${email}`)
    
    return NextResponse.json(
      { message: 'If an account with that email exists, we have sent a password reset link.' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid email address', errors: error.issues },
        { status: 400 }
      )
    }

    console.error('Password reset error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}