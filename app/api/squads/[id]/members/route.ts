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
    id: string // squadId
  }>
}

// POST: Add shooter to squad
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: squadId } = await params
    const { shooterId, position } = await request.json()

    // Check permissions (coach or admin)
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can manage squads' },
        { status: 403 }
      )
    }

    // Check squad capacity and team-only requirements
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          include: {
            shooter: {
              include: {
                team: true
              }
            }
          }
        }
      }
    })

    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    if (squad.members.length >= squad.capacity) {
      return NextResponse.json(
        { error: 'Squad is at full capacity' },
        { status: 400 }
      )
    }

    // Check if shooter is already in this squad
    const existing = await prisma.squadMember.findUnique({
      where: {
        squadId_shooterId: {
          squadId,
          shooterId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Shooter is already in this squad' },
        { status: 400 }
      )
    }

    // If squad is team-only, enforce team requirement
    if (squad.teamOnly && squad.members.length > 0) {
      // Get the shooter being added
      const newShooter = await prisma.shooter.findUnique({
        where: { id: shooterId },
        include: { team: true }
      })

      // Get team of existing squad members
      const existingTeamIds = squad.members.map(m => m.shooter.teamId).filter(Boolean)
      const firstTeamId = existingTeamIds[0]

      // Check if new shooter is from the same team
      if (newShooter && newShooter.teamId !== firstTeamId) {
        const firstTeamName = squad.members[0]?.shooter.team?.name || 'the existing team'
        return NextResponse.json(
          { 
            error: `This is a team-only squad for ${firstTeamName}. Only shooters from ${firstTeamName} can be added.` 
          },
          { status: 400 }
        )
      }

      // Check if shooter has no team
      if (!newShooter || !newShooter.teamId) {
        return NextResponse.json(
          { error: 'This is a team-only squad. This shooter must be on a team to join.' },
          { status: 400 }
        )
      }
    }

    // Add shooter to squad
    const member = await prisma.squadMember.create({
      data: {
        squadId,
        shooterId,
        position
      },
      include: {
        shooter: {
          include: {
            user: true,
            team: true
          }
        }
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding shooter to squad:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove shooter from squad
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: squadId } = await params
    const { shooterId } = await request.json()

    // Check permissions (coach or admin)
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can manage squads' },
        { status: 403 }
      )
    }

    await prisma.squadMember.delete({
      where: {
        squadId_shooterId: {
          squadId,
          shooterId
        }
      }
    })

    return NextResponse.json({ message: 'Shooter removed from squad' }, { status: 200 })
  } catch (error) {
    console.error('Error removing shooter from squad:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

