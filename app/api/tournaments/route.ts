import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { 
      name, 
      location, 
      startDate, 
      endDate, 
      description, 
      status, 
      disciplineConfigurations, 
      disciplineIds,
      // Shoot-off configuration
      enableShootOffs,
      shootOffTriggers,
      shootOffFormat,
      shootOffTargetsPerRound,
      shootOffStartStation,
      shootOffRequiresPerfect
    } = await request.json()
    
    // Validate input
    if (!name || !location || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Support both old (disciplineIds) and new (disciplineConfigurations) format
    const disciplineData = disciplineConfigurations || (disciplineIds ? disciplineIds.map((id: string) => ({ disciplineId: id })) : [])
    
    if (!disciplineData || disciplineData.length === 0) {
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
    
    // Parse dates at noon UTC to avoid timezone boundary issues
    const parseDate = (dateStr: string) => {
      // Input format: YYYY-MM-DD
      // Set time to noon UTC to avoid timezone shifts
      return new Date(`${dateStr}T12:00:00.000Z`)
    }

    // Create tournament with disciplines and their configurations
    console.log('Creating tournament with discipline data:', JSON.stringify(disciplineData, null, 2))
    
    const tournament = await prisma.tournament.create({
      data: {
        name,
        location,
        startDate: parseDate(startDate),
        endDate: parseDate(endDate),
        description,
        status: status || 'upcoming',
        createdById: user.id,
        // Shoot-off configuration
        enableShootOffs: enableShootOffs !== undefined ? enableShootOffs : true,
        shootOffTriggers: shootOffTriggers || null,
        shootOffFormat: shootOffFormat || 'sudden_death',
        shootOffTargetsPerRound: shootOffTargetsPerRound !== undefined ? shootOffTargetsPerRound : 2,
        shootOffStartStation: shootOffStartStation || null,
        shootOffRequiresPerfect: shootOffRequiresPerfect !== undefined ? shootOffRequiresPerfect : false,
        disciplines: {
          create: disciplineData.map((config: any) => ({
            disciplineId: config.disciplineId,
            rounds: config.rounds !== undefined ? config.rounds : null,
            targets: config.targets !== undefined ? config.targets : null,
            stations: config.stations !== undefined ? config.stations : null
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
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to create a tournament' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

