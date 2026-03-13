// @ts-nocheck - Complex Prisma types with dynamic includes
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const maxDuration = 60

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

interface AutoAssignOptions {
  keepTeamsTogether: boolean
  keepDivisionsTogether: boolean
  keepTeamsCloseInTime: boolean
  deleteExistingSquads: boolean
  includeAthletesWithoutTeams: boolean
  includeAthletesWithoutDivisions: boolean
  activeDisciplineId?: string | null
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can use auto-assign squads' },
        { status: 403 }
      )
    }

    const options: AutoAssignOptions = await request.json().catch(() => ({
      keepTeamsTogether: true,
      keepDivisionsTogether: true,
      keepTeamsCloseInTime: false,
      deleteExistingSquads: false,
      includeAthletesWithoutTeams: false,
      includeAthletesWithoutDivisions: false
    }))

    // ── 1. Load all data in parallel upfront ──────────────────────────────

    const athleteFilter: any = {}
    if (!options.includeAthletesWithoutTeams) athleteFilter.teamId = { not: null }
    if (!options.includeAthletesWithoutDivisions) athleteFilter.division = { not: null }

    const whereClause: any = { tournamentId }
    if (Object.keys(athleteFilter).length > 0) whereClause.athlete = athleteFilter

    const timeSlotWhere: any = { tournamentId }
    if (options.activeDisciplineId) timeSlotWhere.disciplineId = options.activeDisciplineId

    const [registrations, timeSlots, tournament] = await Promise.all([
      prisma.registration.findMany({
        where: whereClause,
        include: {
          athlete: { include: { user: true, team: true } },
          disciplines: { include: { discipline: true } }
        }
      }),
      prisma.timeSlot.findMany({
        where: timeSlotWhere,
        include: {
          discipline: true,
          squads: { include: { members: true } }
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }),
      prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { disciplines: { include: { discipline: true } } }
      })
    ])

    if (registrations.length === 0) {
      return NextResponse.json({ error: 'No registered athletes with teams found' }, { status: 400 })
    }
    if (timeSlots.length === 0) {
      return NextResponse.json({ error: 'No time slots available. Please create time slots first.' }, { status: 400 })
    }
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // ── 2. Optionally wipe existing squads ────────────────────────────────

    if (options.deleteExistingSquads) {
      await prisma.squadMember.deleteMany({
        where: { squad: { timeSlot: { tournamentId } } }
      })
      await prisma.squad.deleteMany({
        where: { timeSlot: { tournamentId } }
      })
      // Clear in-memory squad lists too
      for (const ts of timeSlots) ts.squads = []
    }

    // ── 3. Build in-memory state ───────────────────────────────────────────

    // squadMemberCount[squadId] = current member count (starts from DB state)
    const squadMemberCount: Record<string, number> = {}
    // squadTeamOnly[squadId] = bool
    const squadTeamOnly: Record<string, boolean> = {}
    // squadFirstTeamId[squadId] = teamId of first member (for teamOnly checks)
    const squadFirstTeamId: Record<string, string | null> = {}
    // squadsPerTimeSlot[timeSlotId] = squad[]
    const squadsPerTimeSlot: Record<string, any[]> = {}

    for (const ts of timeSlots) {
      squadsPerTimeSlot[ts.id] = ts.squads
      for (const sq of ts.squads) {
        squadMemberCount[sq.id] = sq.members.length
        squadTeamOnly[sq.id] = sq.teamOnly
        if (sq.members.length > 0) {
          // We need teamId of the first member — not available without join, set null for now
          // (existing squads' teamOnly enforcement is best-effort without full member data)
          squadFirstTeamId[sq.id] = null
        }
      }
    }

    // Pre-build set of athletes already assigned to a discipline
    // assignedKey = athleteId + ':' + disciplineId
    const alreadyAssigned = new Set<string>()
    if (!options.deleteExistingSquads) {
      for (const ts of timeSlots) {
        for (const sq of ts.squads) {
          for (const m of sq.members) {
            alreadyAssigned.add(`${m.athleteId}:${ts.disciplineId}`)
          }
        }
      }
    }

    // Pending DB writes collected during assignment — flush at end
    const pendingMemberInserts: Array<{ squadId: string; athleteId: string; position: number }> = []
    // Temporary assignments for time-conflict checking
    const assignments: Array<{ athleteId: string; disciplineId: string; squadId: string; timeSlotId: string }> = []

    let assignmentsMade = 0
    const unassignedReasons: Record<string, { athleteName: string; teamName: string; reason: string }[]> = {}

    // ── 4. Helpers ────────────────────────────────────────────────────────

    const hasTimeConflict = (athleteId: string, targetTimeSlot: any): boolean => {
      const athleteAssignments = assignments.filter(a => a.athleteId === athleteId)
      for (const a of athleteAssignments) {
        const assignedSlot = timeSlots.find(ts => ts.id === a.timeSlotId)
        if (!assignedSlot) continue
        const targetDate = targetTimeSlot.date.toISOString().split('T')[0]
        const assignedDate = assignedSlot.date.toISOString().split('T')[0]
        if (targetDate === assignedDate) {
          const { startTime: ts, endTime: te } = targetTimeSlot
          const { startTime: as, endTime: ae } = assignedSlot
          if ((ts < ae && te > as) || (as < te && ae > ts)) return true
        }
      }
      return false
    }

    const assignAthletesToSquad = (squad: any, athletes: any[], disciplineId: string, timeSlotId: string) => {
      for (const athlete of athletes) {
        const pos = (squadMemberCount[squad.id] || 0) + 1
        pendingMemberInserts.push({ squadId: squad.id, athleteId: athlete.id, position: pos })
        assignments.push({ athleteId: athlete.id, disciplineId, squadId: squad.id, timeSlotId })
        alreadyAssigned.add(`${athlete.id}:${disciplineId}`)
        squadMemberCount[squad.id] = pos
        assignmentsMade++
      }
    }

    // Create a squad in DB immediately (we need the ID), then track it in memory
    const createSquad = async (timeSlotId: string, name: string, capacity: number, teamOnly: boolean): Promise<any> => {
      const sq = await prisma.squad.create({
        data: { timeSlotId, name, capacity, teamOnly },
        include: { members: true }
      })
      squadMemberCount[sq.id] = 0
      squadTeamOnly[sq.id] = teamOnly
      if (!squadsPerTimeSlot[timeSlotId]) squadsPerTimeSlot[timeSlotId] = []
      squadsPerTimeSlot[timeSlotId].push(sq)
      return sq
    }

    // ── 5. Group athletes by discipline → group key ───────────────────────

    interface AthleteGroup {
      key: string
      athletes: any[]
      teamId: string | null
      division: string | null
    }
    const athleteGroups: Record<string, AthleteGroup[]> = {}

    for (const reg of registrations) {
      for (const regDisc of reg.disciplines) {
        const disciplineId = regDisc.discipline.id
        if (options.activeDisciplineId && disciplineId !== options.activeDisciplineId) continue
        if (alreadyAssigned.has(`${reg.athlete.id}:${disciplineId}`)) continue

        if (!athleteGroups[disciplineId]) athleteGroups[disciplineId] = []

        let groupKey = 'default'
        if (options.keepTeamsTogether && options.keepDivisionsTogether) {
          groupKey = `${reg.athlete.teamId || 'noteam'}_${reg.athlete.division || 'nodiv'}`
        } else if (options.keepTeamsTogether) {
          groupKey = reg.athlete.teamId || 'noteam'
        } else if (options.keepDivisionsTogether) {
          groupKey = reg.athlete.division || 'nodiv'
        }

        let group = athleteGroups[disciplineId].find(g => g.key === groupKey)
        if (!group) {
          group = { key: groupKey, athletes: [], teamId: reg.athlete.teamId, division: reg.athlete.division }
          athleteGroups[disciplineId].push(group)
        }
        group.athletes.push(reg.athlete)
      }
    }

    // ── 6. Assign groups to time slots ────────────────────────────────────

    for (const [disciplineId, groups] of Object.entries(athleteGroups)) {
      let disciplineTimeSlots = timeSlots.filter(ts => ts.disciplineId === disciplineId)
      if (options.keepTeamsCloseInTime) {
        disciplineTimeSlots.sort((a, b) => {
          const dc = a.date.getTime() - b.date.getTime()
          return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime)
        })
      }
      if (disciplineTimeSlots.length === 0) continue

      const disciplineName = disciplineTimeSlots[0].discipline.name
      const squadCapacity = disciplineTimeSlots[0].squadCapacity || 5
      const isSingleSquadDiscipline = disciplineName === 'five_stand' || disciplineName === 'skeet'
      const isTrap = disciplineName === 'trap'

      let timeSlotIndex = 0

      for (const group of groups) {
        if (options.keepTeamsTogether || options.keepDivisionsTogether) {
          let groupAssigned = false
          let failureReason = ''

          for (let tsIdx = timeSlotIndex; tsIdx < disciplineTimeSlots.length; tsIdx++) {
            const timeSlot = disciplineTimeSlots[tsIdx]

            // Time conflict check for all athletes in group
            if (group.athletes.some((a: any) => hasTimeConflict(a.id, timeSlot))) {
              failureReason = 'Time conflict with other assignments'
              continue
            }

            const existingSquads = squadsPerTimeSlot[timeSlot.id] || []

            // Single-squad disciplines: only one squad per time slot
            if (isSingleSquadDiscipline) {
              if (existingSquads.length > 0) {
                const sq = existingSquads[0]
                const count = squadMemberCount[sq.id] || 0
                if (count + group.athletes.length > squadCapacity) {
                  failureReason = `Squad at this time slot is full (${count}/${squadCapacity})`
                  continue
                }
              }
            } else if (isTrap && timeSlot.fieldNumber) {
              const fieldSquads = existingSquads.filter(s => s.name.includes(timeSlot.fieldNumber))
              if (fieldSquads.length > 0) {
                const sq = fieldSquads[0]
                const count = squadMemberCount[sq.id] || 0
                if (count + group.athletes.length > squadCapacity) {
                  failureReason = `${timeSlot.fieldNumber} squad is full (${count}/${squadCapacity})`
                  continue
                }
              }
            }

            // Find existing squad with capacity
            let targetSquad = existingSquads.find(s => {
              const count = squadMemberCount[s.id] || 0
              return count + group.athletes.length <= squadCapacity
            })

            if (!targetSquad) {
              // Guard against creating extra squads for single-squad disciplines
              if (isSingleSquadDiscipline && existingSquads.length > 0) {
                failureReason = `Only one squad allowed per time slot for ${disciplineName}`
                continue
              }
              if (isTrap && timeSlot.fieldNumber) {
                const fieldSquads = existingSquads.filter(s => s.name.includes(timeSlot.fieldNumber))
                if (fieldSquads.length > 0) {
                  failureReason = `${timeSlot.fieldNumber} already has a squad`
                  continue
                }
              }

              const squadNumber = existingSquads.length + 1
              const squadName = isTrap && timeSlot.fieldNumber
                ? `${timeSlot.fieldNumber} Squad ${squadNumber}`
                : `Squad ${squadNumber}`

              targetSquad = await createSquad(timeSlot.id, squadName, squadCapacity, options.keepTeamsTogether)
            }

            assignAthletesToSquad(targetSquad, group.athletes, disciplineId, timeSlot.id)
            groupAssigned = true
            if (options.keepTeamsCloseInTime) timeSlotIndex = tsIdx
            break
          }

          if (!groupAssigned) {
            const dispName = disciplineTimeSlots[0]?.discipline?.displayName || disciplineId
            if (!unassignedReasons[dispName]) unassignedReasons[dispName] = []
            for (const athlete of group.athletes) {
              unassignedReasons[dispName].push({
                athleteName: athlete.user.name,
                teamName: athlete.team?.name || 'No Team',
                reason: failureReason || 'No available time slots'
              })
            }
          }
        } else {
          // Assign individually
          for (const athlete of group.athletes) {
            for (const timeSlot of disciplineTimeSlots) {
              if (hasTimeConflict(athlete.id, timeSlot)) continue

              const existingSquads = squadsPerTimeSlot[timeSlot.id] || []
              let targetSquad = existingSquads.find(s => (squadMemberCount[s.id] || 0) < squadCapacity)

              if (!targetSquad) {
                const squadNumber = existingSquads.length + 1
                const squadName = isTrap && timeSlot.fieldNumber
                  ? `${timeSlot.fieldNumber} Squad ${squadNumber}`
                  : `Squad ${squadNumber}`
                targetSquad = await createSquad(timeSlot.id, squadName, squadCapacity, false)
              }

              assignAthletesToSquad(targetSquad, [athlete], disciplineId, timeSlot.id)
              break
            }
          }
        }
      }
    }

    // ── 7. Flush all pending member inserts in one batch ──────────────────

    if (pendingMemberInserts.length > 0) {
      await prisma.squadMember.createMany({ data: pendingMemberInserts })
    }

    const unassignedCount = Object.values(unassignedReasons).reduce((sum, arr) => sum + arr.length, 0)
    let responseMessage = `Successfully assigned ${assignmentsMade} athlete${assignmentsMade !== 1 ? 's' : ''} to squads`
    if (unassignedCount > 0) {
      responseMessage += `. ${unassignedCount} athlete${unassignedCount !== 1 ? 's' : ''} could not be assigned.`
    }

    return NextResponse.json({
      message: responseMessage,
      assignmentsMade,
      squadsCreated: assignments.length,
      unassignedAthletes: unassignedReasons,
      hasUnassigned: unassignedCount > 0
    }, { status: 200 })

  } catch (error) {
    console.error('Auto-assign error:', error)
    return NextResponse.json(
      {
        error: 'Failed to auto-assign squads',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
