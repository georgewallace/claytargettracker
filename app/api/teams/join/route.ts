import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = "force-static"

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
    
    // Check if user has a shooter profile
    if (!user.shooter) {
      return NextResponse.json(
        { error: 'User does not have a shooter profile' },
        { status: 400 }
      )
    }
    
    // Update shooter's team
    const updatedShooter = await prisma.shooter.update({
      where: { id: user.shooter.id },
      data: { teamId }
    })
    
    return NextResponse.json(updatedShooter)
  } catch (error) {
    console.error('Team join error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to join a team' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

