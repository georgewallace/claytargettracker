'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Discipline {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface TournamentDiscipline {
  id: string
  disciplineId: string
  rounds: number | null
  targets: number | null
  stations: number | null
  discipline: Discipline
}

interface Tournament {
  id: string
  name: string
  location: string
  startDate: Date
  endDate: Date
  description: string | null
  status: string
  leaderboardTabInterval: number | null
  photosUrl: string | null
  disciplines: TournamentDiscipline[]
  awardStructureVersion: string
  hoaScope: string
  hoaIncludesDivisions: string
  hoaHighLadyCanWinBoth: boolean
  collegiateHOAEnabled: boolean
  individualEventPlaces: number
  teamEventPlaces: number
  teamSizeDefault: number
  trapTeamSize: number
}

interface EditTournamentFormProps {
  tournament: Tournament
  allDisciplines: Discipline[]
  disciplineRegistrationCounts: Record<string, number>
  disciplineScoreCounts: Record<string, number>
}

// Disciplines that use rounds (trap, skeet)
function isRoundBased(name: string) {
  return name === 'trap' || name === 'skeet'
}

// Disciplines that use stations (sporting clays, 5-stand, super sport)
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

function defaultTargets(name: string) {
  if (name === 'five_stand') return 25
  if (name === 'super_sport') return 50
  if (name === 'sporting_clays') return 100
  return 0
}

export default function EditTournamentForm({ tournament, allDisciplines, disciplineRegistrationCounts, disciplineScoreCounts }: EditTournamentFormProps) {
  const router = useRouter()

  const formatDateForInput = (date: Date) => new Date(date).toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    name: tournament.name,
    location: tournament.location,
    startDate: formatDateForInput(tournament.startDate),
    endDate: formatDateForInput(tournament.endDate),
    description: tournament.description || '',
    status: tournament.status,
    photosUrl: tournament.photosUrl || ''
  })

  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    tournament.disciplines.map(td => td.disciplineId)
  )

  // Per-discipline round/station config, keyed by disciplineId
  const [disciplineConfigs, setDisciplineConfigs] = useState<Record<string, { rounds: number; stations: number; targets: number }>>(() => {
    const map: Record<string, { rounds: number; stations: number; targets: number }> = {}
    for (const td of tournament.disciplines) {
      map[td.disciplineId] = {
        rounds: td.rounds ?? defaultRounds(td.discipline.name),
        stations: td.stations ?? defaultStations(td.discipline.name),
        targets: td.targets ?? defaultTargets(td.discipline.name),
      }
    }
    return map
  })

  const [leaderboardTabInterval, setLeaderboardTabInterval] = useState(tournament.leaderboardTabInterval || 15000)
  const [awardStructureVersion, setAwardStructureVersion] = useState(tournament.awardStructureVersion || 'legacy')
  const [hoaScope, setHoaScope] = useState(tournament.hoaScope || 'combined')
  const [hoaHighLadyCanWinBoth, setHoaHighLadyCanWinBoth] = useState(tournament.hoaHighLadyCanWinBoth ?? true)
  const [collegiateHOAEnabled, setCollegiateHOAEnabled] = useState(tournament.collegiateHOAEnabled ?? true)
  const [individualEventPlaces, setIndividualEventPlaces] = useState(tournament.individualEventPlaces ?? 3)
  const [teamEventPlaces, setTeamEventPlaces] = useState(tournament.teamEventPlaces ?? 2)
  const [teamSizeDefault, setTeamSizeDefault] = useState(tournament.teamSizeDefault ?? 3)
  const [trapTeamSize, setTrapTeamSize] = useState(tournament.trapTeamSize ?? 5)

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

    // Build disciplineConfigurations with rounds/stations for each selected discipline
    const disciplineConfigurations = selectedDisciplines.map(disciplineId => {
      const disc = allDisciplines.find(d => d.id === disciplineId)
      const cfg = disciplineConfigs[disciplineId] || {}
      if (!disc) return { disciplineId }
      return {
        disciplineId,
        rounds: isRoundBased(disc.name) ? (cfg.rounds ?? defaultRounds(disc.name)) : null,
        stations: isStationBased(disc.name) ? (cfg.stations ?? defaultStations(disc.name)) : null,
        targets: isStationBased(disc.name) ? (cfg.targets || null) : null,
      }
    })

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          disciplineConfigurations,
          enableScores: true,
          enableLeaderboard: true,
          leaderboardTabInterval,
          awardStructureVersion,
          hoaScope,
          hoaIncludesDivisions: JSON.stringify(['Novice', 'Intermediate', 'JV', 'Varsity']),
          hoaHighLadyCanWinBoth,
          collegiateHOAEnabled,
          individualEventPlaces,
          teamEventPlaces,
          teamSizeDefault,
          trapTeamSize,
        })
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to update tournament')
        return
      }

      router.push(`/tournaments/${tournament.id}`)
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
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
      // Initialize config defaults when first selecting
      if (!prev.includes(disciplineId) && !disciplineConfigs[disciplineId]) {
        setDisciplineConfigs(c => ({
          ...c,
          [disciplineId]: { rounds: defaultRounds(disciplineName), stations: defaultStations(disciplineName), targets: defaultTargets(disciplineName) }
        }))
      }
      return next
    })
  }

  const updateDisciplineConfig = (disciplineId: string, field: 'rounds' | 'stations' | 'targets', value: number) => {
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
          {allDisciplines.map(discipline => {
            const registrationCount = disciplineRegistrationCounts[discipline.id] || 0
            const scoreCount = disciplineScoreCounts[discipline.id] || 0
            const hasRegistrations = registrationCount > 0
            const hasScores = scoreCount > 0
            const isSelected = selectedDisciplines.includes(discipline.id)
            const cannotUncheck = isSelected && hasRegistrations
            const cfg = disciplineConfigs[discipline.id] || { rounds: defaultRounds(discipline.name), stations: defaultStations(discipline.name) }
            const showRounds = isRoundBased(discipline.name)
            const showStations = isStationBased(discipline.name)

            return (
              <div key={discipline.id}
                className={`border rounded-lg transition ${cannotUncheck ? 'border-gray-400 bg-gray-50' : isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}>
                <label className="flex items-start p-4 cursor-pointer">
                  <input type="checkbox" checked={isSelected}
                    onChange={() => toggleDiscipline(discipline.id, discipline.name)}
                    disabled={cannotUncheck}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" />
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
                      <div className="text-xs text-orange-600 mt-1 font-medium">⚠️ Cannot remove - athletes registered</div>
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
                          <div className="space-y-2">
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
                            <div className="flex items-center gap-3">
                              <label className="text-sm text-gray-600 w-28">Total targets</label>
                              <input type="number" min={1} max={500}
                                value={cfg.targets || ''}
                                placeholder={discipline.name === 'five_stand' ? '25' : '100'}
                                onChange={e => updateDisciplineConfig(discipline.id, 'targets', parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                              <span className="text-xs text-gray-500">
                                = {cfg.targets && cfg.stations ? Math.ceil(cfg.targets / (discipline.name === 'five_stand' ? 5 : cfg.stations)) : '?'} max per station
                              </span>
                            </div>
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

      <div>
        <label htmlFor="photosUrl" className="block text-sm font-medium text-gray-700 mb-2">Photos URL</label>
        <input id="photosUrl" name="photosUrl" type="url" value={formData.photosUrl} onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="https://photos.google.com/share/..." />
        <p className="text-xs text-gray-500 mt-1">Paste a Google Photos share link or similar album URL</p>
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

      {/* Award Structure v2 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Award Structure</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
          <select value={awardStructureVersion} onChange={e => setAwardStructureVersion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="legacy">Legacy (Excel import)</option>
            <option value="v2">New (v2 Awards)</option>
          </select>
        </div>
        {awardStructureVersion === 'v2' && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">HOA Scope</label>
              <select value={hoaScope} onChange={e => setHoaScope(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="combined">Combined (total across all disciplines)</option>
                <option value="per_discipline">Per Discipline</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="hoaHighLadyCanWinBoth" checked={hoaHighLadyCanWinBoth}
                onChange={e => setHoaHighLadyCanWinBoth(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="hoaHighLadyCanWinBoth" className="text-sm text-gray-700">HOA Lady can also win HOA/RU/3rd</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="collegiateHOAEnabled" checked={collegiateHOAEnabled}
                onChange={e => setCollegiateHOAEnabled(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="collegiateHOAEnabled" className="text-sm text-gray-700">Enable Collegiate HOA</label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Individual Event Places</label>
                <input type="number" min={1} max={10} value={individualEventPlaces}
                  onChange={e => setIndividualEventPlaces(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Award Places</label>
                <input type="number" min={1} max={5} value={teamEventPlaces}
                  onChange={e => setTeamEventPlaces(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Team Size</label>
                <input type="number" min={1} max={10} value={teamSizeDefault}
                  onChange={e => setTeamSizeDefault(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trap Team Size</label>
                <input type="number" min={1} max={10} value={trapTeamSize}
                  onChange={e => setTrapTeamSize(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </form>
  )
}
