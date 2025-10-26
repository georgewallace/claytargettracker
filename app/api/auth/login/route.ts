import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { createSession } from '@/lib/session'
import { rateLimiters, getIdentifier, checkRateLimit, createRateLimitHeaders } from '@/lib/ratelimit'
import { isValidEmail, validateCSRF, addSecurityHeaders } from '@/lib/security'


export async function POST(request: NextRequest) {
  try {
    // Validate CSRF
    if (!validateCSRF(request)) {
      const response = NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      )
      return addSecurityHeaders(response)
    }

    // Check rate limit (5 attempts per 15 minutes)
    const identifier = getIdentifier(request)
    const rateLimitResult = await checkRateLimit(rateLimiters.auth, identifier)
    
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
      return addSecurityHeaders(response)
    }

    const { email, password } = await request.json()
    
    // Validate input
    if (!email || !password) {
      const response = NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Validate email format
    if (!isValidEmail(email)) {
      const response = NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
      return addSecurityHeaders(response)
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
      return addSecurityHeaders(response)
    }
    
    // Create session
    await createSession(user.id)
    
    const response = NextResponse.json(
      { message: 'Login successful', userId: user.id },
      { 
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Login error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addSecurityHeaders(response)
  }
}

