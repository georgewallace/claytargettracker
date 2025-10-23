import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = "force-static"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { shooterId } = await request.json()
    
    // Validate input
    if (!shooterId) {
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
    
    // Find team coached by this user
    const team = await prisma.team.findFirst({
      where: { coachId: user.id }
    })
    
    if (!team) {
      return NextResponse.json(
        { error: 'You must be coaching a team to add shooters' },
        { status: 400 }
      )
    }
    
    // Update shooter's team
    const shooter = await prisma.shooter.update({
      where: { id: shooterId },
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

