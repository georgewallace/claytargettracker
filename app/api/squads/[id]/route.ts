import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'



interface RouteParams {
  params: Promise<{
    id: string // squadId
  }>
}

// PUT: Update squad
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: squadId } = await params
    const { name, capacity, notes, teamOnly, tournamentId, disciplineId } = await request.json()

    // Check permissions (coach or admin)
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can update squads' },
        { status: 403 }
      )
    }

    // If renaming, check for duplicate names within the same discipline
    if (name !== undefined && tournamentId && disciplineId) {
      const duplicateSquad = await prisma.squad.findFirst({
        where: {
          name: name,
          id: { not: squadId },
          timeSlot: {
            tournamentId,
            disciplineId
          }
        }
      })

      if (duplicateSquad) {
        return NextResponse.json(
          { error: 'A squad with this name already exists in this discipline' },
          { status: 400 }
        )
      }
    }

    const squad = await prisma.squad.update({
      where: { id: squadId },
      data: {
        name: name !== undefined ? name : undefined,
        capacity: capacity !== undefined ? capacity : undefined,
        notes: notes !== undefined ? notes : undefined,
        teamOnly: teamOnly !== undefined ? teamOnly : undefined
      },
      include: {
        members: {
          include: {
            shooter: {
              include: {
                user: true,
                team: true
              }
            }
          }
        }
      }
    })

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
        { error: 'Only coaches and admins can delete squads' },
        { status: 403 }
      )
    }

    await prisma.squad.delete({
      where: { id: squadId }
    })

    return NextResponse.json({ message: 'Squad deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting squad:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

