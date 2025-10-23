import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { tournamentId, shooterId, station, targets, totalTargets } = await request.json()
    
    // Validate input
    if (!tournamentId || !shooterId || station === undefined || targets === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Verify the shooter belongs to the current user or user is admin
    if (!user.shooter || (user.shooter.id !== shooterId && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Check if shooter is registered for the tournament
    const registration = await prisma.registration.findUnique({
      where: {
        tournamentId_shooterId: {
          tournamentId,
          shooterId
        }
      }
    })
    
    if (!registration) {
      return NextResponse.json(
        { error: 'Shooter is not registered for this tournament' },
        { status: 400 }
      )
    }
    
    // Upsert score (create or update)
    const score = await prisma.score.upsert({
      where: {
        tournamentId_shooterId_station: {
          tournamentId,
          shooterId,
          station
        }
      },
      update: {
        targets,
        totalTargets: totalTargets || 25
      },
      create: {
        tournamentId,
        shooterId,
        station,
        targets,
        totalTargets: totalTargets || 25
      }
    })
    
    return NextResponse.json(score, { status: 201 })
  } catch (error) {
    console.error('Score entry error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to enter scores' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

