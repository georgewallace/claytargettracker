import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'


// Assign coach to team
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { teamId } = await request.json()
    
    // Validate input
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }
    
    // Verify the user is a coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches can manage teams' },
        { status: 403 }
      )
    }
    
    // Check if user already coaches a team
    const existingTeam = await prisma.team.findFirst({
      where: { coachId: user.id }
    })
    
    if (existingTeam) {
      return NextResponse.json(
        { error: 'You are already coaching a team. Please leave that team first.' },
        { status: 400 }
      )
    }
    
    // Assign coach to team
    const team = await prisma.team.update({
      where: { id: teamId },
      data: { coachId: user.id },
      include: {
        coach: true,
        shooters: {
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

// Leave coaching position
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Find team coached by this user
    const team = await prisma.team.findFirst({
      where: { coachId: user.id }
    })
    
    if (!team) {
      return NextResponse.json(
        { error: 'You are not coaching any team' },
        { status: 400 }
      )
    }
    
    // Remove coach from team
    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: { coachId: null }
    })
    
    return NextResponse.json(updatedTeam)
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

