'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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

type AthleteScores = Record<string, number[]>

function isStationBased(config: DisciplineConfig | undefined): boolean {
  if (!config) return false
  const name = config.discipline.name.toLowerCase()
  return name.includes('sporting') || name.includes('5_stand') || name.includes('five_stand') || name.includes('super_sport')
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

type ScoreStatus = 'complete' | 'partial' | 'empty'

interface SquadScoreCardProps {
  tournamentId: string
  squad: Squad
  discipline: Discipline | undefined
  config: DisciplineConfig | undefined
  timeSlotDate: Date | string
  onStatusChange?: (squadId: string, status: ScoreStatus) => void
}

export default function SquadScoreCard({ tournamentId, squad, discipline, config, timeSlotDate, onStatusChange }: SquadScoreCardProps) {
  const [scores, setScores] = useState<AthleteScores>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const inputCount = getInputCount(config)
  const maxPerInput = getMaxPerInput(config)
  const stationBased = isStationBased(config)
  const members = squad.members

  const computeStatus = (s: AthleteScores): ScoreStatus => {
    let filled = 0
    const total = members.length * inputCount
    for (const m of members) {
      for (const v of (s[m.athleteId] || [])) { if (v > 0) filled++ }
    }
    if (filled === 0) return 'empty'
    if (filled >= total) return 'complete'
    return 'partial'
  }

  // 2D grid of input refs: [athleteIdx][colIdx]
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  const focusCell = useCallback((row: number, col: number) => {
    const el = inputRefs.current[row]?.[col]
    if (el) {
      el.focus()
      el.select()
    }
  }, [])

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

        const initial: AthleteScores = {}
        for (const member of members) {
          const shoot = shoots.find((s: any) => s.athleteId === member.athleteId)
          if (shoot && shoot.scores && shoot.scores.length > 0) {
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
        onStatusChange?.(squad.id, computeStatus(initial))
      } catch {
        const empty: AthleteScores = {}
        for (const m of members) empty[m.athleteId] = Array(inputCount).fill(0)
        setScores(empty)
        onStatusChange?.(squad.id, 'empty')
      } finally {
        setLoading(false)
      }
    }

    fetchScores()
  }, [squad.id, discipline?.id, tournamentId, inputCount, stationBased, members])

  // Initialise refs array dimensions whenever members/inputCount change
  useEffect(() => {
    inputRefs.current = members.map((_, ri) =>
      inputRefs.current[ri] ? inputRefs.current[ri] : Array(inputCount).fill(null)
    )
  }, [members, inputCount])

  const setScore = (athleteId: string, index: number, value: number) => {
    setSaved(false)
    setScores(prev => {
      const arr = prev[athleteId] ? [...prev[athleteId]] : Array(inputCount).fill(0)
      arr[index] = isNaN(value) ? 0 : value
      return { ...prev, [athleteId]: arr }
    })
  }

  const getTotal = (athleteId: string): number =>
    (scores[athleteId] || []).reduce((sum, v) => sum + (v || 0), 0)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const lastRow = members.length - 1
    const lastCol = inputCount - 1

    switch (e.key) {
      case 'Tab': {
        e.preventDefault()
        if (e.shiftKey) {
          // Shift+Tab: move left, wrap to previous row
          if (col > 0) focusCell(row, col - 1)
          else if (row > 0) focusCell(row - 1, lastCol)
        } else {
          // Tab: move right, wrap to next row
          if (col < lastCol) focusCell(row, col + 1)
          else if (row < lastRow) focusCell(row + 1, 0)
        }
        break
      }
      case 'Enter': {
        e.preventDefault()
        // Enter: move down (same column), wrap to top of next column
        if (row < lastRow) focusCell(row + 1, col)
        else if (col < lastCol) focusCell(0, col + 1)
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        if (row > 0) focusCell(row - 1, col)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        if (row < lastRow) focusCell(row + 1, col)
        break
      }
      case 'ArrowLeft': {
        // Only navigate if cursor is at start of input
        const input = e.currentTarget
        if (input.selectionStart === 0 && input.selectionEnd === 0) {
          e.preventDefault()
          if (col > 0) focusCell(row, col - 1)
        }
        break
      }
      case 'ArrowRight': {
        // Only navigate if cursor is at end of input
        const input = e.currentTarget
        if (input.selectionStart === input.value.length) {
          e.preventDefault()
          if (col < lastCol) focusCell(row, col + 1)
        }
        break
      }
    }
  }

  const handleSave = async () => {
    if (!discipline) return
    setSaving(true)
    setError('')

    try {
      const payload = members
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
      onStatusChange?.(squad.id, computeStatus(scores))
    } catch {
      setError('Failed to save scores')
    } finally {
      setSaving(false)
    }
  }

  if (!discipline) return <div className="py-2 text-sm text-gray-500">No discipline info available.</div>
  if (loading) return <div className="py-4 text-center text-sm text-gray-500">Loading scores...</div>
  if (members.length === 0) return <div className="py-2 text-sm text-gray-500">No athletes in this squad.</div>

  return (
    <div className="mt-2">
      {error && (
        <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
      )}

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="text-sm border-collapse w-full">
          {/* Column headers */}
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="text-left px-3 py-2 font-semibold border-b border-r border-gray-200 sticky left-0 bg-gray-100 z-10 min-w-[160px]">
                Athlete
              </th>
              {Array.from({ length: inputCount }, (_, i) => (
                <th key={i} className="px-2 py-2 font-semibold border-b border-r border-gray-200 text-center w-14">
                  {stationBased ? `S${i + 1}` : `R${i + 1}`}
                </th>
              ))}
              <th className="px-3 py-2 font-semibold border-b border-gray-200 text-center w-16 bg-gray-50">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {members.map((member, rowIdx) => {
              const athleteScores = scores[member.athleteId] || Array(inputCount).fill(0)
              const total = getTotal(member.athleteId)
              // Initialise ref row
              if (!inputRefs.current[rowIdx]) {
                inputRefs.current[rowIdx] = Array(inputCount).fill(null)
              }

              return (
                <tr key={member.athleteId} className="group hover:bg-blue-50/30">
                  {/* Frozen athlete name column */}
                  <td className="px-3 py-1.5 border-b border-r border-gray-200 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10">
                    <div className="font-medium text-gray-900 leading-tight">{member.athlete.user.name}</div>
                    <div className="text-xs text-gray-400 leading-tight">
                      {member.athlete.division || '—'}
                      {member.athlete.team && ` · ${member.athlete.team.name}`}
                    </div>
                  </td>

                  {/* Score input cells */}
                  {athleteScores.map((val, colIdx) => (
                    <td key={colIdx} className="p-0 border-b border-r border-gray-200">
                      <input
                        ref={el => {
                          if (!inputRefs.current[rowIdx]) inputRefs.current[rowIdx] = []
                          inputRefs.current[rowIdx][colIdx] = el
                        }}
                        type="number"
                        min={0}
                        max={maxPerInput}
                        step={0.5}
                        value={val === 0 ? '' : val}
                        placeholder="0"
                        onChange={e => setScore(member.athleteId, colIdx, parseFloat(e.target.value))}
                        onFocus={e => e.target.select()}
                        onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                        className="w-full h-9 text-center text-sm font-mono bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                  ))}

                  {/* Running total */}
                  <td className="px-3 py-1.5 border-b border-gray-200 text-center font-bold text-gray-800 bg-gray-50 tabular-nums">
                    {total || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition text-sm font-medium"
        >
          {saving ? 'Saving...' : 'Save Squad'}
        </button>
        {saved && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
        <span className="text-xs text-gray-400 ml-auto">Tab / Enter to navigate · Arrow keys to move</span>
      </div>
    </div>
  )
}
