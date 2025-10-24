import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getUserFirstCoachedTeam } from '@/lib/teamHelpers'
import CoachTeamManager from './CoachTeamManager'

// Force dynamic rendering (required for getCurrentUser)
export const dynamic = 'force-dynamic'

export default async function MyTeamPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.role !== 'coach' && user.role !== 'admin') {
    redirect('/teams')
  }
  
  // Find first team coached by this user
  const team = await getUserFirstCoachedTeam(user.id)
  
  // If found, fetch full details
  const teamWithDetails = team ? await prisma.team.findUnique({
    where: { id: team.id },
    include: {
      shooters: {
        include: {
          user: true,
          team: true
        },
        orderBy: {
          user: {
            name: 'asc'
          }
        }
      }
    }
  }) : null

  if (!teamWithDetails) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You're not coaching a team yet
            </h1>
            <p className="text-gray-600 mb-6">
              Go to the Teams page to become a coach of an existing team or create a new one.
            </p>
            <a
              href="/teams"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition"
            >
              Go to Teams
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Get all shooters not on this team
  const availableShooters = await prisma.shooter.findMany({
    where: {
      OR: [
        { teamId: null },
        { teamId: { not: teamWithDetails.id } }
      ]
    },
    include: {
      user: true,
      team: true
    },
    orderBy: {
      user: {
        name: 'asc'
      }
    }
  })

  // Get pending join requests for this team
  const joinRequests = await prisma.teamJoinRequest.findMany({
    where: {
      teamId: teamWithDetails.id,
      status: 'pending'
    },
    include: {
      shooter: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manage Team: {teamWithDetails.name}
          </h1>
          <p className="text-gray-600">
            Add or remove shooters from your team roster
          </p>
        </div>

        <CoachTeamManager 
          team={teamWithDetails}
          availableShooters={availableShooters}
          joinRequests={joinRequests}
        />
      </div>
    </div>
  )
}

