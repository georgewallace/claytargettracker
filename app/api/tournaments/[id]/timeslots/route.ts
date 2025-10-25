import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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

      // Validate date is within tournament range (compare date strings to avoid timezone issues)
      // Extract date string in YYYY-MM-DD format
      let slotDateStr: string
      if (typeof slot.date === 'string') {
        slotDateStr = slot.date.split('T')[0]
      } else {
        slotDateStr = format(new Date(slot.date), 'yyyy-MM-dd')
      }
      
      // Convert tournament dates to YYYY-MM-DD format for comparison
      const tournamentStartStr = format(new Date(tournament.startDate), 'yyyy-MM-dd')
      const tournamentEndStr = format(new Date(tournament.endDate), 'yyyy-MM-dd')
      
      if (slotDateStr < tournamentStartStr || slotDateStr > tournamentEndStr) {
        return NextResponse.json(
          { 
            error: `Time slot date must be within tournament date range (${format(new Date(tournament.startDate), 'PPP')} - ${format(new Date(tournament.endDate), 'PPP')})`
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

    // Revalidate the schedule and squads pages to show the new time slots
    revalidatePath(`/tournaments/${tournamentId}/schedule`)
    revalidatePath(`/tournaments/${tournamentId}/squads`)

    return NextResponse.json(createdSlots, { status: 201 })
  } catch (error) {
    console.error('Error creating time slots:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

