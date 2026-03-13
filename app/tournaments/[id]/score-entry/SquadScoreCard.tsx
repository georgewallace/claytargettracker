'use client'

import { useState, useEffect } from 'react'

interface Athlete {
  id: string
  division: string | null
  gender: string | null
  user: { name: string }
  team: { id: string; name: string } | null
}

interface SquadMember {
  id: string
  athleteId: string
  athlete: Athlete
}

interface Squad {
  id: string
  name: string
  members: SquadMember[]
}

interface Discipline {
  id: string
  name: string
  displayName: string
}

interface DisciplineConfig {
  disciplineId: string
  rounds: number | null
  targets: number | null
  stations: number | null
  discipline: Discipline
}

// Per-athlete score state: array of score values per round/station
type AthleteScores = Record<string, number[]>

function isStationBased(config: DisciplineConfig | undefined): boolean {
  if (!config) return false
  const name = config.discipline.name.toLowerCase()
  return name.includes('sporting') || name.includes('5_stand') || name.includes('five_stand')
}

function getInputCount(config: DisciplineConfig | undefined): number {
  if (!config) return 1
  if (isStationBased(config)) return config.stations || 10
  return config.rounds || 1
}

function getMaxPerInput(config: DisciplineConfig | undefined): number {
  if (!config) return 25
  if (isStationBased(config)) return config.targets ? Math.ceil(config.targets / (config.stations || 10)) : 5
  return 25
}

interface SquadScoreCardProps {
  tournamentId: string
  squad: Squad
  discipline: Discipline | undefined
  config: DisciplineConfig | undefined
  timeSlotDate: Date | string
}

export default function SquadScoreCard({ tournamentId, squad, discipline, config, timeSlotDate }: SquadScoreCardProps) {
  const [scores, setScores] = useState<AthleteScores>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const inputCount = getInputCount(config)
  const maxPerInput = getMaxPerInput(config)
  const stationBased = isStationBased(config)

  // Load existing scores
  useEffect(() => {
    if (!discipline) { setLoading(false); return }

    const fetchScores = async () => {
      try {
        const res = await fetch(
          `/api/tournaments/${tournamentId}/scores?squadId=${squad.id}&disciplineId=${discipline.id}`
        )
        if (!res.ok) { setLoading(false); return }
        const shoots = await res.json()

        // Build initial scores from existing data
        const initial: AthleteScores = {}
        for (const member of squad.members) {
          const shoot = shoots.find((s: any) => s.athleteId === member.athleteId)
          if (shoot && shoot.scores && shoot.scores.length > 0) {
            // Map scores back to input array
            const arr = Array(inputCount).fill(0)
            for (const score of shoot.scores) {
              const idx = stationBased
                ? (score.stationNumber ?? 1) - 1
                : (score.roundNumber ?? 1) - 1
              if (idx >= 0 && idx < inputCount) arr[idx] = score.targets
            }
            initial[member.athleteId] = arr
          } else {
            initial[member.athleteId] = Array(inputCount).fill(0)
          }
        }
        setScores(initial)
      } catch {
        // Initialize empty
        const empty: AthleteScores = {}
        for (const m of squad.members) empty[m.athleteId] = Array(inputCount).fill(0)
        setScores(empty)
      } finally {
        setLoading(false)
      }
    }

    fetchScores()
  }, [squad.id, discipline?.id, tournamentId, inputCount, stationBased])

  const setScore = (athleteId: string, index: number, value: number) => {
    setSaved(false)
    setScores(prev => {
      const arr = prev[athleteId] ? [...prev[athleteId]] : Array(inputCount).fill(0)
      arr[index] = value
      return { ...prev, [athleteId]: arr }
    })
  }

  const getTotal = (athleteId: string): number => {
    return (scores[athleteId] || []).reduce((sum, v) => sum + (v || 0), 0)
  }

  const handleSave = async () => {
    if (!discipline) return
    setSaving(true)
    setError('')

    try {
      const payload = squad.members
        .filter(m => scores[m.athleteId])
        .map(m => ({
          athleteId: m.athleteId,
          disciplineId: discipline.id,
          date: new Date(timeSlotDate).toISOString(),
          rounds: (scores[m.athleteId] || []).map((val, idx) => ({
            ...(stationBased ? { stationNumber: idx + 1 } : { roundNumber: idx + 1 }),
            targets: val,
            maxTargets: maxPerInput
          }))
        }))

      const res = await fetch(`/api/tournaments/${tournamentId}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: payload })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save scores')
        return
      }

      setSaved(true)
    } catch {
      setError('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  if (!discipline) {
    return <div className="py-2 text-sm text-gray-500">No discipline info available.</div>
  }

  if (loading) {
    return <div className="py-4 text-center text-sm text-gray-500">Loading scores...</div>
  }

  if (squad.members.length === 0) {
    return <div className="py-2 text-sm text-gray-500">No athletes in this squad.</div>
  }

  return (
    <div className="mt-2">
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
      )}

      {/* Header row */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-4 font-medium min-w-[140px]">Athlete</th>
              {Array.from({ length: inputCount }, (_, i) => (
                <th key={i} className="py-2 px-1 text-center font-medium min-w-[60px]">
                  {stationBased ? `S${i + 1}` : `R${i + 1}`}
                </th>
              ))}
              <th className="py-2 pl-2 text-center font-medium min-w-[60px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {squad.members.map(member => {
              const total = getTotal(member.athleteId)
              const athleteScores = scores[member.athleteId] || Array(inputCount).fill(0)
              return (
                <tr key={member.athleteId} className="border-b last:border-0">
                  <td className="py-2 pr-4">
                    <div className="font-medium text-gray-900">{member.athlete.user.name}</div>
                    <div className="text-xs text-gray-500">
                      {member.athlete.division || 'No division'}
                      {member.athlete.team && ` • ${member.athlete.team.name}`}
                    </div>
                  </td>
                  {athleteScores.map((val, idx) => (
                    <td key={idx} className="py-2 px-1">
                      <input
                        type="number"
                        min={0}
                        max={maxPerInput}
                        step={0.5}
                        value={val || 0}
                        onChange={e => setScore(member.athleteId, idx, parseFloat(e.target.value) || 0)}
                        className="w-14 text-center border border-gray-300 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  ))}
                  <td className="py-2 pl-2 text-center font-semibold text-gray-800">{total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition text-sm font-medium"
        >
          {saving ? 'Saving...' : 'Save Squad'}
        </button>
        {saved && (
          <span className="text-green-600 text-sm font-medium">Saved</span>
        )}
      </div>
    </div>
  )
}
