import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import TournamentActionsMenu from '@/components/TournamentActionsMenu'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Format date without timezone shifts
function parseDateSafe(date: Date) {
  const dateStr = new Date(date).toISOString().split('T')[0]
  return new Date(`${dateStr}T12:00:00.000Z`)
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.role !== 'admin') {
    redirect('/')
  }
  
  // Fetch dashboard statistics
  const [
    tournamentStats,
    shooterCount,
    teamCount,
    coachCount,
    recentRegistrations,
    recentScores,
    allTournaments
  ] = await Promise.all([
    // Tournament statistics
    prisma.tournament.groupBy({
      by: ['status'],
      _count: true,
    }),
    // Shooter count
    prisma.shooter.count(),
    // Team count
    prisma.team.count(),
    // Coach count
    prisma.user.count({
      where: {
        role: {
          in: ['coach', 'admin']
        }
      }
    }),
    // Recent registrations (last 10)
    prisma.registration.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        shooter: {
          include: {
            user: true,
            team: true
          }
        },
        tournament: true,
        disciplines: {
          include: {
            discipline: true
          }
        }
      }
    }),
    // Recent scores (last 10)
    prisma.shoot.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        shooter: {
          include: {
            user: true
          }
        },
        tournament: true,
        discipline: true,
        scores: true
      }
    }),
    // All tournaments for management table
    prisma.tournament.findMany({
      include: {
        createdBy: true,
        disciplines: {
          include: {
            discipline: true
          }
        },
        registrations: true,
        _count: {
          select: {
            registrations: true,
            shoots: true,
            timeSlots: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  ])

  // Calculate tournament counts by status
  const tournamentsByStatus = {
    upcoming: 0,
    active: 0,
    completed: 0,
    total: 0
  }
  
  tournamentStats.forEach(stat => {
    tournamentsByStatus[stat.status as keyof typeof tournamentsByStatus] = stat._count
    tournamentsByStatus.total += stat._count
  })

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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Manage tournaments, users, teams, and view system statistics.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tournaments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Tournaments</h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'rgb(255, 107, 53)'}}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900">{tournamentsByStatus.total}</div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="text-blue-600">{tournamentsByStatus.upcoming} upcoming</span>
              <span className="mx-1">•</span>
              <span className="text-green-600">{tournamentsByStatus.active} active</span>
            </div>
          </div>

          {/* Total Shooters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Shooters</h3>
              <span className="text-3xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{shooterCount}</div>
            <div className="mt-2 text-sm text-gray-600">
              Registered users
            </div>
          </div>

          {/* Total Teams */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Teams</h3>
              <span className="text-3xl">🏆</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{teamCount}</div>
            <div className="mt-2 text-sm text-gray-600">
              Active teams
            </div>
          </div>

          {/* Total Coaches */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Coaches & Admins</h3>
              <span className="text-3xl">👨‍🏫</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{coachCount}</div>
            <div className="mt-2 text-sm text-gray-600">
              Coaching staff
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/tournaments/create"
              className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium"
            >
              <span className="mr-2">➕</span>
              Create Tournament
            </Link>
            <Link
              href="/admin/coaches"
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium"
            >
              <span className="mr-2">👨‍🏫</span>
              Manage Coaches
            </Link>
            <Link
              href="/teams"
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
            >
              <span className="mr-2">🏆</span>
              View All Teams
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              Browse Tournaments
            </Link>
          </div>
        </div>

        {/* Tournament Management Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournament Management</h2>
          
          {allTournaments.length === 0 ? (
            <p className="text-gray-600">No tournaments created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tournament
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disciplines
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allTournaments.map((tournament) => (
                    <tr key={tournament.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tournament.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tournament.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(tournament.status)}`}>
                          {tournament.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseDateSafe(tournament.startDate), 'MMM d')}
                        {tournament.startDate !== tournament.endDate && (
                          <> - {format(parseDateSafe(tournament.endDate), 'MMM d, yyyy')}</>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {tournament.disciplines.map((td) => (
                            <span
                              key={td.id}
                              className="inline-flex px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded"
                            >
                              {td.discipline.displayName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{tournament._count.registrations} shooters</div>
                        <div>{tournament._count.shoots} scores</div>
                        <div>{tournament._count.timeSlots} time slots</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {/* Desktop: Show all links */}
                        <div className="hidden lg:flex lg:flex-col gap-1">
                          <Link
                            href={`/tournaments/${tournament.id}`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            View
                          </Link>
                          <Link
                            href={`/tournaments/${tournament.id}/edit`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/tournaments/${tournament.id}/schedule`}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Schedule
                          </Link>
                          <Link
                            href={`/tournaments/${tournament.id}/squads`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Squads
                          </Link>
                          <Link
                            href={`/tournaments/${tournament.id}/leaderboard`}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Leaderboard
                          </Link>
                        </div>
                        {/* Mobile/Tablet: Show dropdown menu */}
                        <div className="lg:hidden">
                          <TournamentActionsMenu tournamentId={tournament.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Two Column Layout for Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Registrations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Registrations</h2>
            
            {recentRegistrations.length === 0 ? (
              <p className="text-gray-600">No registrations yet.</p>
            ) : (
              <div className="space-y-4">
                {recentRegistrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {registration.shooter.user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {registration.tournament.name}
                        </div>
                        {registration.shooter.team && (
                          <div className="text-sm text-gray-500">
                            Team: {registration.shooter.team.name}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(registration.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    {registration.disciplines.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {registration.disciplines.map((rd) => (
                          <span
                            key={rd.id}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                          >
                            {rd.discipline.displayName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Scores */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Scores</h2>
            
            {recentScores.length === 0 ? (
              <p className="text-gray-600">No scores entered yet.</p>
            ) : (
              <div className="space-y-4">
                {recentScores.map((shoot) => {
                  const totalHit = shoot.scores.reduce((sum, score) => sum + score.targets, 0)
                  const totalTargets = shoot.scores.reduce((sum, score) => sum + score.totalTargets, 0)
                  const percentage = totalTargets > 0 ? Math.round((totalHit / totalTargets) * 100) : 0
                  
                  return (
                    <div
                      key={shoot.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {shoot.shooter.user.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {shoot.tournament.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {shoot.discipline.displayName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {totalHit}/{totalTargets}
                          </div>
                          <div className="text-sm text-gray-500">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {format(new Date(shoot.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

