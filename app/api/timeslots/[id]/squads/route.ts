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

// GET: List all squads for a time slot
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: timeSlotId } = await params

    const squads = await prisma.squad.findMany({
      where: { timeSlotId },
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
        },
        timeSlot: {
          include: {
            discipline: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(squads, { status: 200 })
  } catch (error) {
    console.error('Error fetching squads:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a squad
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: timeSlotId } = await params
    const { name, capacity, notes } = await request.json()

    // Check permissions (coach or admin)
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can create squads' },
        { status: 403 }
      )
    }

    // Validate time slot exists
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: { tournament: true }
    })

    if (!timeSlot) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
    }

    // Create squad
    const squad = await prisma.squad.create({
      data: {
        timeSlotId,
        name: name || 'Squad',
        capacity: capacity || timeSlot.squadCapacity,
        notes
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

    return NextResponse.json(squad, { status: 201 })
  } catch (error) {
    console.error('Error creating squad:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

