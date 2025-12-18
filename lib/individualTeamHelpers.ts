import { prisma } from '@/lib/prisma'

/**
 * Get or create the individual competitors team for a tournament
 * Creates on-demand when first needed
 */
export async function getOrCreateIndividualTeam(tournamentId: string, tournamentName: string) {
  // Try to find existing individual team for this tournament
  let individualTeam = await prisma.team.findFirst({
    where: {
      isIndividualTeam: true,
      tournamentId: tournamentId
    }
  })

  // Create if doesn't exist
  if (!individualTeam) {
    individualTeam = await prisma.team.create({
      data: {
        name: `Individual - ${tournamentName}`,
        isIndividualTeam: true,
        tournamentId: tournamentId,
        affiliation: null,
        logoUrl: null
      }
    })
  }

  return individualTeam
}

/**
 * Check if a team is an individual competitors team
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
