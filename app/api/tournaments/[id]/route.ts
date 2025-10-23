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

    // Check if tournament exists
    const existingTournament = await prisma.tournament.findUnique({
      where: { id }
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
    
    // Check if any disciplines are being removed
    const currentDisciplines = await prisma.tournamentDiscipline.findMany({
      where: { tournamentId: id },
      select: { disciplineId: true }
    })
    
    const currentDisciplineIds = currentDisciplines.map(td => td.disciplineId)
    const removedDisciplineIds = currentDisciplineIds.filter(id => !disciplineIds.includes(id))
    
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
        const disciplineNames = [...new Set(registrationsWithRemovedDisciplines.map(rd => rd.discipline.displayName))]
        return NextResponse.json(
          { 
            error: `Cannot remove discipline(s): ${disciplineNames.join(', ')}. Shooters are registered for this discipline.`,
            disciplinesInUse: disciplineNames
          },
          { status: 400 }
        )
      }
    }

    // Update tournament with disciplines
    // First, delete existing tournament disciplines
    await prisma.tournamentDiscipline.deleteMany({
      where: { tournamentId: id }
    })

    // Then update tournament and create new discipline links
    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        name,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        status: status || 'upcoming',
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

