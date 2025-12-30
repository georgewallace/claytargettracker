import bcrypt from 'bcrypt'
import { auth } from '@/auth'
import { prisma } from './prisma'
import { headers } from 'next/headers'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function getCurrentUser() {
  // In demo mode during static generation, return null (no authentication)
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return null
  }
  
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      athlete: {
        include: {
          team: true
        }
      },
      coachedTeams: {
        include: {
          team: true
        }
      }
    }
  })
  
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Authenticate user from API key in Authorization header
 * Used for API routes that support API key authentication
 */
export async function getUserFromApiKey(): Promise<any | null> {
  const headersList = await headers()
  const authorization = headersList.get('authorization')

  if (!authorization) {
    return null
  }

  // Support both "Bearer TOKEN" and just "TOKEN" formats
  const apiKey = authorization.startsWith('Bearer ')
    ? authorization.substring(7)
    : authorization

  if (!apiKey || !apiKey.startsWith('ctt_live_')) {
    return null
  }

  try {
    // Find API key in database
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          include: {
            athlete: {
              include: {
                team: true
              }
            },
            coachedTeams: {
              include: {
                team: true
              }
            }
          }
        }
      }
    })

    if (!apiKeyRecord) {
      return null
    }

    // Check if key is active
    if (!apiKeyRecord.isActive) {
      return null
    }

    // Check if key is expired
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return null
    }

    // Update last used timestamp (fire and forget)
    prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch(err => {
      console.error('Failed to update API key lastUsedAt:', err)
    })

    return apiKeyRecord.user
  } catch (error) {
    console.error('Error authenticating with API key:', error)
    return null
  }
}

/**
 * Authenticate user from either session or API key
 * Tries session first, then falls back to API key
 */
export async function requireAuthWithApiKey() {
  // Try session auth first
  let user = await getCurrentUser()

  // If no session, try API key
  if (!user) {
    user = await getUserFromApiKey()
  }

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

