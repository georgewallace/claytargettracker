'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Discipline {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface Tournament {
  id: string
  name: string
  location: string
  startDate: Date
  endDate: Date
  description: string | null
  status: string
  // Feature toggles
  enableScores: boolean
  enableLeaderboard: boolean
  disciplines: Array<{
    id: string
    disciplineId: string
    discipline: Discipline
  }>
}

interface EditTournamentFormProps {
  tournament: Tournament
  allDisciplines: Discipline[]
  disciplineRegistrationCounts: Record<string, number>
  disciplineScoreCounts: Record<string, number>
}

export default function EditTournamentForm({ tournament, allDisciplines, disciplineRegistrationCounts, disciplineScoreCounts }: EditTournamentFormProps) {
  const router = useRouter()
  
  // Format date for date input (YYYY-MM-DD) - use UTC to avoid timezone shifts
  const formatDateForInput = (date: Date) => {
    // Use ISO string and split to avoid timezone conversion
    return new Date(date).toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    name: tournament.name,
    location: tournament.location,
    startDate: formatDateForInput(tournament.startDate),
    endDate: formatDateForInput(tournament.endDate),
    description: tournament.description || '',
    status: tournament.status
  })
  
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    tournament.disciplines.map(td => td.disciplineId)
  )

  const [enableScores, setEnableScores] = useState(tournament.enableScores)
  const [enableLeaderboard, setEnableLeaderboard] = useState(tournament.enableLeaderboard)

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
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          disciplineIds: selectedDisciplines,
          // Feature toggles
          enableScores,
          enableLeaderboard
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update tournament')
        return
      }

      router.push(`/tournaments/${tournament.id}`)
      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
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
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Discipline Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Disciplines * (select at least one)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allDisciplines.map(discipline => {
            const registrationCount = disciplineRegistrationCounts[discipline.id] || 0
            const scoreCount = disciplineScoreCounts[discipline.id] || 0
            const hasRegistrations = registrationCount > 0
            const hasScores = scoreCount > 0
            const isSelected = selectedDisciplines.includes(discipline.id)
            const cannotUncheck = isSelected && hasRegistrations

            return (
              <div
                key={discipline.id}
                className={`border rounded-lg transition ${
                  cannotUncheck
                    ? 'border-gray-400 bg-gray-50'
                    : isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300'
                }`}
              >
                <label className="flex items-start p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDiscipline(discipline.id)}
                    disabled={cannotUncheck}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">{discipline.displayName}</div>
                      <div className="flex gap-2">
                        {hasScores && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {scoreCount} {scoreCount === 1 ? 'score' : 'scores'}
                          </span>
                        )}
                        {hasRegistrations && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {registrationCount} {registrationCount === 1 ? 'athlete' : 'athletes'}
                          </span>
                        )}
                      </div>
                    </div>
                    {discipline.description && (
                      <div className="text-sm text-gray-600 mt-1">{discipline.description}</div>
                    )}
                    {cannotUncheck && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠️ Cannot remove - athletes registered
                      </div>
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
          {loading ? 'Saving...' : 'Save Changes'}
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

