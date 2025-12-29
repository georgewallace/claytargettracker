import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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
    const { id: squadId } = await params
    const { timeSlotId } = await request.json()
    
    // Only coaches and admins can move squads
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    if (!timeSlotId) {
      return NextResponse.json(
        { error: 'timeSlotId is required' },
        { status: 400 }
      )
    }

    // Verify the time slot exists
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      select: {
        id: true,
        tournamentId: true
      }
    })

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      )
    }

    // Move the squad to the new time slot
    const updatedSquad = await prisma.squad.update({
      where: { id: squadId },
      data: {
        timeSlotId
      },
      include: {
        members: {
          include: {
            athlete: {
              include: {
                user: true,
                team: true
              }
            }
          }
        }
      }
    })

    // Revalidate the squad manager page
    revalidatePath(`/tournaments/${timeSlot.tournamentId}/squads`)

    return NextResponse.json({
      message: 'Squad moved successfully',
      squad: updatedSquad
    }, { status: 200 })

  } catch (error) {
    console.error('Squad move error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to move squad',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

