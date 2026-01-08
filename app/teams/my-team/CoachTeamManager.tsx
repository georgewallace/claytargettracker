'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Athlete {
  id: string
  grade: string | null
  division: string | null
  isActive: boolean
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
  athletes: Athlete[]
}

interface JoinRequest {
  id: string
  message: string | null
  createdAt: Date
  athlete: {
    id: string
    user: {
      name: string
      email: string
    }
  }
}

interface CoachJoinRequest {
  id: string
  message: string | null
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
    firstName: string | null
    lastName: string | null
    phone: string | null
  }
}

interface CoachTeamManagerProps {
  team: Team
  availableathletes: Athlete[]
  joinRequests: JoinRequest[]
  coachJoinRequests: CoachJoinRequest[]
}

export default function CoachTeamManager({ team, availableathletes, joinRequests, coachJoinRequests }: CoachTeamManagerProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const filteredAvailable = availableathletes.filter(athlete =>
    athlete.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddathlete = async (athleteId: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/teams/add-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to add athlete')
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

  const handleRemoveathlete = async (athleteId: string) => {
    if (!confirm('Are you sure you want to remove this athlete from the team?')) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/teams/remove-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to remove athlete')
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

  const handleApproveRequest = async (requestId: string, athleteName: string) => {
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

      setSuccess(`${athleteName} approved and added to the team!`)
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

  const handleRejectRequest = async (requestId: string, athleteName: string) => {
    if (!confirm(`Reject join request from ${athleteName}?`)) {
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

      setSuccess(`Request from ${athleteName} rejected`)
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

  const handleApproveCoachRequest = async (requestId: string, coachName: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/teams/coach-join-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to approve request')
        return
      }

      setSuccess(`${coachName} approved and added as a coach!`)
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

  const handleRejectCoachRequest = async (requestId: string, coachName: string) => {
    if (!confirm(`Reject coach request from ${coachName}?`)) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/teams/coach-join-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reject request')
        return
      }

      setSuccess(`Request from ${coachName} rejected`)
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

      {/* Athlete Join Requests */}
      {joinRequests.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pending Athlete Join Requests ({joinRequests.length})
          </h2>
          <p className="text-gray-600 mb-6">
            Review and approve/reject requests from athletes who want to join your team
          </p>

          <div className="space-y-3">
            {joinRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-start justify-between p-4 bg-white border border-yellow-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {request.athlete.user.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.athlete.user.email}
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
                    onClick={() => handleApproveRequest(request.id, request.athlete.user.name)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id, request.athlete.user.name)}
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

      {/* Coach Join Requests */}
      {coachJoinRequests.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pending Coach Join Requests ({coachJoinRequests.length})
          </h2>
          <p className="text-gray-600 mb-6">
            Review and approve/reject requests from coaches who want to join your team
          </p>

          <div className="space-y-3">
            {coachJoinRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-start justify-between p-4 bg-white border border-blue-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900">
                      {request.user.name}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Coach
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.user.email}
                  </div>
                  {request.user.phone && (
                    <div className="text-sm text-gray-500">
                      Phone: {request.user.phone}
                    </div>
                  )}
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
                    onClick={() => handleApproveCoachRequest(request.id, request.user.name)}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleRejectCoachRequest(request.id, request.user.name)}
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
          Current Roster ({team.athletes.filter(a => a.isActive !== false).length})
        </h2>

        {team.athletes.filter(a => a.isActive !== false).length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No active athletes on your team yet. Add some from the list below!
          </p>
        ) : (
          <div className="space-y-3">
            {team.athletes.filter(a => a.isActive !== false).map((athlete) => (
              <div
                key={athlete.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-gray-900">
                      {athlete.user.name}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ● Active
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {athlete.user.email}
                  </div>
                  {(athlete.grade || athlete.division) && (
                    <div className="text-sm text-gray-600 mt-1">
                      {athlete.grade && <span>Grade: {athlete.grade}</span>}
                      {athlete.grade && athlete.division && <span> • </span>}
                      {athlete.division && <span className="font-medium text-indigo-600">{athlete.division}</span>}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-col xs:flex-row sm:flex-row">
                  <Link
                    href={`/athletes/${athlete.id}/edit`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm text-center"
                  >
                    Edit Details
                  </Link>
                  <button
                    onClick={() => handleRemoveathlete(athlete.id)}
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

        {/* Inactive Athletes Section */}
        {team.athletes.filter(a => a.isActive === false).length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowInactive(!showInactive)}
              className="flex items-center justify-between w-full text-left mb-4"
            >
              <h3 className="text-lg font-semibold text-gray-700">
                Inactive Athletes ({team.athletes.filter(a => a.isActive === false).length})
              </h3>
              <span className="text-gray-500">
                {showInactive ? '▼' : '▶'}
              </span>
            </button>

            {showInactive && (
              <div className="space-y-3">
                {team.athletes.filter(a => a.isActive === false).map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-300 rounded-lg bg-gray-50 gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium text-gray-600">
                          {athlete.user.name}
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                          ○ Inactive
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {athlete.user.email}
                      </div>
                      {(athlete.grade || athlete.division) && (
                        <div className="text-sm text-gray-500 mt-1">
                          {athlete.grade && <span>Grade: {athlete.grade}</span>}
                          {athlete.grade && athlete.division && <span> • </span>}
                          {athlete.division && <span className="font-medium text-gray-600">{athlete.division}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-col xs:flex-row sm:flex-row">
                      <Link
                        href={`/athletes/${athlete.id}/edit`}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition text-sm text-center"
                      >
                        Edit Details
                      </Link>
                      <button
                        onClick={() => handleRemoveathlete(athlete.id)}
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
        )}
      </div>

      {/* Add athletes */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Add athletes to Team
        </h2>
        <p className="text-gray-600 mb-6">
          Select athletes to add to your team roster
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
            {searchTerm ? 'No athletes match your search.' : 'No available athletes to add.'}
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAvailable.map((athlete) => (
              <div
                key={athlete.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {athlete.user.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {athlete.user.email}
                  </div>
                  {athlete.team && (
                    <div className="text-sm text-indigo-600 mt-1">
                      Currently on: {athlete.team.name}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAddathlete(athlete.id)}
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

