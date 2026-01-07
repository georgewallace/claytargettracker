import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'

interface RouteParams {
  params: Promise<{
    id: string // join request ID
  }>
}

// PUT: Approve or reject a coach join request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: requestId } = await params
    const { action } = await request.json() // 'approve' or 'reject'

    // Get the join request
    const joinRequest = await prisma.coachJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: true,
        user: true
      }
    })

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    // Check authorization: must be a coach of the team or an admin
    const isCoach = await isUserCoachOfTeam(user.id, joinRequest.team.id)
    const isAdmin = user.role === 'admin'

    if (!isCoach && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the team coach or an admin can approve/reject requests' },
        { status: 403 }
      )
    }

    if (action === 'approve') {
      // Verify the user requesting to join is a coach
      if (joinRequest.user.role !== 'coach') {
        return NextResponse.json(
          { error: 'Only coaches can be added as team coaches' },
          { status: 400 }
        )
      }

      // Check if user is already coaching another team
      const existingCoachTeam = await prisma.teamCoach.findFirst({
        where: { userId: joinRequest.userId },
        include: { team: true }
      })

      if (existingCoachTeam) {
        return NextResponse.json(
          { error: `This coach is already coaching another team (${existingCoachTeam.team.name})` },
          { status: 400 }
        )
      }

      // Approve: Add coach to team and update request status
      await prisma.$transaction([
        prisma.teamCoach.create({
          data: {
            teamId: joinRequest.teamId,
            userId: joinRequest.userId,
            role: 'coach'
          }
        }),
        prisma.coachJoinRequest.update({
          where: { id: requestId },
          data: { status: 'approved' }
        })
      ])

      return NextResponse.json({ message: 'Request approved' }, { status: 200 })
    } else if (action === 'reject') {
      // Reject: Update request status
      await prisma.coachJoinRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' }
      })

      return NextResponse.json({ message: 'Request rejected' }, { status: 200 })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing coach join request:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a coach join request (coach can cancel their own request)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: requestId } = await params

    const joinRequest = await prisma.coachJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: true,
        user: true
      }
    })

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    // Check authorization: coach who made the request, team coach, or admin
    const isRequester = joinRequest.userId === user.id
    const isCoach = await isUserCoachOfTeam(user.id, joinRequest.team.id)
    const isAdmin = user.role === 'admin'

    if (!isRequester && !isCoach && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.coachJoinRequest.delete({
      where: { id: requestId }
    })

    return NextResponse.json({ message: 'Request cancelled' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting coach join request:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
