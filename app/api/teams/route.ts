import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'


export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        athletes: {
          include: {
            user: true
          }
        },
        _count: {
          select: {
            athletes: true
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
    const {
      name,
      affiliation,
      headCoach,
      headCoachEmail,
      headCoachPhone,
      address,
      city,
      state,
      zip
    } = await request.json()

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
      data: {
        name,
        affiliation: affiliation || null,
        headCoach: headCoach || null,
        headCoachEmail: headCoachEmail || null,
        headCoachPhone: headCoachPhone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        // If the creator is a coach (not admin), automatically add them to the team
        ...(user.role === 'coach' && {
          coaches: {
            create: {
              userId: user.id,
              role: 'coach'
            }
          }
        })
      },
      include: {
        coaches: {
          include: {
            user: true
          }
        }
      }
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

