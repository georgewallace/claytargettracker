import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CreateTeamModal from './CreateTeamModal'
import TeamBrowser from './TeamBrowser'

// Force dynamic rendering (required for getCurrentUser)
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function TeamsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // PERFORMANCE OPTIMIZATION: Pagination setup
  const search = await searchParams
  const currentPage = parseInt(search.page || '1')
  const itemsPerPage = 20
  const skip = (currentPage - 1) * itemsPerPage

  // PERFORMANCE OPTIMIZATION: Get total count for pagination
  const totalTeams = await prisma.team.count()
  const totalPages = Math.ceil(totalTeams / itemsPerPage)

  // PERFORMANCE OPTIMIZATION: Load paginated teams
  // Note: Athlete list is still fully loaded per team, but only for displayed teams
  const teams = await prisma.team.findMany({
    include: {
      coaches: {
        include: {
          user: true
        }
      },
      athletes: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          athletes: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    },
    skip,
    take: itemsPerPage
  })

  // Get join requests for this athlete if they are an athlete
  const joinRequests = user.athlete ? await prisma.teamJoinRequest.findMany({
    where: {
      athleteId: user.athlete.id
    },
    include: {
      team: {
        include: {
          coaches: {
            include: {
              user: true
            }
          }
        }
      }
    }
  }) : []

  // Get coach join requests if they are a coach
  const coachJoinRequests = user.role === 'coach' ? await prisma.coachJoinRequest.findMany({
    where: {
      userId: user.id
    },
    include: {
      team: {
        include: {
          coaches: {
            include: {
              user: true
            }
          }
        }
      }
    }
  }) : []

  // Get coach's team if they are a coach
  const coachTeam = user.role === 'coach' ? await prisma.teamCoach.findFirst({
    where: {
      userId: user.id
    },
    include: {
      team: {
        include: {
          coaches: {
            include: {
              user: true
            }
          },
          _count: {
            select: {
              athletes: true
            }
          }
        }
      }
    }
  }) : null

  const canCreateTeam = user.role === 'coach' || user.role === 'admin'
  const isathlete = !!user.athlete
  const hasTeam = !!coachTeam

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Teams</h1>
            <p className="text-gray-600 text-sm">
              {canCreateTeam
                ? 'Create and manage teams for tournament competition.'
                : 'Browse teams and request to join one.'}
            </p>
          </div>

          {/* Team Creation Button (Coaches/Admins Only without team) */}
          {canCreateTeam && !hasTeam && (
            <CreateTeamModal />
          )}
        </div>

        {/* Manage Team (Coaches with team) */}
        {canCreateTeam && hasTeam && coachTeam && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Manage Team</h2>
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Your Team</h3>
                <p className="text-indigo-600 text-xl font-bold mt-0.5">
                  {coachTeam.team.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {coachTeam.team._count.athletes} athlete{coachTeam.team._count.athletes !== 1 ? 's' : ''} •
                  {' '}{coachTeam.team.coaches.length} coach{coachTeam.team.coaches.length !== 1 ? 'es' : ''}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="/teams/my-team"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium text-center text-sm"
                >
                  Manage Team
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Current Team Status */}
        {user.athlete?.team && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Your Current Team</h3>
                <p className="text-indigo-600 text-lg font-bold mt-0.5">
                  {user.athlete.team.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Athlete Join Requests */}
        {isathlete && joinRequests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pending Athlete Join Requests</h3>
            <div className="space-y-2">
              {joinRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between bg-white p-4 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{request.team.name}</p>
                    {request.team.coaches.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Coach{request.team.coaches.length > 1 ? 'es' : ''}: {request.team.coaches.map(c => c.user.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Coach Join Requests */}
        {user.role === 'coach' && coachJoinRequests.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pending Coach Join Requests</h3>
            <div className="space-y-2">
              {coachJoinRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between bg-white p-4 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{request.team.name}</p>
                    {request.team.coaches.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Coach{request.team.coaches.length > 1 ? 'es' : ''}: {request.team.coaches.map(c => c.user.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'pending'
                      ? 'bg-blue-100 text-blue-800'
                      : request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Browser */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {canCreateTeam ? `All Teams (${totalTeams})` : 'Browse Teams'}
          </h2>

          {teams.length === 0 ? (
            <p className="text-gray-600 text-sm">No teams yet. Be the first to create one!</p>
          ) : (
            <TeamBrowser
              teams={teams}
              currentathlete={user.athlete || null}
              pendingRequests={joinRequests.filter(r => r.status === 'pending')}
              isCoach={user.role === 'coach'}
              hasCoachTeam={hasTeam}
              coachPendingRequests={coachJoinRequests.filter(r => r.status === 'pending')}
              currentPage={currentPage}
              totalPages={totalPages}
              totalTeams={totalTeams}
            />
          )}
        </div>
      </div>
    </div>
  )
}
