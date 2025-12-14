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
        { error: 'Only coaches can add athletes to teams' },
        { status: 403 }
      )
    }
    
    // Find first team coached by this user
    const team = await getUserFirstCoachedTeam(user.id)
    
    if (!team) {
      return NextResponse.json(
        { error: 'You must be coaching a team to add athlete' },
        { status: 400 }
      )
    }
    
    // Get athlete details with user
    const athleteToAdd = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { 
        user: true,
        team: true
      }
    })
    
    if (!athleteToAdd) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }
    
    // RULE: Coaches cannot be athletes
    if (athleteToAdd.user.role === 'coach' || athleteToAdd.user.role === 'admin') {
      return NextResponse.json(
        { error: 'Coaches and admins cannot be athletes on a team' },
        { status: 400 }
      )
    }
    
    // RULE: Athletes can only be on one team
    if (athleteToAdd.teamId && athleteToAdd.teamId !== team.id) {
      return NextResponse.json(
        { error: `This athlete is already on another team (${athleteToAdd.team?.name}). Athletes can only be on one team.` },
        { status: 400 }
      )
    }
    
    if (athleteToAdd.teamId === team.id) {
      return NextResponse.json(
        { error: 'This athlete is already on your team' },
        { status: 400 }
      )
    }
    
    // Update athlete's team
    const athlete = await prisma.athlete.update({
      where: { id: athleteId },
      data: { teamId: team.id },
      include: {
        user: true,
        team: true
      }
    })
    
    return NextResponse.json(athlete)
  } catch (error) {
    console.error('Add athlete error:', error)
    
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

