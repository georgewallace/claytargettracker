import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { format } from 'date-fns'
import TournamentActionsMenu from '@/components/TournamentActionsMenu'
import BulkImportButton from './BulkImportButton'
import UserRoleManagement from './UserRoleManagement'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

// Format date without timezone shifts
function parseDateSafe(date: Date) {
  const dateStr = new Date(date).toISOString().split('T')[0]
  return new Date(`${dateStr}T12:00:00.000Z`)
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'admin') {
    redirect('/')
  }

  // Pagination setup for tournaments table
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')
  const itemsPerPage = 20
  const skip = (currentPage - 1) * itemsPerPage
  
  // Fetch dashboard statistics
  const [
    tournamentStats,
    athleteCount,
    teamCount,
    coachCount,
    recentRegistrations,
    recentScores,
    tournamentCount,
    allTournaments
  ] = await Promise.all([
    // Tournament statistics
    prisma.tournament.groupBy({
      by: ['status'],
      _count: true,
    }),
    // Athlete count
    prisma.athlete.count(),
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
        athlete: {
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
        athlete: {
          include: {
            user: true
          }
        },
        tournament: true,
        discipline: true,
        scores: true
      }
    }),
    // Total tournament count for pagination
    prisma.tournament.count(),
    // Paginated tournaments for management table
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
      },
      skip,
      take: itemsPerPage
    })
  ])

  const totalPages = Math.ceil(tournamentCount / itemsPerPage)

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

          {/* Total Athletes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total aSthletes</h3>
              <span className="text-3xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{athleteCount}</div>
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

        {/* Bulk Import Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bulk User Import</h2>
          <p className="text-sm text-gray-600 mb-6">
            Import multiple athletes or coaches at once from an Excel file. This creates placeholder accounts
            that will be automatically linked when users register with matching names.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Athletes Import */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Athletes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload an Excel file with athlete information including names, teams, grades, and classifications.
              </p>
              <BulkImportButton type="athletes" />
            </div>

            {/* Coaches Import */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Coaches</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload an Excel file with coach information including names, emails, and team assignments.
              </p>
              <BulkImportButton type="coaches" />
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How Auto-Linking Works:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Import creates placeholder accounts with temporary emails (name@placeholder.local)</li>
              <li>When a user registers with a matching name, their account is automatically linked</li>
              <li>The placeholder email is replaced with their real email and password</li>
              <li>All athlete/coach data (team, grades, classes) is preserved and linked to their account</li>
            </ol>
          </div>
        </div>

        {/* User Role Management */}
        <div className="mb-8">
          <UserRoleManagement />
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
                        <div>{tournament._count.registrations} athletes</div>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <Link
                  href={`/admin?page=${Math.max(currentPage - 1, 1)}`}
                  className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                    currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={`/admin?page=${Math.min(currentPage + 1, totalPages)}`}
                  className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                    currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  Next
                </Link>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{skip + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(skip + itemsPerPage, tournamentCount)}</span> of{' '}
                    <span className="font-medium">{tournamentCount}</span> tournaments
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <Link
                      href={`/admin?page=${Math.max(currentPage - 1, 1)}`}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                        currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </Link>
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                      // Show first page, last page, current page and 2 pages around it
                      const page = i + 1
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <Link
                            key={page}
                            href={`/admin?page=${page}`}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === page
                                ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {page}
                          </Link>
                        )
                      } else if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">...</span>
                      }
                      return null
                    })}
                    <Link
                      href={`/admin?page=${Math.min(currentPage + 1, totalPages)}`}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                        currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </nav>
                </div>
              </div>
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
                          {registration.athlete.user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {registration.tournament.name}
                        </div>
                        {registration.athlete.team && (
                          <div className="text-sm text-gray-500">
                            Team: {registration.athlete.team.name}
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
                  const totalTargets = shoot.scores.reduce((sum, score) => sum + score.maxTargets, 0)
                  const percentage = totalTargets > 0 ? Math.round((totalHit / totalTargets) * 100) : 0
                  
                  return (
                    <div
                      key={shoot.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {shoot.athlete.user.name}
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

