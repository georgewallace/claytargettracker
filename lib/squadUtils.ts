/**
 * Utility functions for squad management
 */

export interface AthleteForSquadding {
  id: string
  division: string | null
  grade: string | null
  teamId: string | null
  user: {
    name: string
  }
  team: {
    id: string
    name: string
  } | null
}

export interface SquadWithMembers {
  id: string
  name: string
  capacity: number
  members: Array<{
    athleteId: string
  }>
}

export interface TimeSlotForSquadding {
  id: string
  startTime: string
  endTime: string
  fieldNumber: string | null
  stationNumber: string | null
  squadCapacity: number
  squads: SquadWithMembers[]
}

/**
 * Division colors for visual coding
 */
export const divisionColors: Record<string, string> = {
  'Novice': 'bg-green-100 text-green-800 border-green-300',
  'Intermediate': 'bg-blue-100 text-blue-800 border-blue-300',
  'Junior Varsity': 'bg-purple-100 text-purple-800 border-purple-300',
  'Varsity': 'bg-orange-100 text-orange-800 border-orange-300',
  'Collegiate': 'bg-red-100 text-red-800 border-red-300',
  'Open': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Unassigned': 'bg-gray-100 text-gray-600 border-gray-300',
  // Legacy support (backwards compatibility)
  'Senior': 'bg-orange-100 text-orange-800 border-orange-300',
  'College-Trade School': 'bg-red-100 text-red-800 border-red-300',
}

/**
 * Get division color classes
 */
export function getDivisionColor(division: string | null): string {
  if (!division) return 'bg-gray-100 text-gray-800 border-gray-300'
  return divisionColors[division] || 'bg-gray-100 text-gray-800 border-gray-300'
}

/**
 * Group shooters by a field
 */
export function groupBy<T>(array: T[], key: keyof T): Map<any, T[]> {
  return array.reduce((map, item) => {
    const keyValue = item[key]
    const group = map.get(keyValue) || []
    group.push(item)
    map.set(keyValue, group)
    return map
  }, new Map())
}

/**
 * Split array into chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Check if athlete is already assigned to any squad in time slots
 */
export function isAthleteAssigned(
  athleteId: string,
  timeSlots: TimeSlotForSquadding[]
): boolean {
  return timeSlots.some(slot =>
    slot.squads.some(squad =>
      squad.members.some(member => member.athleteId === athleteId)
    )
  )
}

/**
 * Get available capacity for a squad
 */
export function getSquadAvailableCapacity(squad: SquadWithMembers): number {
  return squad.capacity - squad.members.length
}

/**
 * Format time slot label
 */
export function formatTimeSlotLabel(slot: TimeSlotForSquadding): string {
  const time = `${slot.startTime} - ${slot.endTime}`
  const location = slot.fieldNumber || slot.stationNumber || ''
  return location ? `${time} • ${location}` : time
}

/**
 * Squad classification types
 */
export type SquadType = 'division' | 'open'

export interface SquadClassification {
  type: SquadType
  team: string | null
  division: string | null
}

/**
 * Classify a squad based on its members
 * Division Squad: All members from same team AND same division
 * Open Squad: Mixed teams or divisions
 */
export function classifySquad(members: Array<{
  athlete: {
    teamId: string | null
    division: string | null
    team?: { name: string } | null
  }
}>): SquadClassification {
  if (members.length === 0) {
    return { type: 'open', team: null, division: null }
  }

  // Get unique teams and divisions
  const teams = new Set(members.map(m => m.athlete.teamId).filter(Boolean))
  const divisions = new Set(members.map(m => m.athlete.division).filter(Boolean))

  // Division squad: all from same team AND same division
  if (teams.size === 1 && divisions.size === 1) {
    const firstMember = members[0]
    return {
      type: 'division',
      team: firstMember.athlete.team?.name || null,
      division: firstMember.athlete.division || null
    }
  }

  // Otherwise, it's an open squad
  return { type: 'open', team: null, division: null }
}

/**
 * Get badge color for squad type
 */
export function getSquadTypeBadge(type: SquadType): string {
  return type === 'division'
    ? 'bg-purple-100 text-purple-800 border-purple-300'
    : 'bg-gray-100 text-gray-700 border-gray-300'
}

/**
 * Format squad classification label
 */
export function formatSquadClassification(classification: SquadClassification): string {
  if (classification.type === 'division') {
    return `Division: ${classification.team} - ${classification.division}`
  }
  return 'Open Squad'
}

/**
 * Auto-assign athletes to squads based on divisions and teams
 * Tries to keep same division together, and same team together within divisions
 */
export function generateSquadAssignments(
  athletes: AthleteForSquadding[],
  timeSlots: TimeSlotForSquadding[]
): {
  assignments: Array<{
    timeSlotId: string
    squadName: string
    athleteIds: string[]
  }>
  summary: string[]
} {
  const assignments: Array<{
    timeSlotId: string
    squadName: string
    athleteIds: string[]
  }> = []

  const summary: string[] = []

  // Filter out athletes already assigned
  const unassigned = athletes.filter(s => !isAthleteAssigned(s.id, timeSlots))

  if (unassigned.length === 0) {
    summary.push('All athletes are already assigned to squads')
    return { assignments, summary }
  }

  // Group by division
  const divisions = ['Novice', 'Intermediate', 'Junior Varsity', 'Varsity', 'Collegiate', 'Open']

  for (const division of divisions) {
    const divisionAthletes = unassigned.filter(s => s.division === division)

    if (divisionAthletes.length === 0) continue

    // Group by team within division
    const byTeam = new Map<string, AthleteForSquadding[]>()
    divisionAthletes.forEach(athlete => {
      const teamKey = athlete.team?.id || 'no-team'
      const group = byTeam.get(teamKey) || []
      group.push(athlete)
      byTeam.set(teamKey, group)
    })

    // Create squads for each team
    for (const [teamKey, teamAthletes] of byTeam) {
      const teamName = teamAthletes[0].team?.name || 'Independent'

      // Get available time slots with capacity
      const availableSlots = timeSlots.filter(slot => {
        const totalCapacity = slot.squads.reduce((sum, squad) =>
          sum + getSquadAvailableCapacity(squad), 0
        )
        return totalCapacity > 0
      })

      if (availableSlots.length === 0) {
        summary.push(`⚠️ No available capacity for ${division} - ${teamName}`)
        continue
      }

      // Distribute athletes across available slots
      const slotsPerAthlete = availableSlots.length
      const athletesPerSlot = Math.ceil(teamAthletes.length / slotsPerAthlete)
      const squadChunks = chunk(teamAthletes, athletesPerSlot)

      squadChunks.forEach((athleteGroup, index) => {
        const slot = availableSlots[index % availableSlots.length]

        assignments.push({
          timeSlotId: slot.id,
          squadName: `${division} - ${teamName}${squadChunks.length > 1 ? ` ${index + 1}` : ''}`,
          athleteIds: athleteGroup.map(s => s.id)
        })
      })

      summary.push(`✓ Assigned ${teamAthletes.length} ${division} athletes from ${teamName}`)
    }
  }

  return { assignments, summary }
}

