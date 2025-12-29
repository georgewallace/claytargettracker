import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string // squadId
  }>
}

// PATCH: Update squad properties (name, capacity, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: squadId } = await params
    const body = await request.json()

    // Check permissions (coach or admin)
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can manage squads' },
        { status: 403 }
      )
    }

    // Validate and sanitize update data
    const updateData: any = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Squad name must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.name = body.name.trim()
    }

    if (body.capacity !== undefined) {
      const capacity = parseInt(body.capacity)
      if (isNaN(capacity) || capacity < 1 || capacity > 10) {
        return NextResponse.json(
          { error: 'Capacity must be between 1 and 10' },
          { status: 400 }
        )
      }
      updateData.capacity = capacity
    }

    if (body.teamOnly !== undefined) {
      updateData.teamOnly = Boolean(body.teamOnly)
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.division !== undefined) {
      updateData.division = body.division || null
    }

    // Update the squad
    const squad = await prisma.squad.update({
      where: { id: squadId },
      data: updateData,
      include: {
        timeSlot: {
          select: {
            tournamentId: true
          }
        },
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
    revalidatePath(`/tournaments/${squad.timeSlot.tournamentId}/squads`)

    return NextResponse.json(squad, { status: 200 })
  } catch (error) {
    console.error('Error updating squad:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete squad
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: squadId } = await params

    // Check permissions (coach or admin)
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can manage squads' },
        { status: 403 }
      )
    }

    // Get squad to access tournamentId for revalidation before deleting
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      select: {
        timeSlot: {
          select: {
            tournamentId: true
          }
        }
      }
    })

    // Delete the squad (cascade will delete squad members)
    await prisma.squad.delete({
      where: { id: squadId }
    })

    // Revalidate the squad manager page
    if (squad) {
      revalidatePath(`/tournaments/${squad.timeSlot.tournamentId}/squads`)
    }

    return NextResponse.json({ message: 'Squad deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting squad:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
