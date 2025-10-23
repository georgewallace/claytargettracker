import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { tournamentId, shooterId, disciplineIds } = await request.json()
    
    // Validate input
    if (!tournamentId || !shooterId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!disciplineIds || disciplineIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one discipline' },
        { status: 400 }
      )
    }
    
    // Verify the shooter belongs to the current user
    if (!user.shooter || user.shooter.id !== shooterId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Check if already registered
    const existing = await prisma.registration.findUnique({
      where: {
        tournamentId_shooterId: {
          tournamentId,
          shooterId
        }
      }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Already registered for this tournament' },
        { status: 400 }
      )
    }
    
    // Create registration with disciplines
    const registration = await prisma.registration.create({
      data: {
        tournamentId,
        shooterId,
        disciplines: {
          create: disciplineIds.map((disciplineId: string) => ({
            disciplineId,
            assignedBy: null // Self-selected
          }))
        }
      },
      include: {
        disciplines: {
          include: {
            discipline: true
          }
        }
      }
    })
    
    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to register' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

