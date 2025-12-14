'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  coaches: Array<{
    user: {
      name: string
    }
  }>
  athletes: Array<{
    user: {
      name: string
    }
  }>
  _count: {
    athletes: number
  }
}

interface TeamBrowserProps {
  teams: Team[]
  currentathlete: { id: string; teamId: string | null } | null
  pendingRequests: Array<{ teamId: string }>
  currentPage: number
  totalPages: number
  totalTeams: number
}

export default function TeamBrowser({
  teams,
  currentathlete,
  pendingRequests,
  currentPage,
  totalPages,
  totalTeams
}: TeamBrowserProps) {
  const router = useRouter()
  const [requesting, setRequesting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null)
  const [message, setMessage] = useState('')
  const [modalError, setModalError] = useState('')

  const handleRequestJoinClick = (teamId: string, teamName: string) => {
    if (!currentathlete) {
      setError('You must be an athlete to join a team')
      return
    }

    if (currentathlete.teamId) {
      setError('You are already on a team. Leave your current team before joining another.')
      return
    }

    setSelectedTeam({ id: teamId, name: teamName })
    setMessage('')
    setModalError('')
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedTeam(null)
    setMessage('')
    setModalError('')
  }

  const handleSubmitRequest = async () => {
    if (!selectedTeam) return

    setRequesting(selectedTeam.id)
    setModalError('')
    setError('')

    try {
      const response = await fetch('/api/teams/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId: selectedTeam.id,
          message: message.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send join request')
      }

      handleModalClose()
      router.refresh()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred')
    } finally {
      setRequesting(null)
    }
  }

  const hasPendingRequest = (teamId: string) => {
    return pendingRequests.some(req => req.teamId === teamId)
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 hover:shadow-md transition flex flex-col"
          >
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {team.name}
              </h3>

              {team.coaches.length > 0 && (
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Coach{team.coaches.length > 1 ? 'es' : ''}:</span> {team.coaches.map(c => c.user.name).join(', ')}
                </p>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">{team._count.athletes}</span> member
                  {team._count.athletes !== 1 ? 's' : ''}
                </p>

                {team.athletes.length > 0 && (
                  <div className="space-y-1">
                    {team.athletes.slice(0, 3).map((athlete, idx) => (
                      <p key={idx} className="text-xs text-gray-500">
                        • {athlete.user.name}
                      </p>
                    ))}
                    {team.athletes.length > 3 && (
                      <p className="text-xs text-gray-400 italic">
                        +{team.athletes.length - 3} more...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {currentathlete && !currentathlete.teamId && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {hasPendingRequest(team.id) ? (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
                  >
                    Request Pending
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestJoinClick(team.id, team.name)}
                    disabled={requesting === team.id}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {requesting === team.id ? 'Requesting...' : 'Request to Join'}
                  </button>
                )}
              </div>
            )}

            {currentathlete?.teamId === team.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-green-600">
                  ✓ Your Team
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            {/* Mobile pagination */}
            {currentPage > 1 ? (
              <a
                href={`?page=${currentPage - 1}`}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </a>
            ) : (
              <span className="relative inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                Previous
              </span>
            )}
            {currentPage < totalPages ? (
              <a
                href={`?page=${currentPage + 1}`}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </a>
            ) : (
              <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 20, totalTeams)}</span> of{' '}
                <span className="font-medium">{totalTeams}</span> teams
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {/* Previous button */}
                {currentPage > 1 ? (
                  <a
                    href={`?page=${currentPage - 1}`}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </a>
                ) : (
                  <span className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}

                {/* Page numbers */}
                {(() => {
                  const pages = []
                  const maxPagesToShow = 7
                  let startPage = Math.max(1, currentPage - 3)
                  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

                  if (endPage - startPage < maxPagesToShow - 1) {
                    startPage = Math.max(1, endPage - maxPagesToShow + 1)
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      i === currentPage ? (
                        <span
                          key={i}
                          className="relative z-10 inline-flex items-center bg-indigo-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          {i}
                        </span>
                      ) : (
                        <a
                          key={i}
                          href={`?page=${i}`}
                          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        >
                          {i}
                        </a>
                      )
                    )
                  }
                  return pages
                })()}

                {/* Next button */}
                {currentPage < totalPages ? (
                  <a
                    href={`?page=${currentPage + 1}`}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </a>
                ) : (
                  <span className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Join Request Modal */}
      {showModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Request to Join {selectedTeam.name}
                </h3>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={requesting !== null}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                  {modalError}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Coach (Optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Introduce yourself or explain why you'd like to join..."
                  disabled={requesting !== null}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be sent to the team's coach along with your join request.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleModalClose}
                  disabled={requesting !== null}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={requesting !== null}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {requesting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

