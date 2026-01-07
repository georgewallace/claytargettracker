import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getOrCreateIndividualTeam } from '@/lib/individualTeamHelpers'


export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { tournamentId, athleteId, disciplineIds, timeSlotPreferences } = await request.json()

    // Validate input
    if (!tournamentId || !athleteId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!disciplineIds || disciplineIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one discipline' },
        { status: 400 }
      )
    }

    // Verify the athlete belongs to the current user
    if (!user.athlete || user.athlete.id !== athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Verify tournament status is upcoming or active
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    if (tournament.status !== 'upcoming' && tournament.status !== 'active') {
      return NextResponse.json(
        { error: 'Registration is closed for this tournament' },
        { status: 400 }
      )
    }

    // Get tournament info for individual team creation
    const tournamentInfo = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, name: true, status: true }
    })

    if (!tournamentInfo) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check team registration requirement
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { team: true }
    })

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    // Prevent inactive athletes from registering
    if (athlete.isActive === false) {
      return NextResponse.json(
        { error: 'Your athlete profile is marked as inactive. Please contact your coach to reactivate your profile.' },
        { status: 403 }
      )
    }

    // Handle individual shooters (athletes without a team)
    if (!athlete.teamId) {
      // Get or create the individual team for this tournament
      const individualTeam = await getOrCreateIndividualTeam(tournamentInfo.id, tournamentInfo.name)

      // Assign athlete to the individual team
      await prisma.athlete.update({
        where: { id: athleteId },
        data: { teamId: individualTeam.id }
      })

      // Create team registration for the individual team if it doesn't exist
      await prisma.teamTournamentRegistration.upsert({
        where: {
          teamId_tournamentId: {
            teamId: individualTeam.id,
            tournamentId
          }
        },
        create: {
          teamId: individualTeam.id,
          tournamentId,
          registeredBy: user.id
        },
        update: {} // Do nothing if already exists
      })

      // Update athlete reference to include new team
      athlete.teamId = individualTeam.id
      athlete.team = individualTeam
    }

    // If athlete has a team, the team must be registered for the tournament
    // UNLESS it's an individual team (isIndividualTeam = true), which auto-registers
    if (athlete.teamId && athlete.team && !athlete.team.isIndividualTeam) {
      const teamRegistration = await prisma.teamTournamentRegistration.findUnique({
        where: {
          teamId_tournamentId: {
            teamId: athlete.teamId,
            tournamentId
          }
        }
      })

      if (!teamRegistration) {
        return NextResponse.json(
          { error: `Your team "${athlete.team?.name}" has not registered for this tournament yet. Please reach out to your coach.` },
          { status: 403 }
        )
      }
    }

    // If athlete is on an individual team, ensure the team is registered
    if (athlete.teamId && athlete.team && athlete.team.isIndividualTeam) {
      await prisma.teamTournamentRegistration.upsert({
        where: {
          teamId_tournamentId: {
            teamId: athlete.teamId,
            tournamentId
          }
        },
        create: {
          teamId: athlete.teamId,
          tournamentId,
          registeredBy: user.id
        },
        update: {} // Do nothing if already exists
      })
    }

    // Check if already registered
    const existing = await prisma.registration.findUnique({
      where: {
        tournamentId_athleteId: {
          tournamentId,
          athleteId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already registered for this tournament' },
        { status: 400 }
      )
    }

    // Validate time slot preferences if provided
    if (timeSlotPreferences) {
      for (const disciplineId of Object.keys(timeSlotPreferences)) {
        const timeSlotIds = timeSlotPreferences[disciplineId]
        if (!Array.isArray(timeSlotIds) || timeSlotIds.length === 0) continue

        // Verify all time slots exist and belong to this tournament + discipline
        const timeSlots = await prisma.timeSlot.findMany({
          where: {
            id: { in: timeSlotIds },
            tournamentId,
            disciplineId
          },
          include: {
            squads: {
              include: {
                members: true
              }
            }
          }
        })

        if (timeSlots.length !== timeSlotIds.length) {
          return NextResponse.json(
            { error: 'Invalid time slot selection' },
            { status: 400 }
          )
        }

        // Verify each time slot has available capacity (only if squads exist)
        for (const timeSlot of timeSlots) {
          // If no squads exist yet, skip capacity check (preferences are just stored)
          if (timeSlot.squads.length === 0) {
            continue
          }

          const availableCapacity = timeSlot.squads.reduce(
            (sum, squad) => sum + (squad.capacity - squad.members.length),
            0
          )

          if (availableCapacity === 0) {
            return NextResponse.json(
              { error: `Time slot at ${timeSlot.startTime} is full` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Create registration with disciplines and time slot preferences in a transaction
    const registration = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.create({
        data: {
          tournamentId,
          athleteId,
          disciplines: {
            create: disciplineIds.map((disciplineId: string) => ({
              disciplineId,
              assignedBy: null // Self-selected
            }))
          }
        },
        include: {
          disciplines: {
            include: {
              discipline: true
            }
          }
        }
      })

      // Create time slot preferences if provided
      if (timeSlotPreferences) {
        for (const regDiscipline of reg.disciplines) {
          const timeSlotIds = timeSlotPreferences[regDiscipline.disciplineId]
          if (!Array.isArray(timeSlotIds) || timeSlotIds.length === 0) continue

          // Fetch time slot details to group by date+time
          const timeSlots = await tx.timeSlot.findMany({
            where: { id: { in: timeSlotIds } },
            select: { id: true, date: true, startTime: true, endTime: true }
          })

          // Group time slot IDs by their date+time and maintain selection order
          const timeGroups: Array<{ ids: string[], time: string }> = []
          const seenTimes = new Set<string>()

          for (const timeSlotId of timeSlotIds) {
            const slot = timeSlots.find(s => s.id === timeSlotId)
            if (!slot) continue

            const timeKey = `${slot.date.toISOString().split('T')[0]}_${slot.startTime}_${slot.endTime}`

            if (!seenTimes.has(timeKey)) {
              seenTimes.add(timeKey)
              timeGroups.push({ ids: [timeSlotId], time: timeKey })
            } else {
              const group = timeGroups.find(g => g.time === timeKey)
              if (group) {
                group.ids.push(timeSlotId)
              }
            }
          }

          // Create preferences with correct ranking (all IDs for same time get same preference)
          // Note: Preferences are stored but not auto-assigned
          // Coaches will see preferences and manually assign athletes to squads
          const preferencesToCreate = timeGroups.flatMap((group, groupIndex) =>
            group.ids.map(timeSlotId => ({
              registrationDisciplineId: regDiscipline.id,
              timeSlotId,
              preference: groupIndex + 1
            }))
          )

          await tx.timeSlotPreference.createMany({
            data: preferencesToCreate
          })
        }
      }

      // Fetch and return complete registration with preferences
      return await tx.registration.findUnique({
        where: { id: reg.id },
        include: {
          disciplines: {
            include: {
              discipline: true,
              timeSlotPreferences: {
                include: {
                  timeSlot: true
                },
                orderBy: {
                  preference: 'asc'
                }
              }
            }
          }
        }
      })
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to register' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

