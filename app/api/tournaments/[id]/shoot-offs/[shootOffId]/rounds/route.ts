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
        { error: 'You do not have permission to manage this shoot-off' },
        { status: 403 }
      )
    }

    // Get shoot-off with rounds
    const shootOff = await prisma.shootOff.findUnique({
      where: { id: shootOffId },
      include: {
        tournament: true, // Include tournament to access shoot-off configuration
        rounds: {
          orderBy: {
            roundNumber: 'desc'
          },
          take: 1
        },
        participants: {
          where: {
            eliminated: false
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
        { error: 'Shoot-off must be in progress to create rounds' },
        { status: 400 }
      )
    }

    // Check if there's an incomplete round
    if (shootOff.rounds.length > 0 && !shootOff.rounds[0].completedAt) {
      return NextResponse.json(
        { error: 'Please complete the current round before creating a new one' },
        { status: 400 }
      )
    }

    // Check if there are at least 2 active participants
    if (shootOff.participants.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 active participants to create a new round' },
        { status: 400 }
      )
    }

    // Determine next round number
    const nextRoundNumber = shootOff.rounds.length > 0 
      ? shootOff.rounds[0].roundNumber + 1 
      : 1

    // TURBOPACK WORKAROUND: Use spread operator to force inclusion of all fields
    const createData = {
      ...{
        shootOffId: shootOffId,
        roundNumber: nextRoundNumber,
        targets: shootOff.tournament.shootOffTargetsPerRound
      }
    }

    // Create new shoot-off round
    const newRound = await prisma.shootOffRound.create({
      data: createData,
      include: {
        scores: true
      }
    })

    return NextResponse.json(newRound, { status: 201 })
  } catch (error) {
    console.error('Error creating shoot-off round:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to create rounds' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

