import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'


// POST: Create a join request
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { teamId, message } = await request.json()

    // Must be a shooter to join a team
    if (!user.athlete) {
      return NextResponse.json(
        { error: 'Only shooters can join teams' },
        { status: 403 }
      )
    }

    // Check if shooter is already on a team
    if (user.athlete.teamId) {
      return NextResponse.json(
        { error: 'You are already on a team' },
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
    const existing = await prisma.teamJoinRequest.findUnique({
      where: {
        teamId_athleteId: {
          teamId,
          athleteId: user.athlete.id
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
    const joinRequest = await prisma.teamJoinRequest.create({
      data: {
        teamId,
        athleteId: user.athlete.id,
        message,
        status: 'pending'
      },
      include: {
        team: true,
        athlete: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(joinRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating join request:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

