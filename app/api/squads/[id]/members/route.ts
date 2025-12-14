import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'



interface RouteParams {
  params: Promise<{
    id: string // squadId
  }>
}

// POST: Add athlete to squad
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: squadId } = await params
    const { athleteId, position } = await request.json()

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
            athlete: {
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

    // Check if athlete is already in this squad
    const existing = await prisma.squadMember.findUnique({
      where: {
        squadId_athleteId: {
          squadId,
          athleteId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Athlete is already in this squad' },
        { status: 400 }
      )
    }

    // If squad is team-only, enforce team requirement
    if (squad.teamOnly && squad.members.length > 0) {
      // Get the athlete being added
      const newAthlete = await prisma.athlete.findUnique({
        where: { id: athleteId },
        include: { team: true }
      })

      // Get team of existing squad members
      const existingTeamIds = squad.members.map((m: { athlete: { teamId: string | null } }) => m.athlete.teamId).filter(Boolean)
      const firstTeamId = existingTeamIds[0]

      // Check if new athlete is from the same team
      if (newAthlete && newAthlete.teamId !== firstTeamId) {
        const firstTeamName = squad.members[0]?.athlete.team?.name || 'the existing team'
        return NextResponse.json(
          { 
            error: `This is a team-only squad for ${firstTeamName}. Only athletes from ${firstTeamName} can be added.` 
          },
          { status: 400 }
        )
      }

      // Check if athlete has no team
      if (!newAthlete || !newAthlete.teamId) {
        return NextResponse.json(
          { error: 'This is a team-only squad. This athlete must be on a team to join.' },
          { status: 400 }
        )
      }
    }

    // Add athlete to squad
    const member = await prisma.squadMember.create({
      data: {
        squadId,
        athleteId,
        position
      },
      include: {
        athlete: {
          include: {
            user: true,
            team: true
          }
        }
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding athlete to squad:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Remove athlete from squad
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: squadId } = await params
    const { athleteId } = await request.json()

    // Check permissions (coach or admin)
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can manage squads' },
        { status: 403 }
      )
    }

    await prisma.squadMember.delete({
      where: {
        squadId_athleteId: {
          squadId,
          athleteId
        }
      }
    })

    return NextResponse.json({ message: 'Athlete removed from squad' }, { status: 200 })
  } catch (error) {
    console.error('Error removing athlete from squad:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

