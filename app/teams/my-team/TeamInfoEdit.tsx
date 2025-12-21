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
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Team Information</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Edit Information
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Team Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          ) : (
            <p className="text-gray-900">{team.name}</p>
          )}
        </div>

        {/* Affiliation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Affiliation
          </label>
          {isEditing ? (
            <select
              value={formData.affiliation}
              onChange={(e) => setFormData(prev => ({ ...prev, affiliation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Not Affiliated</option>
              <option value="SCTP">Scholastic Clay Target Program (SCTP)</option>
              <option value="USA Clay Target League">USA Clay Target League</option>
            </select>
          ) : (
            <p className="text-gray-900">{team.affiliation || 'Not Affiliated'}</p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Head Coach Information</h3>
        </div>

        {/* Head Coach Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Head Coach Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.headCoach}
              onChange={(e) => setFormData(prev => ({ ...prev, headCoach: e.target.value }))}
              placeholder="John Smith"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{team.headCoach || 'Not set'}</p>
          )}
        </div>

        {/* Head Coach Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Head Coach Email
          </label>
          {isEditing ? (
            <input
              type="email"
              value={formData.headCoachEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, headCoachEmail: e.target.value }))}
              placeholder="coach@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{team.headCoachEmail || 'Not set'}</p>
          )}
        </div>

        {/* Head Coach Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Head Coach Phone
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.headCoachPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, headCoachPhone: e.target.value }))}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{team.headCoachPhone || 'Not set'}</p>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Team Address</h3>
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{team.address || 'Not set'}</p>
          )}
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Springfield"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-900">{team.city || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                placeholder="IL"
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            ) : (
              <p className="text-gray-900">{team.state || 'Not set'}</p>
            )}
          </div>
        </div>

        {/* ZIP Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.zip}
              onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
              placeholder="62701"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-900">{team.zip || 'Not set'}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
