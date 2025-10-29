'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ShootOffSettings, { ShootOffConfig } from '@/components/ShootOffSettings'

interface Discipline {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface CreateTournamentFormProps {
  disciplines: Discipline[]
}

interface DisciplineConfig {
  rounds?: number      // For Trap/Skeet
  targets?: number     // For 5-Stand/Sporting Clays
  stations?: number    // For Sporting Clays only
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
  const [disciplineConfigs, setDisciplineConfigs] = useState<Record<string, DisciplineConfig>>(() => {
    // Initialize with default values for each discipline
    const configs: Record<string, DisciplineConfig> = {}
    disciplines.forEach(d => {
      if (d.name === 'trap' || d.name === 'skeet') {
        configs[d.id] = { rounds: 1 }
      } else if (d.name === 'five_stand') {
        configs[d.id] = { targets: 25 }
      } else if (d.name === 'sporting_clays') {
        configs[d.id] = { targets: 100, stations: 10 }
      }
    })
    return configs
  })
  const [shootOffConfig, setShootOffConfig] = useState<ShootOffConfig>({
    enableShootOffs: true,
    shootOffTriggers: ['1st', '2nd', '3rd'],
    shootOffFormat: 'sudden_death',
    shootOffTargetsPerRound: 2,
    shootOffStartStation: '',
    shootOffRequiresPerfect: false
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
      const discipline = disciplines.find(d => d.id === disciplineId)
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

      const payload = {
        ...formData,
        disciplineConfigurations,
        // Shoot-off configuration
        enableShootOffs: shootOffConfig.enableShootOffs,
        shootOffTriggers: JSON.stringify(shootOffConfig.shootOffTriggers),
        shootOffFormat: shootOffConfig.shootOffFormat,
        shootOffTargetsPerRound: shootOffConfig.shootOffTargetsPerRound,
        shootOffStartStation: shootOffConfig.shootOffStartStation || null,
        shootOffRequiresPerfect: shootOffConfig.shootOffRequiresPerfect
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

  const updateDisciplineConfig = (disciplineId: string, field: keyof DisciplineConfig, value: number) => {
    setDisciplineConfigs(prev => ({
      ...prev,
      [disciplineId]: {
        ...prev[disciplineId],
        [field]: value
      }
    }))
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
          Disciplines * (select at least one and configure)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disciplines.map(discipline => {
            const isSelected = selectedDisciplines.includes(discipline.id)
            const config = disciplineConfigs[discipline.id] || {}
            
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
                            onChange={(e) => updateDisciplineConfig(discipline.id, 'rounds', parseInt(e.target.value))}
                            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="1">1 Round (25 targets)</option>
                            <option value="2">2 Rounds (50 targets)</option>
                            <option value="3">3 Rounds (75 targets)</option>
                            <option value="4">4 Rounds (100 targets)</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {discipline.name === 'skeet' ? 'Each round has 25 targets across 8 stations' : 'Each round has 25 targets across 5 stations'}
                          </p>
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
                            onChange={(e) => updateDisciplineConfig(discipline.id, 'targets', parseInt(e.target.value))}
                            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="25">25 targets</option>
                            <option value="50">50 targets</option>
                            <option value="75">75 targets</option>
                            <option value="100">100 targets</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            5-Stand typically uses 5 stations with 5 targets per station (25 total)
                          </p>
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
                              onChange={(e) => updateDisciplineConfig(discipline.id, 'stations', parseInt(e.target.value))}
                              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num} {num === 1 ? 'station' : 'stations'}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Total Number of Targets *
                            </label>
                            <select
                              value={config.targets || 100}
                              onChange={(e) => updateDisciplineConfig(discipline.id, 'targets', parseInt(e.target.value))}
                              className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="50">50 targets</option>
                              <option value="75">75 targets</option>
                              <option value="100">100 targets</option>
                              <option value="125">125 targets</option>
                              <option value="150">150 targets</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              Total targets across {config.stations || 10} {config.stations === 1 ? 'station' : 'stations'}
                            </p>
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

      {/* Shoot-Off Configuration */}
      <ShootOffSettings
        config={shootOffConfig}
        onChange={setShootOffConfig}
      />

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

