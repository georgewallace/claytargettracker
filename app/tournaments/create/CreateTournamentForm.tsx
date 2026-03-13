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

function isRoundBased(name: string) {
  return name === 'trap' || name === 'skeet'
}

function isStationBased(name: string) {
  return name === 'sporting_clays' || name === 'five_stand' || name === 'super_sport'
}

function defaultRounds(name: string) {
  return name === 'trap' || name === 'skeet' ? 4 : 1
}

function defaultStations(name: string) {
  if (name === 'five_stand') return 5
  return 10
}

export default function CreateTournamentForm({ disciplines }: CreateTournamentFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'upcoming',
    awardStructureVersion: 'legacy',
  })
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    disciplines.map(d => d.id)
  )

  // Per-discipline round/station config
  const [disciplineConfigs, setDisciplineConfigs] = useState<Record<string, { rounds: number; stations: number }>>(() => {
    const map: Record<string, { rounds: number; stations: number }> = {}
    for (const d of disciplines) {
      map[d.id] = { rounds: defaultRounds(d.name), stations: defaultStations(d.name) }
    }
    return map
  })

  const [leaderboardTabInterval, setLeaderboardTabInterval] = useState(15000)
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

    const disciplineConfigurations = selectedDisciplines.map(disciplineId => {
      const disc = disciplines.find(d => d.id === disciplineId)
      const cfg = disciplineConfigs[disciplineId] || {}
      if (!disc) return { disciplineId }
      return {
        disciplineId,
        rounds: isRoundBased(disc.name) ? (cfg.rounds ?? defaultRounds(disc.name)) : null,
        stations: isStationBased(disc.name) ? (cfg.stations ?? defaultStations(disc.name)) : null,
        targets: null,
      }
    })

    try {
      const payload = {
        ...formData,
        disciplineConfigurations,
        enableScores: true,
        enableLeaderboard: true,
        leaderboardTabInterval,
      }

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
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleDiscipline = (disciplineId: string, disciplineName: string) => {
    setSelectedDisciplines(prev => {
      const next = prev.includes(disciplineId)
        ? prev.filter(id => id !== disciplineId)
        : [...prev, disciplineId]
      if (!prev.includes(disciplineId) && !disciplineConfigs[disciplineId]) {
        setDisciplineConfigs(c => ({
          ...c,
          [disciplineId]: { rounds: defaultRounds(disciplineName), stations: defaultStations(disciplineName) }
        }))
      }
      return next
    })
  }

  const updateDisciplineConfig = (disciplineId: string, field: 'rounds' | 'stations', value: number) => {
    setDisciplineConfigs(prev => ({
      ...prev,
      [disciplineId]: { ...(prev[disciplineId] || {}), [field]: value }
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Tournament Name *</label>
        <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Spring Championship 2025" />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
        <input id="location" name="location" type="text" required value={formData.location} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Springfield Gun Club" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
          <input id="startDate" name="startDate" type="date" required value={formData.startDate} onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
          <input id="endDate" name="endDate" type="date" required value={formData.endDate} onChange={handleChange}
            min={formData.startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <select id="status" name="status" value={formData.status} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Discipline Selection with per-discipline config */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Disciplines * (select at least one)</label>
        <div className="space-y-3">
          {disciplines.map(discipline => {
            const isSelected = selectedDisciplines.includes(discipline.id)
            const cfg = disciplineConfigs[discipline.id] || { rounds: defaultRounds(discipline.name), stations: defaultStations(discipline.name) }
            const showRounds = isRoundBased(discipline.name)
            const showStations = isStationBased(discipline.name)

            return (
              <div key={discipline.id}
                className={`border rounded-lg transition ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}>
                <label className="flex items-start p-4 cursor-pointer">
                  <input type="checkbox" checked={isSelected}
                    onChange={() => toggleDiscipline(discipline.id, discipline.name)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">{discipline.displayName}</div>
                    {discipline.description && (
                      <div className="text-sm text-gray-600 mt-1">{discipline.description}</div>
                    )}
                    {/* Per-discipline scoring config */}
                    {isSelected && (showRounds || showStations) && (
                      <div className="mt-3 pt-3 border-t border-indigo-200" onClick={e => e.preventDefault()}>
                        {showRounds && (
                          <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600 w-28">Rounds</label>
                            <input type="number" min={1} max={10}
                              value={cfg.rounds}
                              onChange={e => updateDisciplineConfig(discipline.id, 'rounds', parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <span className="text-xs text-gray-500">× 25 targets per round</span>
                          </div>
                        )}
                        {showStations && (
                          <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600 w-28">Stations</label>
                            {discipline.name === 'five_stand' ? (
                              <span className="text-sm font-medium text-gray-700">5 <span className="text-xs text-gray-400 font-normal">(fixed)</span></span>
                            ) : (
                              <>
                                <input type="number" min={1} max={50}
                                  value={cfg.stations}
                                  onChange={e => updateDisciplineConfig(discipline.id, 'stations', parseInt(e.target.value) || 1)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                <span className="text-xs text-gray-500">stations on course</span>
                              </>
                            )}
                          </div>
                        )}
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
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Add tournament details, rules, and any other information..." />
      </div>

      {/* Award Structure Version */}
      <div>
        <label htmlFor="awardStructureVersion" className="block text-sm font-medium text-gray-700 mb-2">Award Structure</label>
        <select id="awardStructureVersion" name="awardStructureVersion" value={formData.awardStructureVersion} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="legacy">Legacy (Excel import)</option>
          <option value="v2">New (v2 Awards)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Choose "New" to use web-based score entry and the new award leaderboard</p>
      </div>

      {/* Leaderboard Tab Interval */}
      <div>
        <label htmlFor="leaderboardTabInterval" className="block text-sm font-medium text-gray-700 mb-2">
          Leaderboard Tab Switching Interval
        </label>
        <select id="leaderboardTabInterval" value={leaderboardTabInterval}
          onChange={e => setLeaderboardTabInterval(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="10000">10 seconds</option>
          <option value="15000">15 seconds (default)</option>
          <option value="20000">20 seconds</option>
          <option value="30000">30 seconds</option>
          <option value="60000">1 minute</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">How often the leaderboard automatically switches between tabs</p>
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {loading ? 'Creating...' : 'Create Tournament'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  )
}
