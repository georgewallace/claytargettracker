import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
    shootOffId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId, shootOffId } = await params
    const { winnerId } = await request.json()

    if (!winnerId) {
      return NextResponse.json(
        { error: 'Winner ID is required' },
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

    // Check permissions
    const canManage = user.role === 'admin' || tournament.createdById === user.id
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to declare winners' },
        { status: 403 }
      )
    }

    // Get shoot-off with all participants and their scores
    const shootOff = await prisma.shootOff.findUnique({
      where: { id: shootOffId },
      include: {
        participants: {
          include: {
            scores: true,
            athlete: true
          }
        }
      }
    })

    if (!shootOff) {
      return NextResponse.json(
        { error: 'Shoot-off not found' },
        { status: 404 }
      )
    }

    if (shootOff.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Shoot-off is not in progress' },
        { status: 400 }
      )
    }

    if (shootOff.winnerId) {
      return NextResponse.json(
        { error: 'Winner has already been declared' },
        { status: 400 }
      )
    }

    // Verify winner exists and is not eliminated
    const winner = shootOff.participants.find(p => p.id === winnerId)
    if (!winner) {
      return NextResponse.json(
        { error: 'Winner participant not found' },
        { status: 404 }
      )
    }

    if (winner.eliminated) {
      return NextResponse.json(
        { error: 'Cannot declare eliminated participant as winner' },
        { status: 400 }
      )
    }

    // Check if winner is the only non-eliminated participant
    const activeParticipants = shootOff.participants.filter(p => !p.eliminated)
    if (activeParticipants.length !== 1 || activeParticipants[0].id !== winnerId) {
      return NextResponse.json(
        { error: 'Winner must be the only remaining non-eliminated participant' },
        { status: 400 }
      )
    }

    // Calculate final placements based on scores
    // Sort participants by: not eliminated first, then by total score descending
    const sortedParticipants = shootOff.participants
      .map(p => ({
        id: p.id,
        athleteId: p.athleteId,
        eliminated: p.eliminated,
        totalScore: p.scores.reduce((sum, s) => sum + s.targetsHit, 0)
      }))
      .sort((a, b) => {
        // Winner (not eliminated) first
        if (!a.eliminated && b.eliminated) return -1
        if (a.eliminated && !b.eliminated) return 1
        // Then by score
        return b.totalScore - a.totalScore
      })

    // Assign final placements
    const updates = sortedParticipants.map((p, index) => 
      prisma.shootOffParticipant.update({
        where: { id: p.id },
        data: {
          finalPlace: index + 1 // 1st place = 1, 2nd place = 2, etc.
        }
      })
    )

    // Execute all updates and mark shoot-off complete
    await prisma.$transaction([
      ...updates,
      prisma.shootOff.update({
        where: { id: shootOffId },
        data: {
          winnerId: winner.athleteId, // Use shooter ID, not participant ID
          status: 'completed',
          completedAt: new Date()
        }
      })
    ])

    // Get updated shoot-off
    const updatedShootOff = await prisma.shootOff.findUnique({
      where: { id: shootOffId },
      include: {
        winner: {
          include: {
            user: true,
            team: true
          }
        },
        participants: {
          include: {
            athlete: {
              include: {
                user: true,
                team: true
              }
            }
          },
          orderBy: {
            finalPlace: 'asc'
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Winner declared successfully',
      shootOff: updatedShootOff
    })
  } catch (error) {
    console.error('Error declaring shoot-off winner:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to declare winners' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

