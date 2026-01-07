import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// POST: Create a coach join request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { teamId, message } = await request.json()

    // Must be a coach to join a team as a coach
    if (user.role !== 'coach') {
      return NextResponse.json(
        { error: 'Only coaches can request to join teams as coaches' },
        { status: 403 }
      )
    }

    // Check if coach is already coaching a team
    const existingCoachTeam = await prisma.teamCoach.findFirst({
      where: { userId: user.id }
    })

    if (existingCoachTeam) {
      return NextResponse.json(
        { error: 'You are already coaching a team' },
        { status: 400 }
      )
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check for existing request
    const existing = await prisma.coachJoinRequest.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: user.id
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending request for this team' },
        { status: 400 }
      )
    }

    // Create join request
    const joinRequest = await prisma.coachJoinRequest.create({
      data: {
        teamId,
        userId: user.id,
        message,
        status: 'pending'
      },
      include: {
        team: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json(joinRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating coach join request:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
