import bcrypt from 'bcrypt'
import { auth } from '@/auth'
import { prisma } from './prisma'

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

