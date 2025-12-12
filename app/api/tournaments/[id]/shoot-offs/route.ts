import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params
    const { position, athleteIds, disciplineId } = await request.json()

    // Validate input
    if (!position || !Array.isArray(athleteIds) || athleteIds.length < 2) {
      return NextResponse.json(
        { error: 'Invalid shoot-off data. Must include position and at least 2 shooters' },
        { status: 400 }
      )
    }

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check permissions - only admin or tournament creator
    const canManage = user.role === 'admin' || tournament.createdById === user.id
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage shoot-offs for this tournament' },
        { status: 403 }
      )
    }

    // Get shooter scores to determine tied score
    const shooters = await prisma.athlete.findMany({
      where: {
        id: { in: athleteIds }
      },
      include: {
        shoots: {
          where: {
            tournamentId
          },
          include: {
            scores: true
          }
        },
        user: true
      }
    })

    // Calculate total scores
    const shooterScores = shooters.map(shooter => {
      const totalScore = shooter.shoots.reduce((sum, shoot) => {
        const shootScore = shoot.scores.reduce((s, score) => s + score.targets, 0)
        return sum + shootScore
      }, 0)
      return { shooter, totalScore }
    })

    // Verify they're actually tied
    const scores = shooterScores.map(s => s.totalScore)
    const allSameScore = scores.every(score => score === scores[0])
    if (!allSameScore) {
      return NextResponse.json(
        { error: 'Selected shooters do not have tied scores' },
        { status: 400 }
      )
    }

    const tiedScore = scores[0]

    // Create shoot-off
    const positionName = position === 1 ? '1st Place' : 
                        position === 2 ? '2nd Place' : 
                        position === 3 ? '3rd Place' : 
                        `${position}th Place`

    const shootOff = await prisma.shootOff.create({
      data: {
        tournamentId,
        disciplineId: disciplineId || null,
        position,
        status: 'pending',
        format: tournament.shootOffFormat,
        description: `${positionName} Shoot-Off - ${shooters.length} shooters tied at ${tiedScore} points`,
        participants: {
          create: athleteIds.map(athleteId => ({
            athleteId,
            tiedScore
          }))
        }
      },
      include: {
        participants: {
          include: {
            athlete: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(shootOff, { status: 201 })
  } catch (error) {
    console.error('Shoot-off creation error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to create a shoot-off' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId } = await params

    // Get all shoot-offs for this tournament
    const shootOffs = await prisma.shootOff.findMany({
      where: { tournamentId },
      include: {
        participants: {
          include: {
            athlete: {
              include: {
                user: true,
                team: true
              }
            },
            scores: {
              include: {
                round: true
              }
            }
          }
        },
        rounds: {
          include: {
            scores: true
          },
          orderBy: {
            roundNumber: 'asc'
          }
        },
        winner: {
          include: {
            user: true
          }
        },
        discipline: true
      },
      orderBy: {
        position: 'asc'
      }
    })

    return NextResponse.json(shootOffs)
  } catch (error) {
    console.error('Error fetching shoot-offs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

