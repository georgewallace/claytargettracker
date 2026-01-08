import { prisma } from '@/lib/prisma'

/**
 * Get or create the global unaffiliated team
 * This is a single team used across ALL tournaments for athletes without a team
 * Creates on-demand when first needed
 */
export async function getOrCreateIndividualTeam() {
  // Try to find existing global individual team (not tournament-specific)
  let individualTeam = await prisma.team.findFirst({
    where: {
      isIndividualTeam: true,
      tournamentId: null // Global team, not tournament-specific
    }
  })

  // Create if doesn't exist
  if (!individualTeam) {
    individualTeam = await prisma.team.create({
      data: {
        name: 'Unaffiliated',
        isIndividualTeam: true,
        tournamentId: null, // Not tournament-specific
        affiliation: null,
        logoUrl: null
      }
    })
  }

  return individualTeam
}

/**
 * Check if a team is an unaffiliated team
 */
export function isIndividualTeam(team: { isIndividualTeam: boolean } | null): boolean {
  return team?.isIndividualTeam === true
}

/**
 * Get display name for a team (shows "Individual" for individual teams)
 */
export function getTeamDisplayName(team: { name: string; isIndividualTeam: boolean }): string {
  if (team.isIndividualTeam) {
    return 'Individual'
  }
  return team.name
}
