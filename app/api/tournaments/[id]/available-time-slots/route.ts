import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params
    const { searchParams } = new URL(request.url)
    const disciplineId = searchParams.get('disciplineId')
    const athleteId = searchParams.get('athleteId')

    if (!disciplineId || !athleteId) {
      return NextResponse.json(
        { error: 'disciplineId and athleteId are required' },
        { status: 400 }
      )
    }

    // Verify athlete belongs to current user (security check)
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        team: true,
        user: true
      }
    })

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })
    }

    // Only the athlete themselves can view their available slots
    if (athlete.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if team is registered (either via team registration or has athletes registered)
    let isTeamRegistered = false
    if (athlete.teamId) {
      // Check for team registration first
      const teamReg = await prisma.teamTournamentRegistration.findUnique({
        where: {
          teamId_tournamentId: {
            teamId: athlete.teamId,
            tournamentId
          }
        }
      })

      if (teamReg) {
        isTeamRegistered = true
      } else {
        // Fall back to checking if any team member is registered
        const athleteReg = await prisma.registration.findFirst({
          where: {
            tournamentId,
            athlete: {
              teamId: athlete.teamId
            }
          }
        })
        isTeamRegistered = !!athleteReg
      }
    }

    // Fetch time slots for this discipline with squads and members
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        tournamentId,
        disciplineId
      },
      include: {
        squads: {
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
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Group time slots by date+time and combine capacity
    const timeSlotsByDateTime = new Map<string, any>()

    timeSlots.forEach(slot => {
      const key = `${slot.date.toISOString().split('T')[0]}_${slot.startTime}_${slot.endTime}`

      if (!timeSlotsByDateTime.has(key)) {
        timeSlotsByDateTime.set(key, {
          date: slot.date.toISOString(),
          startTime: slot.startTime,
          endTime: slot.endTime,
          timeSlotIds: [],
          availableCapacity: 0,
          noSquadsCreated: slot.squads.length === 0
        })
      }

      const grouped = timeSlotsByDateTime.get(key)
      grouped.timeSlotIds.push(slot.id)

      // Calculate capacity for this slot
      if (slot.squads.length === 0) {
        grouped.availableCapacity += slot.squadCapacity || 5
      } else {
        // Filter squads to only include those available to this athlete
        const availableSquads = slot.squads.filter((squad: any) => {
          const hasSpace = squad.capacity > squad.members.length
          if (!hasSpace) return false

          // If squad is team-only
          if (squad.teamOnly) {
            if (!athlete.teamId) return false
            if (squad.members.length > 0) {
              const squadTeamId = squad.members[0]?.athlete?.teamId
              if (squadTeamId && squadTeamId !== athlete.teamId) {
                return false
              }
            }
          }
          return true
        })

        // Add capacity from available squads
        const slotCapacity = availableSquads.reduce(
          (sum: number, squad: any) => sum + (squad.capacity - squad.members.length),
          0
        )
        grouped.availableCapacity += slotCapacity

        // If any slot has squads, mark as having squads
        if (slot.squads.length > 0) {
          grouped.noSquadsCreated = false
        }
      }
    })

    // Convert map to array
    const availableTimeSlots = Array.from(timeSlotsByDateTime.values())

    return NextResponse.json({
      timeSlots: availableTimeSlots,
      teamRegistrationStatus: {
        hasTeam: !!athlete.teamId,
        teamId: athlete.teamId,
        teamName: athlete.team?.name || null,
        isTeamRegistered
      }
    }, {
      headers: {
        // Cache for 2 minutes, revalidate in background for up to 5 minutes
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error('Error fetching available time slots:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available time slots' },
      { status: 500 }
    )
  }
}
