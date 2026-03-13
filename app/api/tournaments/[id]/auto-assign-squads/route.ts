// @ts-nocheck - Complex Prisma types with dynamic includes
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const maxDuration = 60

interface RouteParams {
  params: Promise<{ id: string }>
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

/**
 * Squad capacity rules:
 *   trap → 5 athletes
 *   everything else (skeet, sporting_clays, five_stand, super_sport) → 3 athletes
 *
 * Time-slot rules:
 *   One squad per time slot, period.
 */
function squadCapacityForDiscipline(disciplineName: string): number {
  return disciplineName === 'trap' ? 5 : 3
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only administrators can use auto-assign squads' }, { status: 403 })
    }

    const options: AutoAssignOptions = await request.json().catch(() => ({
      keepTeamsTogether: true,
      keepDivisionsTogether: true,
      keepTeamsCloseInTime: false,
      deleteExistingSquads: false,
      includeAthletesWithoutTeams: false,
      includeAthletesWithoutDivisions: false
    }))

    // ── 1. Load everything upfront ─────────────────────────────────────────

    const athleteFilter: any = {}
    if (!options.includeAthletesWithoutTeams) athleteFilter.teamId = { not: null }
    if (!options.includeAthletesWithoutDivisions) athleteFilter.division = { not: null }

    const whereClause: any = { tournamentId }
    if (Object.keys(athleteFilter).length > 0) whereClause.athlete = athleteFilter

    const timeSlotWhere: any = { tournamentId }
    if (options.activeDisciplineId) timeSlotWhere.disciplineId = options.activeDisciplineId

    const [registrations, timeSlots] = await Promise.all([
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
      })
    ])

    if (registrations.length === 0) {
      return NextResponse.json({ error: 'No registered athletes with teams found' }, { status: 400 })
    }
    if (timeSlots.length === 0) {
      return NextResponse.json({ error: 'No time slots available. Please create time slots first.' }, { status: 400 })
    }

    // ── 2. Optionally wipe existing squads ────────────────────────────────

    if (options.deleteExistingSquads) {
      await prisma.squadMember.deleteMany({ where: { squad: { timeSlot: { tournamentId } } } })
      await prisma.squad.deleteMany({ where: { timeSlot: { tournamentId } } })
      for (const ts of timeSlots) ts.squads = []
    }

    // ── 3. In-memory state ─────────────────────────────────────────────────

    // One squad per time slot. slotSquad[timeSlotId] = { id, memberCount } | null
    const slotSquad: Record<string, { id: string; memberCount: number } | null> = {}
    for (const ts of timeSlots) {
      if (ts.squads.length > 0) {
        // Use the first (and only expected) squad
        const sq = ts.squads[0]
        slotSquad[ts.id] = { id: sq.id, memberCount: sq.members.length }
      } else {
        slotSquad[ts.id] = null
      }
    }

    // Already-assigned: athleteId:disciplineId
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

    // Pending inserts flushed at end
    const pendingMembers: Array<{ squadId: string; athleteId: string; position: number }> = []
    // Temp assignments for time-conflict detection
    const tempAssignments: Array<{ athleteId: string; timeSlotId: string }> = []

    let assignmentsMade = 0
    const unassignedReasons: Record<string, { athleteName: string; teamName: string; reason: string }[]> = {}

    // Counter for squad naming: "TeamName - Division N"
    const squadNameCounter: Record<string, number> = {}

    // ── 4. Helpers ────────────────────────────────────────────────────────

    const hasTimeConflict = (athleteId: string, candidateSlot: any): boolean => {
      const candidateDate = candidateSlot.date.toISOString().split('T')[0]
      for (const a of tempAssignments) {
        if (a.athleteId !== athleteId) continue
        const assignedSlot = timeSlots.find(ts => ts.id === a.timeSlotId)
        if (!assignedSlot) continue
        if (assignedSlot.date.toISOString().split('T')[0] !== candidateDate) continue
        const { startTime: cs, endTime: ce } = candidateSlot
        const { startTime: as, endTime: ae } = assignedSlot
        if (cs < ae && ce > as) return true
      }
      return false
    }

    // Get or create the single squad for a time slot
    const getOrCreateSquad = async (ts: any, squadName: string): Promise<string> => {
      if (slotSquad[ts.id]) return slotSquad[ts.id]!.id
      // Create squad
      const sq = await prisma.squad.create({
        data: {
          timeSlotId: ts.id,
          name: squadName,
          capacity: squadCapacityForDiscipline(ts.discipline.name),
          teamOnly: false
        }
      })
      slotSquad[ts.id] = { id: sq.id, memberCount: 0 }
      return sq.id
    }

    // Build a squad name in the format "{TeamName} - {Division} {N}"
    const buildSquadName = (teamName: string, division: string): string => {
      const key = `${teamName}__${division}`
      const n = (squadNameCounter[key] ?? 0) + 1
      squadNameCounter[key] = n
      return `${teamName} - ${division} ${n}`
    }

    const assignAthletes = async (athletes: any[], disciplineId: string, disciplineName: string, disciplineDisplayName: string, disciplineTimeSlots: any[], teamName: string, division: string) => {
      const capacity = squadCapacityForDiscipline(disciplineName)
      let remaining = [...athletes]

      for (const ts of disciplineTimeSlots) {
        if (remaining.length === 0) break

        // Check time conflict — ALL remaining athletes must be able to use this slot
        // (since we keep groups together). If any conflict, skip slot.
        const conflicting = remaining.filter(a => hasTimeConflict(a.id, ts))
        if (conflicting.length > 0) continue

        // Available capacity in this slot
        const currentCount = slotSquad[ts.id]?.memberCount ?? 0
        const available = capacity - currentCount
        if (available <= 0) continue

        // Take up to `available` athletes
        const batch = remaining.splice(0, available)
        // Build a squad name only if a squad doesn't exist yet for this slot
        const squadName = slotSquad[ts.id] ? '' : buildSquadName(teamName, division)
        const squadId = await getOrCreateSquad(ts, squadName)

        for (const athlete of batch) {
          const pos = (slotSquad[ts.id]?.memberCount ?? 0) + 1
          pendingMembers.push({ squadId, athleteId: athlete.id, position: pos })
          tempAssignments.push({ athleteId: athlete.id, timeSlotId: ts.id })
          alreadyAssigned.add(`${athlete.id}:${disciplineId}`)
          slotSquad[ts.id]!.memberCount = pos
          assignmentsMade++
        }
      }

      // Any still unassigned
      if (remaining.length > 0) {
        if (!unassignedReasons[disciplineDisplayName]) unassignedReasons[disciplineDisplayName] = []
        for (const athlete of remaining) {
          unassignedReasons[disciplineDisplayName].push({
            athleteName: athlete.user.name,
            teamName: athlete.team?.name || 'No Team',
            reason: 'No time slots with available capacity'
          })
        }
      }
    }

    // ── 5. Group athletes by discipline → group key ───────────────────────

    interface AthleteGroup { athletes: any[]; teamName: string; division: string }
    const disciplineGroups: Record<string, Record<string, AthleteGroup>> = {}

    for (const reg of registrations) {
      for (const regDisc of reg.disciplines) {
        const disciplineId = regDisc.discipline.id
        if (options.activeDisciplineId && disciplineId !== options.activeDisciplineId) continue
        if (alreadyAssigned.has(`${reg.athlete.id}:${disciplineId}`)) continue

        if (!disciplineGroups[disciplineId]) disciplineGroups[disciplineId] = {}

        const teamName = reg.athlete.team?.name || 'Unaffiliated'
        const division = reg.athlete.division || 'Unassigned'

        let groupKey = 'default'
        if (options.keepTeamsTogether && options.keepDivisionsTogether) {
          groupKey = `${reg.athlete.teamId || 'noteam'}_${reg.athlete.division || 'nodiv'}`
        } else if (options.keepTeamsTogether) {
          groupKey = reg.athlete.teamId || 'noteam'
        } else if (options.keepDivisionsTogether) {
          groupKey = reg.athlete.division || 'nodiv'
        }

        if (!disciplineGroups[disciplineId][groupKey]) {
          disciplineGroups[disciplineId][groupKey] = { athletes: [], teamName, division }
        }
        disciplineGroups[disciplineId][groupKey].athletes.push(reg.athlete)
      }
    }

    // ── 6. Assign each group ───────────────────────────────────────────────

    for (const [disciplineId, groups] of Object.entries(disciplineGroups)) {
      const disciplineTimeSlots = timeSlots.filter(ts => ts.disciplineId === disciplineId)
      if (disciplineTimeSlots.length === 0) continue

      const disciplineName = disciplineTimeSlots[0].discipline.name
      const disciplineDisplayName = disciplineTimeSlots[0].discipline.displayName

      const sortedSlots = options.keepTeamsCloseInTime
        ? [...disciplineTimeSlots].sort((a, b) => {
            const dc = a.date.getTime() - b.date.getTime()
            return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime)
          })
        : disciplineTimeSlots

      for (const group of Object.values(groups)) {
        await assignAthletes(group.athletes, disciplineId, disciplineName, disciplineDisplayName, sortedSlots, group.teamName, group.division)
      }
    }

    // ── 7. Flush all member inserts ────────────────────────────────────────

    if (pendingMembers.length > 0) {
      await prisma.squadMember.createMany({ data: pendingMembers })
    }

    const unassignedCount = Object.values(unassignedReasons).reduce((sum, arr) => sum + arr.length, 0)
    const responseMessage = `Successfully assigned ${assignmentsMade} athlete${assignmentsMade !== 1 ? 's' : ''} to squads`
      + (unassignedCount > 0 ? `. ${unassignedCount} could not be assigned (no available slots).` : '')

    return NextResponse.json({
      message: responseMessage,
      assignmentsMade,
      unassignedAthletes: unassignedReasons,
      hasUnassigned: unassignedCount > 0
    }, { status: 200 })

  } catch (error) {
    console.error('Auto-assign error:', error)
    return NextResponse.json(
      { error: 'Failed to auto-assign squads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
