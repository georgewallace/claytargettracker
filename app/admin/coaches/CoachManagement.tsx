'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Coach {
  id: string
  name: string
  email: string
  role: string
  shooter: any | null
  coachedTeams: Array<{
    team: {
      id: string
      name: string
    }
  }>
}

interface Team {
  id: string
  name: string
  coaches: Array<{
    user: {
      id: string
      name: string
    }
  }>
  _count: {
    shooters: number
  }
}

interface Props {
  coaches: Coach[]
  teams: Team[]
}

export default function CoachManagement({ coaches, teams }: Props) {
  const router = useRouter()
  const [assigning, setAssigning] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAssignCoach = async (coachId: string, teamId: string) => {
    setAssigning(coachId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/teams/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: coachId,
          teamId 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign coach')
      }

      setSuccess('Coach assigned successfully!')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setAssigning(null)
    }
  }

  const handleRemoveCoach = async (coachId: string, teamId: string) => {
    if (!confirm('Are you sure you want to remove this coach from the team?')) {
      return
    }

    setRemoving(coachId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/teams/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId: coachId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove coach')
      }

      setSuccess('Coach removed successfully!')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Coaches List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Coaches</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {coaches.map((coach) => {
            const currentTeam = coach.coachedTeams[0]?.team
            const isShooter = !!coach.shooter

            return (
              <div key={coach.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {coach.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        coach.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {coach.role}
                      </span>
                      {isShooter && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          ⚠️ Also a Shooter
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{coach.email}</p>

                    {currentTeam && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          Current Team:
                        </span>
                        <span className="text-sm text-indigo-600 font-medium">
                          {currentTeam.name}
                        </span>
                        <button
                          onClick={() => handleRemoveCoach(coach.id, currentTeam.id)}
                          disabled={removing === coach.id}
                          className="ml-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {removing === coach.id ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    )}
                    
                    {isShooter && (
                      <p className="text-xs text-yellow-700 mt-2">
                        ⚠️ Warning: This user is also a shooter. Coaches cannot be shooters on teams.
                      </p>
                    )}
                  </div>

                  {!currentTeam && !isShooter && (
                    <div className="ml-4">
                      <label htmlFor={`team-${coach.id}`} className="sr-only">
                        Assign to team
                      </label>
                      <select
                        id={`team-${coach.id}`}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignCoach(coach.id, e.target.value)
                          }
                        }}
                        disabled={assigning === coach.id}
                        className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Assign to team...</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} ({team.coaches.length} {team.coaches.length === 1 ? 'coach' : 'coaches'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {coaches.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No coaches found
            </div>
          )}
        </div>
      </div>

      {/* Teams Overview */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Teams Overview</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {teams.map((team) => (
            <div key={team.id} className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {team.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {team._count.shooters} {team._count.shooters === 1 ? 'shooter' : 'shooters'}
              </p>
              
              {team.coaches.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Coaches ({team.coaches.length}):
                  </p>
                  <div className="space-y-1">
                    {team.coaches.map((tc) => (
                      <div key={tc.user.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <span className="text-sm text-gray-900">{tc.user.name}</span>
                        <button
                          onClick={() => handleRemoveCoach(tc.user.id, team.id)}
                          disabled={removing === tc.user.id}
                          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {removing === tc.user.id ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No coaches assigned</p>
              )}
            </div>
          ))}

          {teams.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No teams found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

