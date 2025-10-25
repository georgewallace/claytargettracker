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
  disciplines: Array<{
    id: string
    disciplineId: string
    rounds: number | null
    targets: number | null
    stations: number | null
    discipline: Discipline
  }>
}

interface DisciplineConfig {
  rounds?: number      // For Trap/Skeet
  targets?: number     // For 5-Stand/Sporting Clays
  stations?: number    // For Sporting Clays only
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

  const [disciplineConfigs, setDisciplineConfigs] = useState<Record<string, DisciplineConfig>>(() => {
    // Initialize with existing values from tournament
    const configs: Record<string, DisciplineConfig> = {}
    tournament.disciplines.forEach(td => {
      configs[td.disciplineId] = {
        rounds: td.rounds || undefined,
        targets: td.targets || undefined,
        stations: td.stations || undefined
      }
    })
    // Add defaults for new disciplines
    allDisciplines.forEach(d => {
      if (!configs[d.id]) {
        if (d.name === 'trap' || d.name === 'skeet') {
          configs[d.id] = { rounds: 1 }
        } else if (d.name === 'five_stand') {
          configs[d.id] = { targets: 25 }
        } else if (d.name === 'sporting_clays') {
          configs[d.id] = { targets: 100, stations: 10 }
        }
      }
    })
    return configs
  })
  
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

    // Validate configurations for selected disciplines
    for (const disciplineId of selectedDisciplines) {
      const discipline = allDisciplines.find(d => d.id === disciplineId)
      const config = disciplineConfigs[disciplineId]
      
      if (discipline && config) {
        if ((discipline.name === 'trap' || discipline.name === 'skeet') && !config.rounds) {
          setError(`Please specify number of rounds for ${discipline.displayName}`)
          setLoading(false)
          return
        }
        if (discipline.name === 'five_stand' && !config.targets) {
          setError(`Please specify number of targets for ${discipline.displayName}`)
          setLoading(false)
          return
        }
        if (discipline.name === 'sporting_clays' && (!config.targets || !config.stations)) {
          setError(`Please specify number of targets and stations for ${discipline.displayName}`)
          setLoading(false)
          return
        }
      }
    }

    try {
      // Build discipline configurations array
      const disciplineConfigurations = selectedDisciplines.map(disciplineId => ({
        disciplineId,
        ...disciplineConfigs[disciplineId]
      }))

      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          disciplineConfigurations
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

  const updateDisciplineConfig = (disciplineId: string, field: keyof DisciplineConfig, value: number) => {
    setDisciplineConfigs(prev => ({
      ...prev,
      [disciplineId]: {
        ...prev[disciplineId],
        [field]: value
      }
    }))
  }

  const canEditConfig = (disciplineId: string, field: keyof DisciplineConfig, newValue: number): { allowed: boolean, reason?: string } => {
    const scoreCount = disciplineScoreCounts[disciplineId] || 0
    const currentConfig = tournament.disciplines.find(td => td.disciplineId === disciplineId)
    const currentValue = currentConfig ? currentConfig[field] : undefined

    // If no scores recorded, can change anything
    if (scoreCount === 0) {
      return { allowed: true }
    }

    // If scores exist, can only increase values if tournament is upcoming or active
    if (tournament.status === 'upcoming' || tournament.status === 'active') {
      if (currentValue !== null && currentValue !== undefined && newValue < currentValue) {
        return { 
          allowed: false, 
          reason: `Cannot decrease ${field} (${currentValue} → ${newValue}) - scores already recorded`
        }
      }
      return { allowed: true }
    }

    // If completed and scores exist, cannot change
    return { 
      allowed: false, 
      reason: 'Cannot modify completed tournament with recorded scores'
    }
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
          Disciplines * (select at least one and configure)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allDisciplines.map(discipline => {
            const registrationCount = disciplineRegistrationCounts[discipline.id] || 0
            const scoreCount = disciplineScoreCounts[discipline.id] || 0
            const hasRegistrations = registrationCount > 0
            const hasScores = scoreCount > 0
            const isSelected = selectedDisciplines.includes(discipline.id)
            const cannotUncheck = isSelected && hasRegistrations
            const config = disciplineConfigs[discipline.id] || {}
            const existingConfig = tournament.disciplines.find(td => td.disciplineId === discipline.id)
            
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
                            {registrationCount} {registrationCount === 1 ? 'shooter' : 'shooters'}
                          </span>
                        )}
                      </div>
                    </div>
                    {discipline.description && (
                      <div className="text-sm text-gray-600 mt-1">{discipline.description}</div>
                    )}
                    {cannotUncheck && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠️ Cannot remove - shooters registered
                      </div>
                    )}
                  </div>
                </label>

                {/* Configuration Fields */}
                {isSelected && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="border-t border-indigo-200 pt-3">
                      {/* Trap/Skeet: Rounds */}
                      {(discipline.name === 'trap' || discipline.name === 'skeet') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Rounds *
                          </label>
                          <select
                            value={config.rounds || 1}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value)
                              const check = canEditConfig(discipline.id, 'rounds', newValue)
                              if (!check.allowed) {
                                setError(check.reason || 'Cannot modify configuration')
                                return
                              }
                              updateDisciplineConfig(discipline.id, 'rounds', newValue)
                            }}
                            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {[1, 2, 3, 4, ...(existingConfig?.rounds && existingConfig.rounds > 4 ? [existingConfig.rounds] : [])].sort((a, b) => a - b).map(num => (
                              <option key={num} value={num}>{num} {num === 1 ? 'Round' : 'Rounds'} ({num * 25} targets)</option>
                            ))}
                          </select>
                          {hasScores && existingConfig && existingConfig.rounds && (
                            <p className="text-xs text-gray-500 mt-1">
                              Current: {existingConfig.rounds} {existingConfig.rounds === 1 ? 'round' : 'rounds'} • 
                              {tournament.status === 'upcoming' || tournament.status === 'active' ? ' Can only increase' : ' Cannot change (completed)'}
                            </p>
                          )}
                          {!hasScores && (
                            <p className="text-xs text-gray-500 mt-1">
                              {discipline.name === 'skeet' ? 'Each round has 25 targets across 8 stations' : 'Each round has 25 targets across 5 stations'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* 5-Stand: Targets */}
                      {discipline.name === 'five_stand' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Targets *
                          </label>
                          <select
                            value={config.targets || 25}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value)
                              const check = canEditConfig(discipline.id, 'targets', newValue)
                              if (!check.allowed) {
                                setError(check.reason || 'Cannot modify configuration')
                                return
                              }
                              updateDisciplineConfig(discipline.id, 'targets', newValue)
                            }}
                            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            {[25, 50, 75, 100, ...(existingConfig?.targets && existingConfig.targets > 100 ? [existingConfig.targets] : [])].sort((a, b) => a - b).map(num => (
                              <option key={num} value={num}>{num} targets</option>
                            ))}
                          </select>
                          {hasScores && existingConfig && existingConfig.targets && (
                            <p className="text-xs text-gray-500 mt-1">
                              Current: {existingConfig.targets} targets • 
                              {tournament.status === 'upcoming' || tournament.status === 'active' ? ' Can only increase' : ' Cannot change (completed)'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Sporting Clays: Targets and Stations */}
                      {discipline.name === 'sporting_clays' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Number of Stations *
                            </label>
                            <select
                              value={config.stations || 10}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value)
                                const check = canEditConfig(discipline.id, 'stations', newValue)
                                if (!check.allowed) {
                                  setError(check.reason || 'Cannot modify configuration')
                                  return
                                }
                                updateDisciplineConfig(discipline.id, 'stations', newValue)
                              }}
                              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {Array.from({ length: Math.max(20, existingConfig?.stations || 0) }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num} {num === 1 ? 'station' : 'stations'}</option>
                              ))}
                            </select>
                            {hasScores && existingConfig && existingConfig.stations && (
                              <p className="text-xs text-gray-500 mt-1">
                                Current: {existingConfig.stations} stations • 
                                {tournament.status === 'upcoming' || tournament.status === 'active' ? ' Can only increase' : ' Cannot change (completed)'}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Total Number of Targets *
                            </label>
                            <select
                              value={config.targets || 100}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value)
                                const check = canEditConfig(discipline.id, 'targets', newValue)
                                if (!check.allowed) {
                                  setError(check.reason || 'Cannot modify configuration')
                                  return
                                }
                                updateDisciplineConfig(discipline.id, 'targets', newValue)
                              }}
                              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {[50, 75, 100, 125, 150, ...(existingConfig?.targets && existingConfig.targets > 150 ? [existingConfig.targets] : [])].sort((a, b) => a - b).map(num => (
                                <option key={num} value={num}>{num} targets</option>
                              ))}
                            </select>
                            {hasScores && existingConfig && existingConfig.targets ? (
                              <p className="text-xs text-gray-500 mt-1">
                                Current: {existingConfig.targets} targets • 
                                {tournament.status === 'upcoming' || tournament.status === 'active' ? ' Can only increase' : ' Cannot change (completed)'}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">
                                Total targets across {config.stations || 10} {config.stations === 1 ? 'station' : 'stations'}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

