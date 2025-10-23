import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = "force-static"

interface RouteParams {
  params: Promise<{
    id: string // join request ID
  }>
}

// For static export (demo mode) - returns empty array since API routes aren't used in demo
export async function generateStaticParams() {
  return []
}

// PUT: Approve or reject a join request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: requestId } = await params
    const { action } = await request.json() // 'approve' or 'reject'

    // Get the join request
    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: true,
        shooter: true
      }
    })

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    // Check authorization: must be the coach of the team or an admin
    const isCoach = joinRequest.team.coachId === user.id
    const isAdmin = user.role === 'admin'

    if (!isCoach && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the team coach or an admin can approve/reject requests' },
        { status: 403 }
      )
    }

    if (action === 'approve') {
      // Check if shooter is already on another team
      const shooter = await prisma.shooter.findUnique({
        where: { id: joinRequest.shooterId }
      })

      if (shooter?.teamId) {
        return NextResponse.json(
          { error: 'This shooter is already on a team' },
          { status: 400 }
        )
      }

      // Approve: Add shooter to team and update request status
      await prisma.$transaction([
        prisma.shooter.update({
          where: { id: joinRequest.shooterId },
          data: { teamId: joinRequest.teamId }
        }),
        prisma.teamJoinRequest.update({
          where: { id: requestId },
          data: { status: 'approved' }
        })
      ])

      return NextResponse.json({ message: 'Request approved' }, { status: 200 })
    } else if (action === 'reject') {
      // Reject: Update request status
      await prisma.teamJoinRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' }
      })

      return NextResponse.json({ message: 'Request rejected' }, { status: 200 })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing join request:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a join request (shooter can cancel their own request)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: requestId } = await params

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: true,
        shooter: true
      }
    })

    if (!joinRequest) {
      return NextResponse.json({ error: 'Join request not found' }, { status: 404 })
    }

    // Check authorization: shooter who made the request, team coach, or admin
    const isRequester = user.shooter && joinRequest.shooterId === user.shooter.id
    const isCoach = joinRequest.team.coachId === user.id
    const isAdmin = user.role === 'admin'

    if (!isRequester && !isCoach && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.teamJoinRequest.delete({
      where: { id: requestId }
    })

    return NextResponse.json({ message: 'Request cancelled' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting join request:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

