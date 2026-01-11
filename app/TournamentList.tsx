'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import RegisterButton from './tournaments/[id]/RegisterButton'

// Helper to parse dates safely avoiding timezone issues
function parseDateSafe(date: Date) {
  const dateStr = new Date(date).toISOString().split('T')[0]
  return new Date(`${dateStr}T12:00:00.000Z`)
}

interface Tournament {
  id: string
  name: string
  location: string
  startDate: Date
  endDate: Date
  status: string
  description: string | null
  enableLeaderboard: boolean
  isRegistered: boolean
  isTeamRegistered: boolean
  createdBy: {
    name: string
  }
  disciplines: Array<{
    id: string
    discipline: {
      displayName: string
      id: string
    }
  }>
  _count: {
    registrations: number
    shoots: number
  }
}

interface TournamentListProps {
  tournaments: Tournament[]
  isathlete: boolean
  athleteId?: string
}

export default function TournamentList({ tournaments, isathlete, athleteId }: TournamentListProps) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Calculate pagination
  const totalPages = Math.ceil(tournaments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTournaments = tournaments.slice(startIndex, endIndex)

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      finalizing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return badges[status as keyof typeof badges] || badges.upcoming
  }

  return (
    <>
      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg transition ${
              viewMode === 'card'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg transition ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTournaments.map((tournament) => {
            // Check if tournament is in the past
            const tournamentEndDate = new Date(tournament.endDate)
            const isPast = tournamentEndDate < new Date()

            const isEligibleForRegistration = isathlete &&
              !tournament.isRegistered &&
              (tournament.status === 'upcoming' || tournament.status === 'active') &&
              !isPast &&
              athleteId

            const canRegister = isEligibleForRegistration

            return (
              <div
                key={tournament.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-200 hover:border-indigo-300 relative flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <Link href={`/tournaments/${tournament.id}`}>
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition cursor-pointer flex-1 mr-4">
                      {tournament.name}
                    </h3>
                  </Link>
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tournament.status)}`}>
                      {tournament.status}
                    </span>
                    {/* Registration Badge for athletes */}
                    {isathlete && tournament.isRegistered && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-300">
                        ✓ Registered
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">📍</span>
                    {tournament.location}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">📅</span>
                    {parseDateSafe(tournament.startDate).getTime() === parseDateSafe(tournament.endDate).getTime() ? (
                      format(parseDateSafe(tournament.startDate), 'PPP')
                    ) : (
                      <>
                        {format(parseDateSafe(tournament.startDate), 'PPP')} - {format(parseDateSafe(tournament.endDate), 'PPP')}
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">👥</span>
                    {tournament._count.registrations} registered athletes
                  </div>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0" style={{color: 'rgb(255, 107, 53)'}}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="6"></circle>
                      <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                    {tournament.disciplines.map(td => (
                      <span
                        key={td.id}
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                      >
                        {td.discipline.displayName}
                      </span>
                    ))}
                  </div>
                </div>

                {tournament.description && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                    {tournament.description}
                  </p>
                )}

                <div className="mt-auto pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Created by {tournament.createdBy.name}
                    </p>

                    <div className="flex items-center gap-2">
                      {/* Leaderboard Button - Show for active/completed tournaments with leaderboard enabled */}
                      {tournament.enableLeaderboard && (tournament.status === 'active' || tournament.status === 'completed') && (
                        <Link
                          href={`/tournaments/${tournament.id}/leaderboard`}
                          className="text-xs px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md font-medium transition border border-purple-300 whitespace-nowrap"
                        >
                          🏆 Leaderboard
                        </Link>
                      )}

                      {/* Register Button */}
                      {canRegister && (
                        <div className="flex-shrink-0">
                          <RegisterButton
                            tournamentId={tournament.id}
                            athleteId={athleteId}
                            tournamentDisciplines={tournament.disciplines.map(td => ({
                              id: td.discipline.id,
                              displayName: td.discipline.displayName
                            }))}
                          />
                        </div>
                      )}

                      {/* View Details Link */}
                      {!canRegister && (
                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium ml-auto whitespace-nowrap"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tournament
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disciplines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Athletes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leaderboard
                </th>
                {isathlete && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTournaments.map((tournament) => (
                <tr 
                  key={tournament.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => window.location.href = `/tournaments/${tournament.id}`}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {tournament.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      by {tournament.createdBy.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {parseDateSafe(tournament.startDate).getTime() === parseDateSafe(tournament.endDate).getTime() ? (
                      format(parseDateSafe(tournament.startDate), 'MMM d, yyyy')
                    ) : (
                      <>
                        {format(parseDateSafe(tournament.startDate), 'MMM d')} - {format(parseDateSafe(tournament.endDate), 'MMM d, yyyy')}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {tournament.location}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {tournament.disciplines.map(td => (
                        <span 
                          key={td.id}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                        >
                          {td.discipline.displayName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {tournament._count.registrations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tournament.status)}`}>
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {tournament.enableLeaderboard && (tournament.status === 'active' || tournament.status === 'completed') ? (
                      <Link
                        href={`/tournaments/${tournament.id}/leaderboard`}
                        className="inline-block text-xs px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md font-medium transition border border-purple-300 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🏆 View
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  {isathlete && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {tournament.isRegistered ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-300">
                          ✓ Registered
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-lg shadow-md">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, tournaments.length)}</span> of{' '}
                <span className="font-medium">{tournaments.length}</span> tournaments
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === page
                        ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

