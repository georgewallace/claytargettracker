import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'



interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = await params
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
    
    // Support both old (disciplineIds) and new (disciplineConfigurations) format
    const disciplineData = disciplineConfigurations || (disciplineIds ? disciplineIds.map((id: string) => ({ disciplineId: id })) : [])
    
    // Validate input
    if (!name || !location || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
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

    // Check if tournament exists
    const existingTournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        disciplines: true
      }
    })

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check permissions - only admin or creator can edit
    const canEdit = user.role === 'admin' || existingTournament.createdById === user.id
    
    if (!canEdit) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this tournament' },
        { status: 403 }
      )
    }
    
    const incomingDisciplineIds = disciplineData.map((d: any) => d.disciplineId)
    const currentDisciplineIds = existingTournament.disciplines.map(td => td.disciplineId)
    const removedDisciplineIds = currentDisciplineIds.filter((id: string) => !incomingDisciplineIds.includes(id))
    
    // Check if any removed disciplines have registrations
    if (removedDisciplineIds.length > 0) {
      const registrationsWithRemovedDisciplines = await prisma.registrationDiscipline.findMany({
        where: {
          disciplineId: {
            in: removedDisciplineIds
          },
          registration: {
            tournamentId: id
          }
        },
        include: {
          discipline: true
        }
      })
      
      if (registrationsWithRemovedDisciplines.length > 0) {
        const disciplineNames = [...new Set(registrationsWithRemovedDisciplines.map((rd: { discipline: { displayName: string } }) => rd.discipline.displayName))]
        return NextResponse.json(
          { 
            error: `Cannot remove discipline(s): ${disciplineNames.join(', ')}. Shooters are registered for this discipline.`,
            disciplinesInUse: disciplineNames
          },
          { status: 400 }
        )
      }
    }

    // Update tournament with disciplines and configurations
    // Parse dates at noon UTC to avoid timezone boundary issues
    const parseDate = (dateStr: string) => {
      // Input format: YYYY-MM-DD
      // Set time to noon UTC to avoid timezone shifts
      return new Date(`${dateStr}T12:00:00.000Z`)
    }

    // First, delete existing tournament disciplines
    await prisma.tournamentDiscipline.deleteMany({
      where: { tournamentId: id }
    })

    // Then update tournament and create new discipline links with configurations
    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        name,
        location,
        startDate: parseDate(startDate),
        endDate: parseDate(endDate),
        description,
        status: status || 'upcoming',
        // Shoot-off configuration
        ...(enableShootOffs !== undefined && { enableShootOffs }),
        ...(shootOffTriggers !== undefined && { shootOffTriggers }),
        ...(shootOffFormat !== undefined && { shootOffFormat }),
        ...(shootOffTargetsPerRound !== undefined && { shootOffTargetsPerRound }),
        ...(shootOffStartStation !== undefined && { shootOffStartStation }),
        ...(shootOffRequiresPerfect !== undefined && { shootOffRequiresPerfect }),
        disciplines: {
          create: disciplineData.map((config: any) => ({
            disciplineId: config.disciplineId,
            rounds: config.rounds ?? null,
            targets: config.targets ?? null,
            stations: config.stations ?? null
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
    
    return NextResponse.json(tournament, { status: 200 })
  } catch (error) {
    console.error('Tournament update error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to update a tournament' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

