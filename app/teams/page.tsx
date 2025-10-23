import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CreateTeamForm from './CreateTeamForm'
import TeamBrowser from './TeamBrowser'

export default async function TeamsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const teams = await prisma.team.findMany({
    include: {
      coach: true,
      shooters: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          shooters: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Get join requests for this shooter if they are a shooter
  const joinRequests = user.shooter ? await prisma.teamJoinRequest.findMany({
    where: {
      shooterId: user.shooter.id
    },
    include: {
      team: {
        include: {
          coach: true
        }
      }
    }
  }) : []

  const canCreateTeam = user.role === 'coach' || user.role === 'admin'
  const isShooter = !!user.shooter

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Teams</h1>
          <p className="text-gray-600">
            {canCreateTeam 
              ? 'Create and manage teams for tournament competition.' 
              : 'Browse teams and request to join one.'}
          </p>
        </div>

        {/* Team Creation (Coaches/Admins Only) */}
        {canCreateTeam && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Team</h2>
            <CreateTeamForm />
          </div>
        )}

        {/* Current Team Status */}
        {user.shooter?.team && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Current Team</h3>
                <p className="text-indigo-600 text-xl font-bold mt-1">
                  {user.shooter.team.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Join Requests */}
        {isShooter && joinRequests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Join Requests</h3>
            <div className="space-y-3">
              {joinRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between bg-white p-4 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{request.team.name}</p>
                    {request.team.coach && (
                      <p className="text-sm text-gray-600">Coach: {request.team.coach.name}</p>
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

        {/* Team Browser */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {canCreateTeam ? `All Teams (${teams.length})` : 'Browse Teams'}
          </h2>
          
          {teams.length === 0 ? (
            <p className="text-gray-600">No teams yet. Be the first to create one!</p>
          ) : (
            <TeamBrowser 
              teams={teams} 
              currentShooter={user.shooter || null}
              pendingRequests={joinRequests.filter(r => r.status === 'pending')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
