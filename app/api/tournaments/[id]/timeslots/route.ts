import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { format } from 'date-fns'



interface RouteParams {
  params: Promise<{
    id: string // tournamentId
  }>
}

// GET: List all time slots for a tournament
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params

    const timeSlots = await prisma.timeSlot.findMany({
      where: { tournamentId },
      include: {
        discipline: true,
        squads: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json(timeSlots, { status: 200 })
  } catch (error) {
    console.error('Error fetching time slots:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create time slot(s)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params
    const body = await request.json()

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Check permissions - only admin or creator can manage schedule
    const canManage = user.role === 'admin' || tournament.createdById === user.id

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this tournament schedule' },
        { status: 403 }
      )
    }

    // Handle both single slot and bulk creation
    const timeSlots = Array.isArray(body) ? body : [body]

    // Validate all slots
    for (const slot of timeSlots) {
      if (!slot.disciplineId || !slot.date || !slot.startTime || !slot.endTime || !slot.squadCapacity) {
        return NextResponse.json(
          { error: 'Missing required fields: disciplineId, date, startTime, endTime, squadCapacity' },
          { status: 400 }
        )
      }

      // Validate that discipline is part of tournament
      const tournamentDiscipline = await prisma.tournamentDiscipline.findFirst({
        where: {
          tournamentId,
          disciplineId: slot.disciplineId
        }
      })

      if (!tournamentDiscipline) {
        return NextResponse.json(
          { error: 'Discipline is not part of this tournament' },
          { status: 400 }
        )
      }

      // Validate date is within tournament range
      // Handle timezone issues by allowing dates within +/- 1 day of the range
      // This accounts for timezone differences when dates are stored
      let slotDateStr: string
      if (typeof slot.date === 'string') {
        slotDateStr = slot.date.split('T')[0]
      } else {
        slotDateStr = new Date(slot.date).toISOString().split('T')[0]
      }
      
      // Get tournament date range accounting for timezone storage
      const tournamentStartUTC = new Date(tournament.startDate)
      const tournamentEndUTC = new Date(tournament.endDate)
      
      // Create date objects for comparison (all at midnight local time)
      const slotDate = new Date(slotDateStr + 'T00:00:00')
      
      // Allow dates within 1 day before start and 1 day after end to account for timezone
      const startWithBuffer = new Date(tournamentStartUTC)
      startWithBuffer.setDate(startWithBuffer.getDate() - 1)
      
      const endWithBuffer = new Date(tournamentEndUTC)
      endWithBuffer.setDate(endWithBuffer.getDate() + 1)
      
      if (slotDate < startWithBuffer || slotDate > endWithBuffer) {
        return NextResponse.json(
          { 
            error: `Time slot date must be within tournament date range (${format(tournamentStartUTC, 'PPP')} - ${format(tournamentEndUTC, 'PPP')})`
          },
          { status: 400 }
        )
      }
    }

    // Create time slots
    const createdSlots = await Promise.all(
      timeSlots.map(slot =>
        prisma.timeSlot.create({
          data: {
            tournamentId,
            disciplineId: slot.disciplineId,
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            squadCapacity: slot.squadCapacity,
            fieldNumber: slot.fieldNumber || null,
            stationNumber: slot.stationNumber || null,
            notes: slot.notes || null
          },
          include: {
            discipline: true,
            squads: true
          }
        })
      )
    )

    return NextResponse.json(createdSlots, { status: 201 })
  } catch (error) {
    console.error('Error creating time slots:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

