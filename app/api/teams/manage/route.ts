import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'


// Assign coach to team (coaches can only coach ONE team)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { teamId, userId } = await request.json()
    
    // If userId is provided, admin is assigning a coach. Otherwise, coach is self-assigning
    const coachUserId = userId || user.id
    
    // Validate input
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }
    
    // Check authorization: admin can assign anyone, coach can only assign themselves
    if (userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can assign coaches to teams' },
        { status: 403 }
      )
    }
    
    // Get the coach user to verify they are a coach
    const coachUser = await prisma.user.findUnique({
      where: { id: coachUserId },
      include: { athlete: true }
    })
    
    if (!coachUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Verify the user has coach or admin role
    if (coachUser.role !== 'coach' && coachUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'User must be a coach or admin' },
        { status: 400 }
      )
    }
    
    // RULE: Coaches cannot be athlete
    if (coachUser.athlete) {
      return NextResponse.json(
        { error: 'Coaches cannot be athletes on a team. This user is already a athlete.' },
        { status: 400 }
      )
    }
    
    // RULE: Check if user is already coaching another team
    const existingCoachAssignment = await prisma.teamCoach.findFirst({
      where: { userId: coachUserId }
    })
    
    if (existingCoachAssignment) {
      if (existingCoachAssignment.teamId === teamId) {
        return NextResponse.json(
          { error: 'This user is already coaching this team.' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'This user is already coaching another team. Coaches can only coach one team.' },
          { status: 400 }
        )
      }
    }
    
    // Add user as coach of team
    await prisma.teamCoach.create({
      data: {
        teamId,
        userId: coachUserId,
        role: 'coach'
      }
    })
    
    // Return updated team
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        coaches: {
          include: {
            user: true
          }
        },
        athletes: {
          include: {
            user: true
          }
        }
      }
    })
    
    return NextResponse.json(team)
  } catch (error) {
    console.error('Team management error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to manage teams' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Leave coaching position (or admin removes a coach)
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { teamId, userId } = await request.json()
    
    // If userId is provided, admin is removing a coach. Otherwise, coach is leaving
    const coachUserId = userId || user.id
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }
    
    // Check authorization: admin can remove anyone, coach can only remove themselves
    if (userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can remove other coaches from teams' },
        { status: 403 }
      )
    }
    
    // Find coach assignment
    const teamCoach = await prisma.teamCoach.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: coachUserId
        }
      }
    })
    
    if (!teamCoach) {
      return NextResponse.json(
        { error: userId ? 'This coach is not on this team' : 'You are not coaching this team' },
        { status: 400 }
      )
    }
    
    // Remove coach assignment
    await prisma.teamCoach.delete({
      where: {
        id: teamCoach.id
      }
    })
    
    return NextResponse.json({ message: 'Successfully removed coach from team' })
  } catch (error) {
    console.error('Leave coaching error:', error)
    
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

