import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
    shootOffId: string
    roundId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId, shootOffId, roundId } = await params
    const { scores } = await request.json()

    // Validate input
    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { error: 'Scores array is required' },
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
        { error: 'You do not have permission to enter scores' },
        { status: 403 }
      )
    }

    // Get round with shoot-off
    const round = await prisma.shootOffRound.findUnique({
      where: { id: roundId },
      include: {
        shootOff: {
          include: {
            participants: {
              where: {
                eliminated: false
              }
            }
          }
        }
      }
    })

    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      )
    }

    if (round.completedAt) {
      return NextResponse.json(
        { error: 'Round is already completed' },
        { status: 400 }
      )
    }

    if (round.shootOff.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Shoot-off is not in progress' },
        { status: 400 }
      )
    }

    // Validate scores
    for (const score of scores) {
      if (typeof score.participantId !== 'string' || typeof score.targets !== 'number') {
        return NextResponse.json(
          { error: 'Invalid score format' },
          { status: 400 }
        )
      }

      if (score.targets < 0 || score.targets > tournament.shootOffTargetsPerRound) {
        return NextResponse.json(
          { error: `Targets must be between 0 and ${tournament.shootOffTargetsPerRound}` },
          { status: 400 }
        )
      }

      // Check participant exists and is active
      const participant = round.shootOff.participants.find((p: any) => p.id === score.participantId)
      if (!participant) {
        return NextResponse.json(
          { error: `Participant ${score.participantId} not found or is eliminated` },
          { status: 400 }
        )
      }
    }

    // Create score records
    await prisma.shootOffScore.createMany({
      data: scores.map((score: any) => ({
        roundId,
        participantId: score.participantId,
        targetsHit: score.targets,
        totalTargets: round.targets
      }))
    })

    // Mark round as complete
    await prisma.shootOffRound.update({
      where: { id: roundId },
      data: { completedAt: new Date() }
    })

    // Implement elimination logic based on format
    if (round.shootOff.format === 'sudden_death') {
      // Sudden Death: Eliminate anyone who doesn't have the highest score
      const highestScore = Math.max(...scores.map((s: any) => s.targets))
      const eliminatedIds = scores
        .filter((s: any) => s.targets < highestScore)
        .map((s: any) => s.participantId)

      if (eliminatedIds.length > 0) {
        await prisma.shootOffParticipant.updateMany({
          where: {
            id: { in: eliminatedIds }
          },
          data: {
            eliminated: true
          }
        })
      }
    } else if (round.shootOff.format === 'fixed_rounds') {
      // Fixed Rounds: Only eliminate after all rounds are complete
      // For now, we'll implement this in a future update
      // TODO: Track round count and eliminate lowest after final round
    } else if (round.shootOff.format === 'progressive') {
      // Progressive: Eliminate lowest scorer each round
      const lowestScore = Math.min(...scores.map((s: any) => s.targets))
      const eliminatedIds = scores
        .filter((s: any) => s.targets === lowestScore && scores.length > 2) // Keep at least 2 alive
        .map((s: any) => s.participantId)

      if (eliminatedIds.length > 0 && eliminatedIds.length < scores.length) {
        await prisma.shootOffParticipant.updateMany({
          where: {
            id: { in: eliminatedIds }
          },
          data: {
            eliminated: true
          }
        })
      }
    }

    // Check if only one participant remains
    const remainingParticipants = await prisma.shootOffParticipant.count({
      where: {
        shootOffId,
        eliminated: false
      }
    })

    // If only one remains, they're ready to be declared winner
    // But don't auto-declare - let admin do it manually

    return NextResponse.json({
      message: 'Scores submitted successfully',
      roundCompleted: true,
      remainingParticipants
    })
  } catch (error) {
    console.error('Error submitting shoot-off scores:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to submit scores' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

