'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  affiliation: string | null
  headCoach: string | null
  headCoachEmail: string | null
  headCoachPhone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
}

interface TeamInfoEditProps {
  team: Team
}

export default function TeamInfoEdit({ team }: TeamInfoEditProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: team.name,
    affiliation: team.affiliation || '',
    headCoach: team.headCoach || '',
    headCoachEmail: team.headCoachEmail || '',
    headCoachPhone: team.headCoachPhone || '',
    address: team.address || '',
    city: team.city || '',
    state: team.state || '',
    zip: team.zip || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update team information')
        return
      }

      setSuccess('Team information updated successfully!')
      setIsEditing(false)
      setTimeout(() => {
        setSuccess('')
        router.refresh()
      }, 2000)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: team.name,
      affiliation: team.affiliation || '',
      headCoach: team.headCoach || '',
      headCoachEmail: team.headCoachEmail || '',
      headCoachPhone: team.headCoachPhone || '',
      address: team.address || '',
      city: team.city || '',
      state: team.state || '',
      zip: team.zip || ''
    })
    setIsEditing(false)
    setError('')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Team Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Team Basic Info - Compact Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Team Name</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            ) : (
              <p className="text-sm text-gray-900">{team.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Affiliation</label>
            {isEditing ? (
              <select
                value={formData.affiliation}
                onChange={(e) => setFormData(prev => ({ ...prev, affiliation: e.target.value }))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Not Affiliated</option>
                <option value="SCTP">SCTP</option>
                <option value="USA Clay Target League">USA Clay Target League</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900">{team.affiliation || 'Not Affiliated'}</p>
            )}
          </div>
        </div>

        {/* Head Coach Info - Compact */}
        <div className="pt-2 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Head Coach</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.headCoach}
                  onChange={(e) => setFormData(prev => ({ ...prev, headCoach: e.target.value }))}
                  placeholder="John Smith"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{team.headCoach || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.headCoachEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, headCoachEmail: e.target.value }))}
                  placeholder="coach@email.com"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{team.headCoachEmail || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.headCoachPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, headCoachPhone: e.target.value }))}
                  placeholder="555-123-4567"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{team.headCoachPhone || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address - Compact */}
        <div className="pt-2 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Address</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Street</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{team.address || '-'}</p>
              )}
            </div>
            <div className="grid grid-cols-6 gap-2">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Springfield"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{team.city || '-'}</p>
                )}
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    placeholder="IL"
                    maxLength={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{team.state || '-'}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">ZIP</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="62701"
                    maxLength={10}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{team.zip || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
