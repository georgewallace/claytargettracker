'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  coach: {
    name: string
  } | null
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

  const handleRequestJoin = async (teamId: string, teamName: string) => {
    if (!currentShooter) {
      alert('You must be a shooter to join a team')
      return
    }

    if (currentShooter.teamId) {
      alert('You are already on a team. Leave your current team before joining another.')
      return
    }

    const message = prompt(`Request to join ${teamName}?\n\nOptional message to coach:`)
    if (message === null) return // User cancelled

    setRequesting(teamId)
    setError('')

    try {
      const response = await fetch('/api/teams/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamId,
          message: message.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send join request')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
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

            {team.coach && (
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Coach:</span> {team.coach.name}
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
                    onClick={() => handleRequestJoin(team.id, team.name)}
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
    </>
  )
}

