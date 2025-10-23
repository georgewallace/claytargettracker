import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = "force-static"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { name, location, startDate, endDate, description, status, disciplineIds } = await request.json()
    
    // Validate input
    if (!name || !location || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!disciplineIds || disciplineIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one discipline' },
        { status: 400 }
      )
    }
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'End date must be after or equal to start date' },
        { status: 400 }
      )
    }
    
    // Create tournament with disciplines
    const tournament = await prisma.tournament.create({
      data: {
        name,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        status: status || 'upcoming',
        createdById: user.id,
        disciplines: {
          create: disciplineIds.map((disciplineId: string) => ({
            disciplineId
          }))
        }
      },
      include: {
        disciplines: {
          include: {
            discipline: true
          }
        }
      }
    })
    
    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error('Tournament creation error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to create a tournament' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

