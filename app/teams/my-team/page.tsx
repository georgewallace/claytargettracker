import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import CoachTeamManager from './CoachTeamManager'

export default async function MyTeamPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.role !== 'coach' && user.role !== 'admin') {
    redirect('/teams')
  }
  
  // Find team coached by this user
  const team = await prisma.team.findFirst({
    where: { coachId: user.id },
    include: {
      shooters: {
        include: {
          user: true
        },
        orderBy: {
          user: {
            name: 'asc'
          }
        }
      }
    }
  })

  if (!team) {
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
        { teamId: { not: team.id } }
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
      teamId: team.id,
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
            Manage Team: {team.name}
          </h1>
          <p className="text-gray-600">
            Add or remove shooters from your team roster
          </p>
        </div>

        <CoachTeamManager 
          team={team}
          availableShooters={availableShooters}
          joinRequests={joinRequests}
        />
      </div>
    </div>
  )
}

