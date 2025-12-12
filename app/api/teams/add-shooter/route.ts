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
        { error: 'Shooter ID is required' },
        { status: 400 }
      )
    }
    
    // Verify the user is a coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches can add shooters to teams' },
        { status: 403 }
      )
    }
    
    // Find first team coached by this user
    const team = await getUserFirstCoachedTeam(user.id)
    
    if (!team) {
      return NextResponse.json(
        { error: 'You must be coaching a team to add shooters' },
        { status: 400 }
      )
    }
    
    // Get shooter details with user
    const shooterToAdd = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { 
        user: true,
        team: true
      }
    })
    
    if (!shooterToAdd) {
      return NextResponse.json(
        { error: 'Shooter not found' },
        { status: 404 }
      )
    }
    
    // RULE: Coaches cannot be shooters
    if (shooterToAdd.user.role === 'coach' || shooterToAdd.user.role === 'admin') {
      return NextResponse.json(
        { error: 'Coaches and admins cannot be shooters on a team' },
        { status: 400 }
      )
    }
    
    // RULE: Shooters can only be on one team
    if (shooterToAdd.teamId && shooterToAdd.teamId !== team.id) {
      return NextResponse.json(
        { error: `This shooter is already on another team (${shooterToAdd.team?.name}). Shooters can only be on one team.` },
        { status: 400 }
      )
    }
    
    if (shooterToAdd.teamId === team.id) {
      return NextResponse.json(
        { error: 'This shooter is already on your team' },
        { status: 400 }
      )
    }
    
    // Update shooter's team
    const shooter = await prisma.athlete.update({
      where: { id: athleteId },
      data: { teamId: team.id },
      include: {
        user: true,
        team: true
      }
    })
    
    return NextResponse.json(shooter)
  } catch (error) {
    console.error('Add shooter error:', error)
    
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

