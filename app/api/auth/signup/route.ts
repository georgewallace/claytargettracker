import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { rateLimiters, getIdentifier, checkRateLimit, createRateLimitHeaders } from '@/lib/ratelimit'
import { isValidEmail, isStrongPassword, sanitizeInput, validateCSRF, addSecurityHeaders } from '@/lib/security'


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
          error: 'Too many signup attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
      return addSecurityHeaders(response)
    }

    const { email, password, name, role } = await request.json()
    
    // Validate input
    if (!email || !password || !name) {
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

    // Validate password strength
    const passwordValidation = isStrongPassword(password)
    if (!passwordValidation.isValid) {
      const response = NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Sanitize name
    const sanitizedName = sanitizeInput(name)
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      const response = NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }
    
    // Validate role
    const validRoles = ['athlete', 'coach', 'admin']
    const userRole = role && validRoles.includes(role) ? role : 'athlete'
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      const response = NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: sanitizedName,
        role: userRole,
        // Only create athlete profile for athlete role
        ...(userRole === 'athlete' && {
          athlete: {
            create: {}
          }
        })
      }
    })
    
    // Return success - Auth.js will handle the session
    const response = NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { 
        status: 201,
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Signup error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addSecurityHeaders(response)
  }
}

