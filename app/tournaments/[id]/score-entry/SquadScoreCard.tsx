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

// null = not yet entered; number (including 0) = explicitly entered
type AthleteScores = Record<string, (number | null)[]>

function isStationBased(config: DisciplineConfig | undefined): boolean {
  if (!config) return false
  const name = config.discipline.name.toLowerCase()
  // five_stand uses rounds of 25 like trap, not per-station entry
  return name.includes('sporting') || name.includes('super_sport')
}

function getInputCount(config: DisciplineConfig | undefined): number {
  if (!config) return 1
  if (isStationBased(config)) {
    return config.stations || 10
  }
  const name = config.discipline.name.toLowerCase()
  const defaultRounds = name.includes('five_stand') || name.includes('5_stand') ? 2 : 1
  return config.rounds || defaultRounds
}

function getMaxPerInput(config: DisciplineConfig | undefined): number {
  if (!config) return 25
  if (isStationBased(config)) {
    // targets = total targets for the event; divide by stations to get per-station max
    const stationCount = config.stations || 10
    return config.targets ? Math.ceil(config.targets / stationCount) : 5
  }
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

  // null = not entered, number (including 0) = entered
  const computeStatus = (s: AthleteScores): ScoreStatus => {
    let entered = 0
    const total = members.length * inputCount
    for (const m of members) {
      for (const v of (s[m.athleteId] || [])) { if (v !== null) entered++ }
    }
    if (entered === 0) return 'empty'
    if (entered >= total) return 'complete'
    return 'partial'
  }

  // 2D grid of input refs: [athleteIdx][colIdx]
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  const focusCell = useCallback((row: number, col: number) => {
    const el = inputRefs.current[row]?.[col]
    if (el) { el.focus(); el.select() }
  }, [])

  // Load existing scores — cells with DB records get their value (even 0); others stay null
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
            const arr: (number | null)[] = Array(inputCount).fill(null)
            for (const score of shoot.scores) {
              const idx = stationBased
                ? (score.stationNumber ?? 1) - 1
                : (score.roundNumber ?? 1) - 1
              if (idx >= 0 && idx < inputCount) arr[idx] = score.targets
            }
            initial[member.athleteId] = arr
          } else {
            initial[member.athleteId] = Array(inputCount).fill(null)
          }
        }
        setScores(initial)
        onStatusChange?.(squad.id, computeStatus(initial))
      } catch {
        const empty: AthleteScores = {}
        for (const m of members) empty[m.athleteId] = Array(inputCount).fill(null)
        setScores(empty)
        onStatusChange?.(squad.id, 'empty')
      } finally {
        setLoading(false)
      }
    }

    fetchScores()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [squad.id, discipline?.id, tournamentId, inputCount, stationBased])

  useEffect(() => {
    inputRefs.current = members.map((_, ri) =>
      inputRefs.current[ri] ? inputRefs.current[ri] : Array(inputCount).fill(null)
    )
  }, [members, inputCount])

  const setScore = (athleteId: string, index: number, value: number | null) => {
    setSaved(false)
    setScores(prev => {
      const arr = prev[athleteId] ? [...prev[athleteId]] : Array(inputCount).fill(null)
      arr[index] = value
      return { ...prev, [athleteId]: arr }
    })
  }

  const getTotal = (athleteId: string): number =>
    (scores[athleteId] || []).reduce((sum: number, v) => sum + (v ?? 0), 0)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const lastRow = members.length - 1
    const lastCol = inputCount - 1

    switch (e.key) {
      case 'Tab': {
        e.preventDefault()
        if (e.shiftKey) {
          if (col > 0) focusCell(row, col - 1)
          else if (row > 0) focusCell(row - 1, lastCol)
        } else {
          if (col < lastCol) focusCell(row, col + 1)
          else if (row < lastRow) focusCell(row + 1, 0)
        }
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (row < lastRow) focusCell(row + 1, col)
        else if (col < lastCol) focusCell(0, col + 1)
        break
      }
      case 'ArrowUp': { e.preventDefault(); if (row > 0) focusCell(row - 1, col); break }
      case 'ArrowDown': { e.preventDefault(); if (row < lastRow) focusCell(row + 1, col); break }
      case 'ArrowLeft': {
        const input = e.currentTarget
        if (input.selectionStart === 0 && input.selectionEnd === 0) {
          e.preventDefault()
          if (col > 0) focusCell(row, col - 1)
        }
        break
      }
      case 'ArrowRight': {
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
          // Only save cells that have been explicitly entered (not null)
          rounds: (scores[m.athleteId] || [])
            .flatMap((val, idx) => val !== null ? [{
              ...(stationBased ? { stationNumber: idx + 1 } : { roundNumber: idx + 1 }),
              targets: val,
              maxTargets: maxPerInput
            }] : [])
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

      {/* Max per input hint for station-based disciplines */}
      {stationBased && maxPerInput > 0 && (
        <p className="text-xs text-gray-400 mb-1">Max {maxPerInput} per {stationBased ? 'station' : 'round'}</p>
      )}

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="text-sm border-collapse w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="text-left px-3 py-2 font-semibold border-b border-r border-gray-200 sticky left-0 bg-gray-100 z-10 min-w-[160px]">
                Athlete
              </th>
              {Array.from({ length: inputCount }, (_, i) => (
                <th key={i} className="px-2 py-2 font-semibold border-b border-r border-gray-200 text-center w-14">
                  {stationBased ? `S${i + 1}` : `R${i + 1}`}
                  {stationBased && <div className="text-[10px] font-normal text-gray-400">/{maxPerInput}</div>}
                </th>
              ))}
              <th className="px-3 py-2 font-semibold border-b border-gray-200 text-center w-16 bg-gray-50">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {(() => {
              // Detect tied totals among athletes with at least one score entered
              const enteredTotals = members
                .map(m => ({ id: m.athleteId, total: getTotal(m.athleteId), hasScore: (scores[m.athleteId] || []).some(v => v !== null) }))
                .filter(e => e.hasScore)
              const totalCounts: Record<number, number> = {}
              for (const e of enteredTotals) totalCounts[e.total] = (totalCounts[e.total] || 0) + 1
              const tiedAthleteIds = new Set(enteredTotals.filter(e => totalCounts[e.total] > 1).map(e => e.id))
              return members.map((member, rowIdx) => {
              const athleteScores = scores[member.athleteId] || Array(inputCount).fill(null)
              const total = getTotal(member.athleteId)
              const isTied = tiedAthleteIds.has(member.athleteId)
              if (!inputRefs.current[rowIdx]) {
                inputRefs.current[rowIdx] = Array(inputCount).fill(null)
              }

              return (
                <tr key={member.athleteId} className={`group hover:bg-blue-50/30 ${isTied ? 'bg-red-50' : ''}`}>
                  <td className={`px-3 py-1.5 border-b border-r border-gray-200 sticky left-0 z-10 ${isTied ? 'bg-red-50 group-hover:bg-red-100/60' : 'bg-white group-hover:bg-blue-50/30'}`}>
                    <div className="font-medium text-gray-900 leading-tight">{member.athlete.user.name}</div>
                    <div className="text-xs text-gray-400 leading-tight">
                      {member.athlete.division || '—'}
                      {member.athlete.team && ` · ${member.athlete.team.name}`}
                    </div>
                  </td>

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
                        step={1}
                        value={val === null ? '' : val}
                        placeholder="—"
                        onChange={e => {
                          const raw = e.target.value
                          setScore(member.athleteId, colIdx, raw === '' ? null : Math.min(parseFloat(raw), maxPerInput))
                        }}
                        onFocus={e => e.target.select()}
                        onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                        className={`w-full h-9 text-center text-sm font-mono bg-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${val === null ? 'text-gray-300' : 'text-gray-900'}`}
                      />
                    </td>
                  ))}

                  <td className={`px-3 py-1.5 border-b border-gray-200 text-center font-bold tabular-nums ${isTied ? 'bg-red-100 text-red-800' : 'bg-gray-50 text-gray-800'}`}>
                    {(scores[member.athleteId] || []).some(v => v !== null) ? (
                      <span className="flex items-center justify-center gap-1">
                        {total}
                        {isTied && <span className="text-[10px] font-bold text-red-600 leading-none">TIE</span>}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              )
            })
            })()}
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
