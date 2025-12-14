import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getUserFirstCoachedTeam } from '@/lib/teamHelpers'


export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { athleteId } = await request.json()
    
    // Validate input
    if (!athleteId) {
      return NextResponse.json(
        { error: 'Athlete ID is required' },
        { status: 400 }
      )
    }
    
    // Verify the user is a coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches can remove athletes from teams' },
        { status: 403 }
      )
    }
    
    // Find first team coached by this user
    const team = await getUserFirstCoachedTeam(user.id)
    
    if (!team) {
      return NextResponse.json(
        { error: 'You must be coaching a team' },
        { status: 400 }
      )
    }
    
    // Verify athlete is on this coach's team
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId }
    })
    
    if (!athlete || athlete.teamId !== team.id) {
      return NextResponse.json(
        { error: 'This athlete is not on your team' },
        { status: 400 }
      )
    }
    
    // Remove athlete from team
    const updatedAthlete = await prisma.athlete.update({
      where: { id: athleteId },
      data: { teamId: null },
      include: {
        user: true
      }
    })
    
    return NextResponse.json(updatedAthlete)
  } catch (error) {
    console.error('Remove athlete error:', error)
    
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

