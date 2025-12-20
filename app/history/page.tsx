import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { format } from 'date-fns'
import Link from 'next/link'

// Force dynamic rendering (required for getCurrentUser)
export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

export default async function athleteHistoryPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()

  if (!user || !user.athlete) {
    redirect('/login')
  }

  // Pagination setup
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')
  const itemsPerPage = 20
  const skip = (currentPage - 1) * itemsPerPage

  // Get total count for pagination
  const totalCount = await prisma.shoot.count({
    where: {
      athleteId: user.athlete.id
    }
  })

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  // Get paginated shoots for this athlete
  const shoots = await prisma.shoot.findMany({
    where: {
      athleteId: user.athlete.id
    },
    include: {
      tournament: true,
      discipline: true,
      scores: {
        orderBy: [
          { roundNumber: 'asc' },
          { stationNumber: 'asc' }
        ]
      }
    },
    orderBy: {
      date: 'desc'
    },
    skip,
    take: itemsPerPage
  })

  // Calculate totals for each shoot
  const shootsWithTotals = shoots.map((shoot: any) => {
    const totalTargets = shoot.scores.reduce((sum: number, score: any) => sum + score.targets, 0)
    const totalPossible = shoot.scores.reduce((sum: number, score: any) => sum + score.maxTargets, 0)
    const percentage = totalPossible > 0 ? ((totalTargets / totalPossible) * 100).toFixed(1) : '0'
    
    return {
      ...shoot,
      totalTargets,
      totalPossible,
      percentage
    }
  })

  // Group by discipline for statistics
  const disciplineStats = shoots.reduce((acc: any, shoot: any) => {
    const disciplineId = shoot.discipline.id
    if (!acc[disciplineId]) {
      acc[disciplineId] = {
        discipline: shoot.discipline,
        totalShoots: 0,
        totalTargets: 0,
        totalPossible: 0
      }
    }
    
    const targets = shoot.scores.reduce((sum: number, score: any) => sum + score.targets, 0)
    const possible = shoot.scores.reduce((sum: number, score: any) => sum + score.maxTargets, 0)
    
    acc[disciplineId].totalShoots++
    acc[disciplineId].totalTargets += targets
    acc[disciplineId].totalPossible += possible
    
    return acc
  }, {} as Record<string, any>)

  const stats = Object.values(disciplineStats).map((stat: any) => ({
    ...stat,
    average: stat.totalPossible > 0 
      ? ((stat.totalTargets / stat.totalPossible) * 100).toFixed(1)
      : '0'
  }))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Shooting History</h1>
          <p className="text-gray-600">Track your progress across all tournaments</p>
        </div>

        {/* Statistics */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat: any) => (
              <div key={stat.discipline.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {stat.discipline.displayName}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shoots:</span>
                    <span className="font-medium">{stat.totalShoots}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Score:</span>
                    <span className="font-medium">{stat.totalTargets} / {stat.totalPossible}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average:</span>
                    <span className="text-xl font-bold text-indigo-600">{stat.average}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">All Shoots</h2>
          </div>
          
          {shootsWithTotals.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg mb-4">No shooting history yet.</p>
              <Link 
                href="/"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Browse Tournaments →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tournament
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discipline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shootsWithTotals.map((shoot: any) => (
                    <tr key={shoot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(shoot.date), 'PP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/tournaments/${shoot.tournamentId}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {shoot.tournament.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shoot.discipline.displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {shoot.totalTargets} / {shoot.totalPossible}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          parseFloat(shoot.percentage) >= 90 ? 'bg-green-100 text-green-800' :
                          parseFloat(shoot.percentage) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shoot.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {shoot.scores.map((score: any) => (
                            <span 
                              key={score.id}
                              className="text-xs text-gray-600"
                              title={`Station ${score.stationNumber}: ${score.targets}/${score.maxTargets}`}
                            >
                              {score.targets}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-lg shadow-md">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={`/history?page=${Math.max(currentPage - 1, 1)}`}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
                  currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Previous
              </Link>
              <Link
                href={`/history?page=${Math.min(currentPage + 1, totalPages)}`}
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
                  <span className="font-medium">{Math.min(skip + itemsPerPage, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> shoots
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Link
                    href={`/history?page=${Math.max(currentPage - 1, 1)}`}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Link
                      key={page}
                      href={`/history?page=${page}`}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        currentPage === page
                          ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {page}
                    </Link>
                  ))}
                  <Link
                    href={`/history?page=${Math.min(currentPage + 1, totalPages)}`}
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
    </div>
  )
}

