import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = "force-static"

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        shooters: {
          include: {
            user: true
          }
        },
        _count: {
          select: {
            shooters: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Teams fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name } = await request.json()
    
    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }
    
    // Check if team name already exists
    const existing = await prisma.team.findFirst({
      where: { name }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'Team name already exists' },
        { status: 400 }
      )
    }
    
    // Create team
    const team = await prisma.team.create({
      data: { name }
    })
    
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Team creation error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to create a team' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

