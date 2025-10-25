import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: timeSlotId } = await params
    
    // Only coaches and admins can delete time slots
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if the time slot has any squads
    const squadCount = await prisma.squad.count({
      where: { timeSlotId }
    })

    if (squadCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete time slot with squads. Please remove or reassign squads first.' },
        { status: 400 }
      )
    }

    // Delete the time slot
    await prisma.timeSlot.delete({
      where: { id: timeSlotId }
    })

    return NextResponse.json({
      message: 'Time slot deleted successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Time slot delete error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete time slot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
