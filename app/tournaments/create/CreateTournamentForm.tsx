'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Discipline {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface CreateTournamentFormProps {
  disciplines: Discipline[]
}

export default function CreateTournamentForm({ disciplines }: CreateTournamentFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'upcoming'
  })
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    disciplines.map(d => d.id) // Default: all disciplines selected
  )
  const [enableScores, setEnableScores] = useState(false)
  const [enableLeaderboard, setEnableLeaderboard] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (selectedDisciplines.length === 0) {
      setError('Please select at least one discipline')
      setLoading(false)
      return
    }

    try {
      const payload = {
        ...formData,
        disciplineIds: selectedDisciplines,
        // Feature toggles
        enableScores,
        enableLeaderboard
      }
      
      console.log('Submitting tournament with payload:', JSON.stringify(payload, null, 2))

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // Server returned non-JSON (likely an error page)
        const text = await response.text()
        console.error('Server returned non-JSON response:', text.substring(0, 500))
        setError(`Server error: ${text.substring(0, 200)}`)
        return
      }

      if (!response.ok) {
        const errorMsg = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to create tournament'
        setError(errorMsg)
        console.error('Tournament creation failed:', data)
        return
      }

      router.push(`/tournaments/${data.id}`)
      router.refresh()
    } catch (error) {
      console.error('Caught error during tournament creation:', error)
      setError(`An error occurred: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const toggleDiscipline = (disciplineId: string) => {
    setSelectedDisciplines(prev =>
      prev.includes(disciplineId)
        ? prev.filter(id => id !== disciplineId)
        : [...prev, disciplineId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Tournament Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Spring Championship 2025"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <input
          id="location"
          name="location"
          type="text"
          required
          value={formData.location}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Springfield Gun Club"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="finalizing">Finalizing (for Shoot-Offs)</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Discipline Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Disciplines * (select at least one)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disciplines.map(discipline => {
            const isSelected = selectedDisciplines.includes(discipline.id)

            return (
              <div
                key={discipline.id}
                className={`border rounded-lg transition ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300'
                }`}
              >
                <label className="flex items-start p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDiscipline(discipline.id)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">{discipline.displayName}</div>
                    {discipline.description && (
                      <div className="text-sm text-gray-600 mt-1">{discipline.description}</div>
                    )}
                  </div>
                </label>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Add tournament details, rules, and any other information..."
        />
      </div>

      {/* Feature Toggles Section */}
      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Settings</h3>

        {/* Score Entry Toggle */}
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enableScores}
            onChange={(e) => setEnableScores(e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">Enable Score Entry</div>
            <div className="text-sm text-gray-500">Allow coaches to enter scores during the tournament</div>
          </div>
        </label>

        {/* Leaderboard Toggle */}
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enableLeaderboard}
            onChange={(e) => setEnableLeaderboard(e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">Enable Leaderboard</div>
            <div className="text-sm text-gray-500">Display public leaderboard and rankings</div>
          </div>
        </label>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Creating...' : 'Create Tournament'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

