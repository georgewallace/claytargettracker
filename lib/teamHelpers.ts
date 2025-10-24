/**
 * Helper functions for team management
 */

/**
 * Check if a user is a coach of a team
 */
export function isUserCoachOfTeam(teamWithCoaches: { coaches: { userId: string }[] }, userId: string): boolean {
  return teamWithCoaches.coaches.some(coach => coach.userId === userId)
}

/**
 * Get all coaches for a team (for display purposes)
 */
export function getTeamCoaches(teamWithCoaches: { coaches: { user: { id: string; name: string; email: string } }[] }) {
  return teamWithCoaches.coaches.map(coach => coach.user)
}

/**
 * Get the head coach of a team (if any)
 */
export function getHeadCoach(teamWithCoaches: { coaches: { role: string; user: { id: string; name: string; email: string } }[] }) {
  const headCoach = teamWithCoaches.coaches.find(coach => coach.role === 'head_coach')
  return headCoach?.user
}

