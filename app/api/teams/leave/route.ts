import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if user has a shooter profile
    if (!user.athlete) {
      return NextResponse.json(
        { error: 'User does not have a shooter profile' },
        { status: 400 }
      )
    }
    
    // Remove shooter from team
    const updatedShooter = await prisma.athlete.update({
      where: { id: user.athlete.id },
      data: { teamId: null }
    })
    
    return NextResponse.json(updatedShooter)
  } catch (error) {
    console.error('Team leave error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to leave a team' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

