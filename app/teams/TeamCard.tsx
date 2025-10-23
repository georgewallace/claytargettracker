'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TeamCardProps {
  team: {
    id: string
    name: string
    shooters: Array<{
      id: string
      user: {
        name: string
      }
    }>
    _count: {
      shooters: number
    }
  }
  currentShooter: {
    id: string
    teamId: string | null
  } | null
}

export default function TeamCard({ team, currentShooter }: TeamCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCurrentTeam = currentShooter?.teamId === team.id

  const handleJoin = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to join team')
        return
      }

      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/teams/leave', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to leave team')
        return
      }

      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
        {isCurrentTeam && (
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
            Your Team
          </span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {team._count.shooters} {team._count.shooters === 1 ? 'member' : 'members'}
        </p>
      </div>

      {team.shooters.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Members:</p>
          <div className="space-y-1">
            {team.shooters.slice(0, 3).map((shooter) => (
              <p key={shooter.id} className="text-sm text-gray-600">
                • {shooter.user.name}
              </p>
            ))}
            {team.shooters.length > 3 && (
              <p className="text-sm text-gray-500">
                + {team.shooters.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {currentShooter && (
        <div>
          {isCurrentTeam ? (
            <button
              onClick={handleLeave}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Leaving...' : 'Leave Team'}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={loading || currentShooter.teamId !== null}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Joining...' : currentShooter.teamId ? 'Leave current team first' : 'Join Team'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

