import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getUserFirstCoachedTeam } from '@/lib/teamHelpers'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params

    // Verify the user is a coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches can register teams' },
        { status: 403 }
      )
    }

    // Find first team coached by this user
    const team = await getUserFirstCoachedTeam(user.id)

    if (!team) {
      return NextResponse.json(
        { error: 'You must be coaching a team to register' },
        { status: 400 }
      )
    }

    // Verify tournament status is upcoming or active
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true, name: true }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    if (tournament.status !== 'upcoming' && tournament.status !== 'active') {
      return NextResponse.json(
        { error: 'Registration is closed for this tournament' },
        { status: 400 }
      )
    }

    // Check if team is already registered
    const existing = await prisma.teamTournamentRegistration.findUnique({
      where: {
        teamId_tournamentId: {
          teamId: team.id,
          tournamentId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Your team is already registered for this tournament' },
        { status: 400 }
      )
    }

    // Create team registration
    const teamRegistration = await prisma.teamTournamentRegistration.create({
      data: {
        teamId: team.id,
        tournamentId,
        registeredBy: user.id
      },
      include: {
        team: true,
        tournament: true
      }
    })

    return NextResponse.json({
      message: `${team.name} registered for ${tournament.name}! Athletes can self-register anytime (team registration is optional).`,
      teamRegistration
    }, { status: 201 })
  } catch (error) {
    console.error('Team registration error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
