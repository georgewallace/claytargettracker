import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { rateLimiters, getIdentifier, checkRateLimit, createRateLimitHeaders } from '@/lib/ratelimit'
import { isValidEmail, isStrongPassword, sanitizeInput, validateCSRF, addSecurityHeaders } from '@/lib/security'

// Calculate division based on grade and first year status
function calculateDivision(
  grade: string,
  firstYearCompetition: boolean | null
): string | undefined {
  if (!grade) return undefined

  // Novice: 5th and 6th grade
  if (grade === '5th' || grade === '6th') {
    return 'Novice'
  }

  // Intermediate: 7th and 8th grade
  if (grade === '7th' || grade === '8th') {
    return 'Intermediate'
  }

  // High school (9th-12th)
  if (['freshman', 'sophomore', 'junior', 'senior'].includes(grade)) {
    // JV: Freshman (always) OR 10-12th grade first year
    if (grade === 'freshman') {
      return 'Junior Varsity'
    }
    if (['sophomore', 'junior', 'senior'].includes(grade) && firstYearCompetition === true) {
      return 'Junior Varsity'
    }
    // Varsity: 10-12th grade not first year
    if (['sophomore', 'junior', 'senior'].includes(grade) && firstYearCompetition === false) {
      return 'Varsity'
    }
  }

  // College/Trade School
  if (grade === 'college') {
    return 'Collegiate'
  }

  return undefined
}


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

    const { email, password, firstName, lastName, role, grade, firstYearCompetition, gender, birthMonth, birthDay, birthYear } = await request.json()

    // Validate input
    if (!email || !password || !firstName || !lastName) {
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

    // Sanitize names
    const sanitizedFirstName = sanitizeInput(firstName)
    const sanitizedLastName = sanitizeInput(lastName)

    if (sanitizedFirstName.length < 1 || sanitizedFirstName.length > 50) {
      const response = NextResponse.json(
        { error: 'First name must be between 1 and 50 characters' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    if (sanitizedLastName.length < 1 || sanitizedLastName.length > 50) {
      const response = NextResponse.json(
        { error: 'Last name must be between 1 and 50 characters' },
        { status: 400 }
      )
      return addSecurityHeaders(response)
    }

    // Create full name for backwards compatibility
    const sanitizedName = `${sanitizedFirstName} ${sanitizedLastName}`.trim()
    
    // Validate role
    const validRoles = ['athlete', 'coach', 'admin']
    const userRole = role && validRoles.includes(role) ? role : 'athlete'
    
    // Check if user already exists by email
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

    // Check for placeholder user with matching name (from bulk import)
    const placeholderUser = await prisma.user.findFirst({
      where: {
        name: sanitizedName,
        email: {
          endsWith: '@placeholder.local'
        }
      },
      include: {
        athlete: true,
        coachedTeams: true
      }
    })

    let user

    if (placeholderUser) {
      // Link existing placeholder account by updating email and password
      const hashedPassword = await hashPassword(password)

      // Calculate division for athletes
      const division = userRole === 'athlete'
        ? calculateDivision(grade, firstYearCompetition)
        : undefined

      user = await prisma.user.update({
        where: { id: placeholderUser.id },
        data: {
          email,
          password: hashedPassword,
          name: sanitizedName,
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
          role: userRole, // Update role if needed
          // Update athlete profile if exists and user is athlete
          ...(userRole === 'athlete' && placeholderUser.athlete && {
            athlete: {
              update: {
                grade: grade || undefined,
                division,
                gender: gender || undefined,
                birthMonth: birthMonth || undefined,
                birthDay: birthDay || undefined,
                birthYear: birthYear || undefined
              }
            }
          })
        }
      })
    } else {
      // Hash password and create new user
      const hashedPassword = await hashPassword(password)

      // Calculate division and generate shooter ID for athletes
      const athleteData: any = {}
      if (userRole === 'athlete') {
        athleteData.grade = grade || undefined
        athleteData.division = calculateDivision(grade, firstYearCompetition)
        athleteData.gender = gender || undefined
        athleteData.birthMonth = birthMonth || undefined
        athleteData.birthDay = birthDay || undefined
        athleteData.birthYear = birthYear || undefined

        // Generate shooter ID: YY-XXXX format
        const currentYear = new Date().getFullYear()
        const yearSuffix = currentYear.toString().slice(-2) // Get last 2 digits of year

        // Find the highest shooter ID for this year
        const lastShooter = await prisma.athlete.findFirst({
          where: {
            shooterId: {
              startsWith: `${yearSuffix}-`
            }
          },
          orderBy: {
            shooterId: 'desc'
          }
        })

        let nextNumber = 1000 // Start at 1000 for new years
        if (lastShooter?.shooterId) {
          const lastNumber = parseInt(lastShooter.shooterId.split('-')[1])
          nextNumber = lastNumber + 1
        }

        athleteData.shooterId = `${yearSuffix}-${nextNumber}`
      }

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: sanitizedName,
          firstName: sanitizedFirstName,
          lastName: sanitizedLastName,
          role: userRole,
          // Only create athlete profile for athlete role if no existing profile
          ...(userRole === 'athlete' && {
            athlete: {
              create: athleteData
            }
          })
        }
      })
    }
    
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

