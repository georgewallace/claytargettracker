/**
 * Utility functions for squad management
 */

export interface ShooterForSquadding {
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
    shooterId: string
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
 * Check if shooter is already assigned to any squad in time slots
 */
export function isShooterAssigned(
  shooterId: string,
  timeSlots: TimeSlotForSquadding[]
): boolean {
  return timeSlots.some(slot => 
    slot.squads.some(squad => 
      squad.members.some(member => member.shooterId === shooterId)
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
  shooter: {
    teamId: string | null
    division: string | null
    team?: { name: string } | null
  }
}>): SquadClassification {
  if (members.length === 0) {
    return { type: 'open', team: null, division: null }
  }

  // Get unique teams and divisions
  const teams = new Set(members.map(m => m.shooter.teamId).filter(Boolean))
  const divisions = new Set(members.map(m => m.shooter.division).filter(Boolean))

  // Division squad: all from same team AND same division
  if (teams.size === 1 && divisions.size === 1) {
    const firstMember = members[0]
    return {
      type: 'division',
      team: firstMember.shooter.team?.name || null,
      division: firstMember.shooter.division || null
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
 * Auto-assign shooters to squads based on divisions and teams
 * Tries to keep same division together, and same team together within divisions
 */
export function generateSquadAssignments(
  shooters: ShooterForSquadding[],
  timeSlots: TimeSlotForSquadding[]
): {
  assignments: Array<{
    timeSlotId: string
    squadName: string
    shooterIds: string[]
  }>
  summary: string[]
} {
  const assignments: Array<{
    timeSlotId: string
    squadName: string
    shooterIds: string[]
  }> = []
  
  const summary: string[] = []
  
  // Filter out shooters already assigned
  const unassigned = shooters.filter(s => !isShooterAssigned(s.id, timeSlots))
  
  if (unassigned.length === 0) {
    summary.push('All shooters are already assigned to squads')
    return { assignments, summary }
  }
  
  // Group by division
  const divisions = ['Novice', 'Intermediate', 'Junior Varsity', 'Senior', 'College-Trade School']
  
  for (const division of divisions) {
    const divisionShooters = unassigned.filter(s => s.division === division)
    
    if (divisionShooters.length === 0) continue
    
    // Group by team within division
    const byTeam = new Map<string, ShooterForSquadding[]>()
    divisionShooters.forEach(shooter => {
      const teamKey = shooter.team?.id || 'no-team'
      const group = byTeam.get(teamKey) || []
      group.push(shooter)
      byTeam.set(teamKey, group)
    })
    
    // Create squads for each team
    for (const [teamKey, teamShooters] of byTeam) {
      const teamName = teamShooters[0].team?.name || 'Independent'
      
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
      
      // Distribute shooters across available slots
      const slotsPerShooter = availableSlots.length
      const shootersPerSlot = Math.ceil(teamShooters.length / slotsPerShooter)
      const squadChunks = chunk(teamShooters, shootersPerSlot)
      
      squadChunks.forEach((shooterGroup, index) => {
        const slot = availableSlots[index % availableSlots.length]
        
        assignments.push({
          timeSlotId: slot.id,
          squadName: `${division} - ${teamName}${squadChunks.length > 1 ? ` ${index + 1}` : ''}`,
          shooterIds: shooterGroup.map(s => s.id)
        })
      })
      
      summary.push(`✓ Assigned ${teamShooters.length} ${division} shooters from ${teamName}`)
    }
  }
  
  return { assignments, summary }
}

