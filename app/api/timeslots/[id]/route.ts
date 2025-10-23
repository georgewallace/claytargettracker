import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = "force-static"

// For static export (demo mode)
export async function generateStaticParams() {
  return []
}

interface RouteParams {
  params: Promise<{
    id: string // timeSlotId
  }>
}

// PUT: Update time slot
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: timeSlotId } = await params
    const { startTime, endTime, squadCapacity, fieldNumber, stationNumber, notes } = await request.json()

    // Get time slot with tournament info
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        tournament: true
      }
    })

    if (!timeSlot) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
    }

    // Check permissions
    const canManage = user.role === 'admin' || timeSlot.tournament.createdById === user.id

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this tournament schedule' },
        { status: 403 }
      )
    }

    // Update time slot
    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id: timeSlotId },
      data: {
        startTime: startTime || timeSlot.startTime,
        endTime: endTime || timeSlot.endTime,
        squadCapacity: squadCapacity !== undefined ? squadCapacity : timeSlot.squadCapacity,
        fieldNumber: fieldNumber !== undefined ? fieldNumber : timeSlot.fieldNumber,
        stationNumber: stationNumber !== undefined ? stationNumber : timeSlot.stationNumber,
        notes: notes !== undefined ? notes : timeSlot.notes
      },
      include: {
        discipline: true,
        squads: true
      }
    })

    return NextResponse.json(updatedTimeSlot, { status: 200 })
  } catch (error) {
    console.error('Error updating time slot:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete time slot
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: timeSlotId } = await params

    // Get time slot with tournament info
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        tournament: true,
        squads: true
      }
    })

    if (!timeSlot) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
    }

    // Check permissions
    const canManage = user.role === 'admin' || timeSlot.tournament.createdById === user.id

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this tournament schedule' },
        { status: 403 }
      )
    }

    // Check if there are squads
    if (timeSlot.squads.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete time slot with existing squads. Delete squads first.' },
        { status: 400 }
      )
    }

    // Delete time slot
    await prisma.timeSlot.delete({
      where: { id: timeSlotId }
    })

    return NextResponse.json({ message: 'Time slot deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting time slot:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

