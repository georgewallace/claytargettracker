import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: teamId } = await params

    // Get the team to check permissions
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        coaches: {
          where: { userId: user.id }
        }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check authorization: admin can edit any team, coaches can only edit their own team
    const isCoachOfTeam = team.coaches.length > 0
    if (user.role !== 'admin' && !isCoachOfTeam) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this team' },
        { status: 403 }
      )
    }

    const {
      name,
      affiliation,
      headCoach,
      headCoachEmail,
      headCoachPhone,
      address,
      city,
      state,
      zip
    } = await request.json()

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name.trim(),
        affiliation: affiliation || null,
        headCoach: headCoach || null,
        headCoachEmail: headCoachEmail || null,
        headCoachPhone: headCoachPhone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null
      }
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('Team update error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to update teams' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
