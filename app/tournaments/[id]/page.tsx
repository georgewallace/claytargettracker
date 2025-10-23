import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { format } from 'date-fns'
import Link from 'next/link'
import RegisterButton from './RegisterButton'
import CoachRegistration from './CoachRegistration'
import RemoveRegistrationButton from './RemoveRegistrationButton'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      createdBy: true,
      disciplines: {
        include: {
          discipline: true
        }
      },
      registrations: {
        include: {
          shooter: {
            include: {
              user: true,
              team: true
            }
          },
          disciplines: {
            include: {
              discipline: true
            }
          }
        }
      },
      shoots: {
        include: {
          shooter: {
            include: {
              user: true,
              team: true
            }
          },
          discipline: true,
          scores: true
        }
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  // Get all shooters for coach registration
  const allShooters = await prisma.shooter.findMany({
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

  const registeredShooterIds = tournament.registrations.map(r => r.shooterId)
  const isCoach = user?.role === 'coach' || user?.role === 'admin'

  // Check if current user is registered
  const isRegistered = user?.shooter && tournament.registrations.some(
    reg => reg.shooterId === user.shooter?.id
  )

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return badges[status as keyof typeof badges] || badges.upcoming
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Coach Registration */}
        {isCoach && tournament.status === 'upcoming' && (
          <CoachRegistration 
            tournamentId={tournament.id}
            allShooters={allShooters}
            registeredShooterIds={registeredShooterIds}
            tournamentDisciplines={tournament.disciplines.map(td => td.discipline)}
          />
        )}

        {/* Tournament Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {tournament.name}
              </h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(tournament.status)}`}>
                {tournament.status}
              </span>
            </div>
            
            <div className="flex gap-3">
              {/* Leaderboard button - visible to everyone */}
              <Link
                href={`/tournaments/${tournament.id}/leaderboard`}
                className="bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition font-medium"
              >
                🏆 Leaderboard
              </Link>
              
              {/* Enter Scores button for coaches and admins */}
              {user && (user.role === 'coach' || user.role === 'admin') && (
                <Link
                  href={`/tournaments/${tournament.id}/scores`}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-medium"
                >
                  Enter Scores
                </Link>
              )}
              
              {/* Manage Squads button for coaches and admins */}
              {user && (user.role === 'coach' || user.role === 'admin') && (
                <Link
                  href={`/tournaments/${tournament.id}/squads`}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-medium"
                >
                  Manage Squads
                </Link>
              )}
              
              {/* Schedule button for admin or creator */}
              {user && (user.role === 'admin' || tournament.createdById === user.id) && (
                <>
                  <Link
                    href={`/tournaments/${tournament.id}/schedule`}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium"
                  >
                    Manage Schedule
                  </Link>
                  <Link
                    href={`/tournaments/${tournament.id}/edit`}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition font-medium"
                  >
                    Edit Tournament
                  </Link>
                </>
              )}
              
              {/* Register button for shooters */}
              {user && user.shooter && !isRegistered && tournament.status === 'upcoming' && (
                <RegisterButton 
                  tournamentId={tournament.id} 
                  shooterId={user.shooter.id}
                  tournamentDisciplines={tournament.disciplines.map(td => td.discipline)}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <span className="font-semibold mr-2">📍 Location:</span>
                {tournament.location}
              </div>
              <div className="flex items-center text-gray-700">
                <span className="font-semibold mr-2">📅 Date:</span>
                {format(new Date(tournament.startDate), 'PPP')}
                {tournament.startDate !== tournament.endDate && (
                  <> - {format(new Date(tournament.endDate), 'PPP')}</>
                )}
              </div>
              <div className="flex items-center text-gray-700">
                <span className="font-semibold mr-2">👥 Registered:</span>
                {tournament.registrations.length} shooters
              </div>
              <div className="flex items-center text-gray-700">
                <span className="font-semibold mr-2">👤 Organizer:</span>
                {tournament.createdBy.name}
              </div>
            </div>

            {tournament.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{tournament.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Registered Shooters */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Registered Shooters ({tournament.registrations.length})
          </h2>
          
          {tournament.registrations.length === 0 ? (
            <p className="text-gray-600">No shooters registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournament.registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-900">
                      {registration.shooter.user.name}
                    </div>
                    {/* Remove button for coaches/admins */}
                    {isCoach && (
                      <RemoveRegistrationButton 
                        registrationId={registration.id}
                        shooterName={registration.shooter.user.name}
                        isCompact={true}
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {registration.shooter.team && (
                      <div className="text-sm text-gray-600">
                        Team: {registration.shooter.team.name}
                      </div>
                    )}
                    {(registration.shooter.grade || registration.shooter.division) && (
                      <div className="text-sm text-gray-600">
                        {registration.shooter.grade && <span>Grade: {registration.shooter.grade}</span>}
                        {registration.shooter.grade && registration.shooter.division && <span> • </span>}
                        {registration.shooter.division && (
                          <span className="font-medium text-indigo-600">{registration.shooter.division}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Disciplines */}
                  {registration.disciplines.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Disciplines:</div>
                      <div className="flex flex-wrap gap-1">
                        {registration.disciplines.map((rd) => (
                          <span
                            key={rd.id}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                          >
                            {rd.discipline.displayName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Registered: {format(new Date(registration.createdAt), 'PP')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

