'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Shooter {
  id: string
  grade: string | null
  division: string | null
  user: {
    name: string
    email: string
  }
  team: {
    name: string
  } | null
}

interface Team {
  id: string
  name: string
  shooters: Shooter[]
}

interface JoinRequest {
  id: string
  message: string | null
  createdAt: Date
  shooter: {
    id: string
    user: {
      name: string
      email: string
    }
  }
}

interface CoachTeamManagerProps {
  team: Team
  availableShooters: Shooter[]
  joinRequests: JoinRequest[]
}

export default function CoachTeamManager({ team, availableShooters, joinRequests }: CoachTeamManagerProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const filteredAvailable = availableShooters.filter(shooter =>
    shooter.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shooter.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddShooter = async (shooterId: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/teams/add-shooter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shooterId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to add shooter')
        return
      }

      setSuccess(`${data.user.name} added to the team!`)
      setTimeout(() => {
        router.refresh()
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveShooter = async (shooterId: string) => {
    if (!confirm('Are you sure you want to remove this shooter from the team?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/teams/remove-shooter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shooterId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to remove shooter')
        return
      }

      setSuccess(`${data.user.name} removed from the team`)
      setTimeout(() => {
        router.refresh()
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string, shooterName: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/teams/join-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to approve request')
        return
      }

      setSuccess(`${shooterName} approved and added to the team!`)
      setTimeout(() => {
        router.refresh()
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectRequest = async (requestId: string, shooterName: string) => {
    if (!confirm(`Reject join request from ${shooterName}?`)) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/teams/join-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reject request')
        return
      }

      setSuccess(`Request from ${shooterName} rejected`)
      setTimeout(() => {
        router.refresh()
        setSuccess('')
      }, 1500)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Join Requests */}
      {joinRequests.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pending Join Requests ({joinRequests.length})
          </h2>
          <p className="text-gray-600 mb-6">
            Review and approve/reject requests from shooters who want to join your team
          </p>

          <div className="space-y-3">
            {joinRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-start justify-between p-4 bg-white border border-yellow-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {request.shooter.user.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.shooter.user.email}
                  </div>
                  {request.message && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 italic">
                      "{request.message}"
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Requested: {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApproveRequest(request.id, request.shooter.user.name)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id, request.shooter.user.name)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Roster */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Current Roster ({team.shooters.length})
        </h2>

        {team.shooters.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No shooters on your team yet. Add some from the list below!
          </p>
        ) : (
          <div className="space-y-3">
            {team.shooters.map((shooter) => (
              <div
                key={shooter.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {shooter.user.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {shooter.user.email}
                  </div>
                  {(shooter.grade || shooter.division) && (
                    <div className="text-sm text-gray-600 mt-1">
                      {shooter.grade && <span>Grade: {shooter.grade}</span>}
                      {shooter.grade && shooter.division && <span> • </span>}
                      {shooter.division && <span className="font-medium text-indigo-600">{shooter.division}</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/shooters/${shooter.id}/edit`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm"
                  >
                    Edit Details
                  </Link>
                  <button
                    onClick={() => handleRemoveShooter(shooter.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Shooters */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Add Shooters to Team
        </h2>
        <p className="text-gray-600 mb-6">
          Select shooters to add to your team roster
        </p>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {filteredAvailable.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            {searchTerm ? 'No shooters match your search.' : 'No available shooters to add.'}
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAvailable.map((shooter) => (
              <div
                key={shooter.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {shooter.user.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {shooter.user.email}
                  </div>
                  {shooter.team && (
                    <div className="text-sm text-indigo-600 mt-1">
                      Currently on: {shooter.team.name}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddShooter(shooter.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                >
                  Add to Team
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

