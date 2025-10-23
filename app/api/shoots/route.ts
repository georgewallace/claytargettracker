import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { tournamentId, shooterId, disciplineId, scores } = await request.json()
    
    // Validate input
    if (!tournamentId || !shooterId || !disciplineId || !scores) {
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
      },
      include: {
        disciplines: true
      }
    })
    
    if (!registration) {
      return NextResponse.json(
        { error: 'Shooter is not registered for this tournament' },
        { status: 400 }
      )
    }
    
    // Check if shooter is registered for this discipline
    const isRegisteredForDiscipline = registration.disciplines.some(
      d => d.disciplineId === disciplineId
    )
    
    if (!isRegisteredForDiscipline) {
      return NextResponse.json(
        { error: 'Shooter is not registered for this discipline' },
        { status: 400 }
      )
    }
    
    // Find or create the shoot
    let shoot = await prisma.shoot.findUnique({
      where: {
        tournamentId_shooterId_disciplineId: {
          tournamentId,
          shooterId,
          disciplineId
        }
      },
      include: {
        scores: true
      }
    })
    
    if (shoot) {
      // Delete existing scores
      await prisma.score.deleteMany({
        where: { shootId: shoot.id }
      })
      
      // Create new scores
      await prisma.score.createMany({
        data: scores.map((score: any) => ({
          shootId: shoot.id,
          station: score.station,
          targets: score.targets,
          totalTargets: score.totalTargets
        }))
      })
      
      // Update the shoot
      shoot = await prisma.shoot.update({
        where: { id: shoot.id },
        data: { updatedAt: new Date() },
        include: {
          scores: true
        }
      })
    } else {
      // Create new shoot with scores
      shoot = await prisma.shoot.create({
        data: {
          tournamentId,
          shooterId,
          disciplineId,
          scores: {
            create: scores.map((score: any) => ({
              station: score.station,
              targets: score.targets,
              totalTargets: score.totalTargets
            }))
          }
        },
        include: {
          scores: true
        }
      })
    }
    
    return NextResponse.json(shoot, { status: 201 })
  } catch (error) {
    console.error('Shoot entry error:', error)
    
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

