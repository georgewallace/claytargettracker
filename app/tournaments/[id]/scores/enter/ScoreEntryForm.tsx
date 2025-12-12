'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Discipline {
  id: string
  name: string
  displayName: string
}

interface Shoot {
  id: string
  disciplineId: string
  discipline: Discipline
  scores: Array<{
    station: number
    targets: number
    totalTargets: number
  }>
}

interface ScoreEntryFormProps {
  tournamentId: string
  athleteId: string
  disciplines: Discipline[]
  existingShoots: Shoot[]
}

export default function ScoreEntryForm({ tournamentId, athleteId, disciplines, existingShoots }: ScoreEntryFormProps) {
  const router = useRouter()
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(disciplines[0]?.id || '')
  const [stations, setStations] = useState<Array<{ station: number; targets: number; totalTargets: number }>>([
    { station: 1, targets: 0, totalTargets: 25 },
    { station: 2, targets: 0, totalTargets: 25 },
    { station: 3, targets: 0, totalTargets: 25 },
    { station: 4, targets: 0, totalTargets: 25 },
    { station: 5, targets: 0, totalTargets: 25 },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load existing scores when discipline changes
  useEffect(() => {
    if (selectedDiscipline) {
      const existingShoot = existingShoots.find(s => s.disciplineId === selectedDiscipline)
      if (existingShoot && existingShoot.scores.length > 0) {
        setStations(prevStations =>
          prevStations.map(station => {
            const existing = existingShoot.scores.find(s => s.station === station.station)
            return existing ? {
              station: station.station,
              targets: existing.targets,
              totalTargets: existing.totalTargets
            } : station
          })
        )
      } else {
        // Reset to defaults
        setStations([
          { station: 1, targets: 0, totalTargets: 25 },
          { station: 2, targets: 0, totalTargets: 25 },
          { station: 3, targets: 0, totalTargets: 25 },
          { station: 4, targets: 0, totalTargets: 25 },
          { station: 5, targets: 0, totalTargets: 25 },
        ])
      }
    }
  }, [selectedDiscipline, existingShoots])

  const handleTargetsChange = (stationIndex: number, value: string) => {
    const numValue = parseInt(value) || 0
    setStations(prev => prev.map((station, idx) =>
      idx === stationIndex
        ? { ...station, targets: Math.min(Math.max(0, numValue), station.totalTargets) }
        : station
    ))
  }

  const handleTotalChange = (stationIndex: number, value: string) => {
    const numValue = parseInt(value) || 25
    setStations(prev => prev.map((station, idx) =>
      idx === stationIndex
        ? { ...station, totalTargets: Math.max(1, numValue), targets: Math.min(station.targets, numValue) }
        : station
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/shoots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          athleteId,
          disciplineId: selectedDiscipline,
          scores: stations
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save scores')
        return
      }

      setSuccess('Scores saved successfully!')
      setTimeout(() => {
        router.push(`/tournaments/${tournamentId}`)
        router.refresh()
      }, 1500)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totalTargets = stations.reduce((sum, s) => sum + s.targets, 0)
  const totalPossible = stations.reduce((sum, s) => sum + s.totalTargets, 0)
  const percentage = totalPossible > 0 ? ((totalTargets / totalPossible) * 100).toFixed(1) : '0'

  const selectedDisciplineName = disciplines.find(d => d.id === selectedDiscipline)?.displayName || ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Discipline Selection */}
      {disciplines.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discipline
          </label>
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {disciplines.map(discipline => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {disciplines.length === 1 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-indigo-800 font-medium">
            Discipline: {selectedDisciplineName}
          </p>
        </div>
      )}

      {/* Score Entry */}
      <div className="space-y-4">
        {stations.map((station, index) => (
          <div key={station.station} className="grid grid-cols-3 gap-4 items-center p-4 border border-gray-200 rounded-lg">
            <div className="font-semibold text-gray-900">
              Station {station.station}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Targets Hit
              </label>
              <input
                type="number"
                min="0"
                max={station.totalTargets}
                value={station.targets}
                onChange={(e) => handleTargetsChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Total Targets
              </label>
              <input
                type="number"
                min="1"
                value={station.totalTargets}
                onChange={(e) => handleTotalChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total Score:</span>
          <span className="text-2xl font-bold text-indigo-600">
            {totalTargets} / {totalPossible} ({percentage}%)
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? 'Saving...' : 'Save Scores'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
