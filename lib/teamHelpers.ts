import { prisma } from './prisma'

/**
 * Check if a user is a coach of a specific team
 */
export async function isUserCoachOfTeam(userId: string, teamId: string): Promise<boolean> {
  const teamCoach = await prisma.teamCoach.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      }
    }
  })
  return !!teamCoach
}

/**
 * Get the team that a user coaches (coaches can only coach ONE team)
 */
export async function getUserCoachedTeam(userId: string) {
  const teamCoach = await prisma.teamCoach.findFirst({
    where: { userId },
    include: {
      team: {
        include: {
          athletes: {
            include: {
              user: true
            }
          }
        }
      }
    }
  })
  return teamCoach?.team || null
}

/**
 * Check if a user is already coaching a team
 */
export async function isUserCoachingAnyTeam(userId: string): Promise<boolean> {
  const teamCoach = await prisma.teamCoach.findFirst({
    where: { userId }
  })
  return !!teamCoach
}

/**
 * For backward compatibility - same as getUserCoachedTeam since coaches can only coach one team
 */
export async function getUserFirstCoachedTeam(userId: string) {
  return getUserCoachedTeam(userId)
}
