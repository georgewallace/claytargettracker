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
        { error: 'Only coaches can remove shooters from teams' },
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
    
    // Verify shooter is on this coach's team
    const shooter = await prisma.athlete.findUnique({
      where: { id: athleteId }
    })
    
    if (!shooter || shooter.teamId !== team.id) {
      return NextResponse.json(
        { error: 'This shooter is not on your team' },
        { status: 400 }
      )
    }
    
    // Remove shooter from team
    const updatedShooter = await prisma.athlete.update({
      where: { id: athleteId },
      data: { teamId: null },
      include: {
        user: true
      }
    })
    
    return NextResponse.json(updatedShooter)
  } catch (error) {
    console.error('Remove shooter error:', error)
    
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

