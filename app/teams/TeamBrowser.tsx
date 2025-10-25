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
  shooters: Array<{
    user: {
      name: string
    }
  }>
  _count: {
    shooters: number
  }
}

interface TeamBrowserProps {
  teams: Team[]
  currentShooter: { id: string; teamId: string | null } | null
  pendingRequests: Array<{ teamId: string }>
}

export default function TeamBrowser({ teams, currentShooter, pendingRequests }: TeamBrowserProps) {
  const router = useRouter()
  const [requesting, setRequesting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null)
  const [message, setMessage] = useState('')
  const [modalError, setModalError] = useState('')

  const handleRequestJoinClick = (teamId: string, teamName: string) => {
    if (!currentShooter) {
      setError('You must be a shooter to join a team')
      return
    }

    if (currentShooter.teamId) {
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
            className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 hover:shadow-md transition"
          >
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
                <span className="font-medium">{team._count.shooters}</span> member
                {team._count.shooters !== 1 ? 's' : ''}
              </p>
              
              {team.shooters.length > 0 && (
                <div className="space-y-1">
                  {team.shooters.slice(0, 3).map((shooter, idx) => (
                    <p key={idx} className="text-xs text-gray-500">
                      • {shooter.user.name}
                    </p>
                  ))}
                  {team.shooters.length > 3 && (
                    <p className="text-xs text-gray-400 italic">
                      +{team.shooters.length - 3} more...
                    </p>
                  )}
                </div>
              )}
            </div>

            {currentShooter && !currentShooter.teamId && (
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

            {currentShooter?.teamId === team.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-green-600">
                  ✓ Your Team
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

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

