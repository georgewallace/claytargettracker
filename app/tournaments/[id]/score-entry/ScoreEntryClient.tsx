'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import SquadScoreCard from './SquadScoreCard'
import { format } from 'date-fns'
import { parseTiebreakOrder } from '@/lib/awardCalculations'

// ── Ties Panel ────────────────────────────────────────────────────────────────

interface TieGroupAthlete {
  athleteId: string
  name: string
  division: string | null
  teamName: string | null
  tiebreakScore: number | null
  longRunFront: number | null
  longRunBack: number | null
  scores?: Array<{ stationNumber?: number | null; roundNumber?: number | null; targets: number }>
}

interface TieGroup {
  disciplineId: string
  disciplineName: string
  score: number
  broken: boolean
  resolvedBy: string | null  // null = not broken; 'LRF' | 'LRB' | 'shoot-off' | null
  athletes: TieGroupAthlete[]
  startingRank: number  // 1 + count of athletes with higher score in this discipline
}

function getDiscCategory(discSlug: string): 'skeet' | 'trap' | 'sporting' | 'other' {
  const s = discSlug.toLowerCase()
  if (s.includes('skeet')) return 'skeet'
  if (s.includes('trap')) return 'trap'
  if (s.includes('sporting') || s.includes('super_sport')) return 'sporting'
  return 'other'
}

function getTieGroupStatus(
  athletes: TieGroupAthlete[],
  discId: string,
  discSlug: string,
  tiebreakOrder: string[],
  longRunDisciplines: string[],
  startingRank: number = 1,
  shootOffMaxPlace: number = 0,
  longRunBreaksTopTies: boolean = false
): { broken: boolean; resolvedBy: string | null } {
  const useLongRun = longRunDisciplines.includes(discId)
  const discCategory = getDiscCategory(discSlug)
  const useCountback = discCategory === 'sporting'
  const useShootOffCriteria = shootOffMaxPlace === 0 || startingRank <= shootOffMaxPlace

  // USAYESS auto-tiebreak for places beyond shootOffMaxPlace
  if (!useShootOffCriteria) {
    if (useLongRun) {
      // LRF first, then LRB (not max/min)
      const keys = athletes.map(a => `${a.longRunFront ?? 0}|${a.longRunBack ?? 0}`)
      if (new Set(keys).size !== athletes.length) return { broken: false, resolvedBy: null }
      const lrfKeys = athletes.map(a => `${a.longRunFront ?? 0}`)
      if (new Set(lrfKeys).size === athletes.length) return { broken: true, resolvedBy: 'Long Run (LRF)' }
      return { broken: true, resolvedBy: 'Long Run (LRB)' }
    }
    if (useCountback) {
      const getStationNums = (a: TieGroupAthlete) =>
        [...new Set((a.scores ?? []).map((s: { stationNumber?: number | null; roundNumber?: number | null }) =>
          s.stationNumber ?? s.roundNumber ?? 0))]
          .filter((n): n is number => n > 0).sort((x, y) => y - x)
      const makeKey = (a: TieGroupAthlete): string =>
        getStationNums(a).map(num =>
          ((a.scores ?? []).find((s: { stationNumber?: number | null; roundNumber?: number | null; targets: number }) =>
            (s.stationNumber ?? s.roundNumber ?? 0) === num)?.targets ?? 0).toString()
        ).join('|')
      const keys = athletes.map(makeKey)
      if (new Set(keys).size === athletes.length) return { broken: true, resolvedBy: 'Countback' }
      return { broken: false, resolvedBy: null }
    }
    // Trap/other 4+: no automatic resolver
    return { broken: false, resolvedBy: null }
  }

  // Standard shoot-off criteria path
  // USAYESS (shootOffMaxPlace > 0): places 1-3 are shoot-off ONLY — longrun/countback don't break these ties.
  // Standard mode (shootOffMaxPlace === 0): apply full tiebreakOrder with countback injected for sporting.
  const effectiveTBOrder: string[] = shootOffMaxPlace > 0
    ? (longRunBreaksTopTies && useLongRun ? ['shootoff', 'longrun'] : ['shootoff'])
    : useCountback && !tiebreakOrder.includes('countback')
      ? ['countback', ...tiebreakOrder]
      : tiebreakOrder

  // Build composite key for each athlete across all criteria.
  // Criteria apply based on sport type:
  //   longrun   → NSSA skeet only (max LRF/LRB, then opposite end)
  //   countback → NSCA sporting only (station scores from last back)
  //   shootoff  → all sports
  const getStationNums = (a: TieGroupAthlete) =>
    [...new Set((a.scores ?? []).map((s: { stationNumber?: number | null; roundNumber?: number | null }) =>
      s.stationNumber ?? s.roundNumber ?? 0))]
      .filter((n): n is number => n > 0)
      .sort((x, y) => y - x)

  const makeKey = (a: TieGroupAthlete): string => {
    const parts: string[] = []
    for (const criterion of effectiveTBOrder) {
      if (criterion === 'longrun' && useLongRun) {
        parts.push(`${Math.max(a.longRunFront ?? 0, a.longRunBack ?? 0)}`)
        parts.push(`${Math.min(a.longRunFront ?? 0, a.longRunBack ?? 0)}`)
      } else if (criterion === 'countback' && useCountback) {
        for (const num of getStationNums(a)) {
          const score = (a.scores ?? []).find((s: { stationNumber?: number | null; roundNumber?: number | null; targets: number }) =>
            (s.stationNumber ?? s.roundNumber ?? 0) === num)?.targets ?? 0
          parts.push(`${score}`)
        }
      } else if (criterion === 'shootoff') {
        parts.push(`${a.tiebreakScore ?? 'x'}`)
      } else {
        parts.push('?')
      }
    }
    return parts.join('|')
  }

  const keys = athletes.map(a => makeKey(a))
  if (new Set(keys).size !== athletes.length) return { broken: false, resolvedBy: null }

  // Expand criteria into individual slots for prefix-key search
  const expandedCriteria: string[] = []
  for (const c of effectiveTBOrder) {
    if (c === 'longrun' && useLongRun) { expandedCriteria.push('lr_max', 'lr_min') }
    else if (c === 'countback' && useCountback) {
      const nums = getStationNums(athletes[0])
      nums.forEach((_, i) => expandedCriteria.push(`cb_${i}`))
    } else { expandedCriteria.push(c) }
  }

  const prefixParts = (upTo: number) =>
    athletes.map(a => {
      const parts: string[] = []
      for (const criterion of effectiveTBOrder) {
        if (parts.length >= upTo) break
        if (criterion === 'longrun' && useLongRun) {
          if (parts.length < upTo) parts.push(`${Math.max(a.longRunFront ?? 0, a.longRunBack ?? 0)}`)
          if (parts.length < upTo) parts.push(`${Math.min(a.longRunFront ?? 0, a.longRunBack ?? 0)}`)
        } else if (criterion === 'countback' && useCountback) {
          for (const num of getStationNums(a)) {
            if (parts.length >= upTo) break
            const score = (a.scores ?? []).find((s: { stationNumber?: number | null; roundNumber?: number | null; targets: number }) =>
              (s.stationNumber ?? s.roundNumber ?? 0) === num)?.targets ?? 0
            parts.push(`${score}`)
          }
        } else if (criterion === 'shootoff') {
          parts.push(`${a.tiebreakScore ?? 'x'}`)
        } else {
          parts.push('?')
        }
      }
      return parts.join('|')
    })

  for (let i = 1; i <= expandedCriteria.length; i++) {
    const partial = prefixParts(i)
    if (new Set(partial).size === athletes.length) {
      const slot = expandedCriteria[i - 1]
      const label = slot === 'lr_max' || slot === 'lr_min' ? 'Long Run'
        : slot.startsWith('cb_') ? 'Countback'
        : 'shoot-off'
      return { broken: true, resolvedBy: label }
    }
  }

  return { broken: true, resolvedBy: null }
}

function computeCountbackRanks(
  athletes: TieGroupAthlete[],
  startStation: number,
  groupStartingRank: number
): Map<string, number> {
  const getScore = (a: TieGroupAthlete, station: number) =>
    (a.scores ?? []).find(s => (s.stationNumber ?? s.roundNumber ?? 0) === station)?.targets ?? 0

  const allNums = [...new Set(athletes.flatMap(a =>
    (a.scores ?? []).map(s => s.stationNumber ?? s.roundNumber ?? 0)
  ))].filter(n => n > 0)
  const maxSt = startStation > 0 ? startStation : (allNums.length > 0 ? Math.max(...allNums) : 0)
  const stations = allNums.filter(n => n <= maxSt).sort((x, y) => y - x)

  const sorted = [...athletes].sort((a, b) => {
    for (const st of stations) {
      const diff = getScore(b, st) - getScore(a, st)
      if (diff !== 0) return diff
    }
    return a.name.localeCompare(b.name)
  })

  // Assign ranks — athletes with the same scores at every station share a rank
  const rankMap = new Map<string, number>()
  let rank = groupStartingRank
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      // Check if this athlete ties with the previous
      const same = stations.every(st => getScore(sorted[i], st) === getScore(sorted[i - 1], st))
      if (!same) rank = groupStartingRank + i
    }
    rankMap.set(sorted[i].athleteId, rank)
  }
  return rankMap
}

function TiesPanel({
  tournamentId,
  tiebreakOrder,
  longRunDisciplines,
  shootOffMaxPlace,
  longRunBreaksTopTies: longRunBreaksTopTiesProp = false,
}: {
  tournamentId: string
  tiebreakOrder: string[]
  longRunDisciplines: string[]
  shootOffMaxPlace: number
  longRunBreaksTopTies?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [allTieGroups, setAllTieGroups] = useState<TieGroup[]>([])
  const [discSlugsMap, setDiscSlugsMap] = useState<Record<string, string>>({})
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [countbackStartStation, setCountbackStartStation] = useState(0)
  const [longRunBreaksTopTies, setLongRunBreaksTopTies] = useState(longRunBreaksTopTiesProp)

  const tieGroups = showAll ? allTieGroups : allTieGroups.filter(g => !g.broken)

  const fetchTies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/leaderboard`)
      if (!res.ok) return
      const data = await res.json()

      // Use the tournament's tiebreakOrder and longRunDisciplines from the response
      // if they differ from what was passed as props (data may be fresher)
      const apiTiebreakOrder: string[] = data.tiebreakOrder
        ? parseTiebreakOrder(data.tiebreakOrder)
        : tiebreakOrder
      const apiLongRunDisciplines: string[] = (() => {
        try { return JSON.parse(data.longRunDisciplines || '[]') } catch { return longRunDisciplines }
      })()
      const apiShootOffMaxPlace: number = data.shootOffMaxPlace ?? shootOffMaxPlace
      const apiCountbackStartStation: number = data.countbackStartStation ?? 0
      setCountbackStartStation(apiCountbackStartStation)
      setLongRunBreaksTopTies(data.longRunBreaksTopTies ?? false)

      const discNames: Record<string, string> = {}
      const discSlugs: Record<string, string> = {}
      for (const td of data.disciplines ?? []) {
        discNames[td.disciplineId] = td.discipline.displayName
        discSlugs[td.disciplineId] = td.discipline.name
      }
      setDiscSlugsMap(discSlugs)

      const byDisc: Record<string, Record<string, {
        total: number
        tiebreak: number | null
        longRunFront: number | null
        longRunBack: number | null
        name: string
        division: string | null
        teamName: string | null
        scores: Array<{ stationNumber?: number | null; roundNumber?: number | null; targets: number }>
      }>> = {}

      for (const shoot of data.shoots ?? []) {
        const scores = shoot.scores ?? []
        const total = scores.reduce((s: number, sc: { targets: number }) => s + sc.targets, 0)
        if (total === 0) continue
        if (!byDisc[shoot.disciplineId]) byDisc[shoot.disciplineId] = {}
        byDisc[shoot.disciplineId][shoot.athleteId] = {
          total,
          tiebreak: shoot.tiebreakScore ?? null,
          longRunFront: shoot.longRunFront ?? null,
          longRunBack: shoot.longRunBack ?? null,
          name: shoot.athlete.user.name,
          division: shoot.athlete.division,
          teamName: shoot.athlete.team?.name ?? null,
          scores,
        }
      }

      // Bucket by total score — captures all ties, broken or not
      const groups: TieGroup[] = []
      for (const [discId, athletes] of Object.entries(byDisc)) {
        const buckets: Record<number, TieGroupAthlete[]> = {}
        for (const [athleteId, info] of Object.entries(athletes)) {
          if (!buckets[info.total]) buckets[info.total] = []
          buckets[info.total].push({
            athleteId,
            name: info.name,
            division: info.division,
            teamName: info.teamName,
            tiebreakScore: info.tiebreak,
            longRunFront: info.longRunFront,
            longRunBack: info.longRunBack,
            scores: info.scores,
          })
        }
        for (const [scoreStr, aths] of Object.entries(buckets)) {
          if (aths.length < 2) continue
          const score = Number(scoreStr)
          // startingRank = 1 + count of athletes with strictly higher score in this discipline
          const startingRank = 1 + Object.values(athletes).filter(a => a.total > score).length
          const { broken, resolvedBy } = getTieGroupStatus(aths, discId, discSlugs[discId] ?? discId, apiTiebreakOrder, apiLongRunDisciplines, startingRank, apiShootOffMaxPlace, longRunBreaksTopTies)
          groups.push({
            disciplineId: discId,
            disciplineName: discNames[discId] ?? discId,
            score,
            broken,
            resolvedBy,
            athletes: aths,
            startingRank,
          })
        }
      }
      groups.sort((a, b) => a.disciplineName.localeCompare(b.disciplineName) || b.score - a.score)
      setAllTieGroups(groups)
      setLastFetched(new Date())

      // Pre-populate shoot-off inputs
      const newInputs: Record<string, string> = {}
      for (const [discId, athletes] of Object.entries(byDisc)) {
        for (const [athleteId, info] of Object.entries(athletes)) {
          if (info.tiebreak != null) newInputs[`${athleteId}:${discId}`] = String(info.tiebreak)
        }
      }
      setInputs(prev => ({ ...newInputs, ...prev }))
    } finally {
      setLoading(false)
    }
  }, [tournamentId, tiebreakOrder, longRunDisciplines, shootOffMaxPlace, longRunBreaksTopTiesProp])

  const saveTiebreak = async (athleteId: string, disciplineId: string) => {
    const key = `${athleteId}:${disciplineId}`
    const val = inputs[key]
    setSaving(prev => ({ ...prev, [key]: true }))
    setSaved(prev => ({ ...prev, [key]: false }))
    try {
      await fetch(`/api/tournaments/${tournamentId}/scores`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, disciplineId, tiebreakScore: val === '' ? null : parseFloat(val) }),
      })
      setSaved(prev => ({ ...prev, [key]: true }))
      // Refresh ties after a short delay so user sees the saved state first
      setTimeout(() => fetchTies(), 800)
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) fetchTies()
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition ${
          allTieGroups.filter(g => !g.broken).length > 0
            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${allTieGroups.filter(g => !g.broken).length > 0 ? 'bg-red-500' : 'bg-gray-300'}`} />
        {open ? 'Hide Ties' : 'View Ties'}
        {allTieGroups.filter(g => !g.broken).length > 0 && (
          <span className="ml-1 bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
            {allTieGroups.filter(g => !g.broken).length} unbroken
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <span className="text-sm font-semibold text-gray-700">{showAll ? 'All Ties' : 'Unbroken Ties'}</span>
              <span className="ml-2 text-xs text-gray-400">Enter shoot-off scores to break ties</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={e => setShowAll(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-indigo-600"
                />
                <span className="text-xs text-gray-600 font-medium">Show broken ties</span>
              </label>
              {lastFetched && <span className="text-xs text-gray-400">Updated {lastFetched.toLocaleTimeString()}</span>}
              <button onClick={fetchTies} disabled={loading} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40">
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading && allTieGroups.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Loading…</div>
          ) : tieGroups.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-green-700 font-medium">
              {showAll ? 'No ties found.' : '✓ No unbroken ties'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tieGroups.map((group, gi) => {
                // Find duplicate entered shoot-off values within this group
                const enteredVals = group.athletes.map(a => inputs[`${a.athleteId}:${group.disciplineId}`] ?? '')
                const valCounts: Record<string, number> = {}
                for (const v of enteredVals) { if (v !== '') valCounts[v] = (valCounts[v] || 0) + 1 }
                const hasDuplicates = Object.values(valCounts).some(c => c > 1)
                const useLongRun = longRunDisciplines.includes(group.disciplineId)
                const discSlug = discSlugsMap[group.disciplineId] ?? ''
                const discCat = getDiscCategory(discSlug)
                const useCountback = discCat === 'sporting'
                const needsShootOff = shootOffMaxPlace === 0 || group.startingRank <= shootOffMaxPlace
                // For countback, collect station nums in descending order from all athletes in this group
                const allStationNums = useCountback
                  ? [...new Set(group.athletes.flatMap(a =>
                      (a.scores ?? []).map((s: { stationNumber?: number | null; roundNumber?: number | null }) =>
                        s.stationNumber ?? s.roundNumber ?? 0)
                    ))].filter((n): n is number => n > 0).sort((x, y) => y - x)
                  : []

                // Compute countback ranks for this group (only for countback-eligible groups)
                const countbackRankMap = useCountback
                  ? computeCountbackRanks(group.athletes, countbackStartStation, group.startingRank)
                  : null

                return (
                <div key={gi} className={`px-4 py-3 ${group.broken ? 'bg-green-50/40' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.disciplineName}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${group.broken ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {group.score} pts
                    </span>
                    {group.broken
                      ? <span className="text-xs text-green-600 font-medium">
                          ✓ {group.resolvedBy ? `Resolved by ${group.resolvedBy}` : 'Broken'}
                        </span>
                      : <span className="text-xs text-red-600 font-medium">
                          {needsShootOff
                            ? (useCountback ? 'Countback tied — needs shoot-off' : 'Needs shoot-off')
                            : useLongRun ? 'Enter LRF / LRB to resolve'
                            : useCountback ? 'Countback tied'
                            : 'Needs shoot-off'}
                        </span>
                    }
                    {hasDuplicates && (
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                        ⚠ Duplicate scores — still a tie
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-sm border-collapse w-full">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                          {countbackRankMap && <th className="px-2 py-1.5 text-center font-semibold text-gray-700 w-10">Rank</th>}
                          <th className="px-3 py-1.5 text-left font-semibold">Athlete</th>
                          <th className="px-3 py-1.5 text-left font-semibold hidden sm:table-cell">Concurrent</th>
                          <th className="px-3 py-1.5 text-left font-semibold hidden sm:table-cell">Team</th>
                          <th className="px-3 py-1.5 text-left font-semibold text-gray-500">Scores</th>
                          {useLongRun && (
                            <>
                              <th className="px-2 py-1.5 text-center font-semibold text-indigo-600">LRF</th>
                              <th className="px-2 py-1.5 text-center font-semibold text-indigo-600">LRB</th>
                            </>
                          )}
                          {useCountback && allStationNums.length > 0 && (
                            <th className="px-3 py-1.5 text-left font-semibold text-purple-600">
                              {(() => {
                                const maxSt = countbackStartStation > 0 ? countbackStartStation : allStationNums[0]
                                const effectiveStations = allStationNums.filter(n => n <= maxSt)
                                return `Countback (St ${effectiveStations.join('→')})`
                              })()}
                            </th>
                          )}
                          {needsShootOff && <th className="px-3 py-1.5 text-left font-semibold w-40">Shoot-off Score</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {group.athletes.map(a => {
                          const key = `${a.athleteId}:${group.disciplineId}`
                          const isSaving = saving[key]
                          const isSaved = saved[key]
                          const val = inputs[key] ?? ''
                          const isDuplicate = val !== '' && (valCounts[val] ?? 0) > 1
                          // Build countback station score display for this athlete (filtered by effective stations)
                          const countbackDisplay = useCountback && allStationNums.length > 0
                            ? (() => {
                                const maxSt = countbackStartStation > 0 ? countbackStartStation : allStationNums[0]
                                const effectiveStations = allStationNums.filter(n => n <= maxSt)
                                return effectiveStations.map(num => {
                                  const sc = (a.scores ?? []).find((s: { stationNumber?: number | null; roundNumber?: number | null; targets: number }) =>
                                    (s.stationNumber ?? s.roundNumber ?? 0) === num)
                                  return sc != null ? `${sc.targets}` : '—'
                                }).join(' · ')
                              })()
                            : null
                          // Build compact score breakdown (by round or station) for display
                          const scoreBreakdown = (() => {
                            const s = a.scores ?? []
                            if (s.length === 0) return '—'
                            const byStation = s.some(x => x.stationNumber != null)
                            const sorted = [...s].sort((x, y) => {
                              const nx = byStation ? (x.stationNumber ?? 0) : (x.roundNumber ?? 0)
                              const ny = byStation ? (y.stationNumber ?? 0) : (y.roundNumber ?? 0)
                              return nx - ny
                            })
                            return sorted.map(x => x.targets).join(' · ')
                          })()

                          return (
                            <tr key={a.athleteId} className={`border-t border-gray-100 ${group.broken && !isDuplicate ? 'bg-green-50/60' : isDuplicate ? 'bg-orange-50' : 'bg-red-50'}`}>
                              {countbackRankMap && (
                                <td className="px-2 py-2 text-center">
                                  <span className={`inline-block text-xs font-bold px-1.5 py-0.5 rounded ${
                                    countbackRankMap.get(a.athleteId) === group.startingRank ? 'bg-yellow-100 text-yellow-800' :
                                    countbackRankMap.get(a.athleteId) === group.startingRank + 1 ? 'bg-gray-100 text-gray-700' :
                                    'bg-gray-50 text-gray-600'
                                  }`}>
                                    {countbackRankMap.get(a.athleteId)}
                                  </span>
                                </td>
                              )}
                              <td className="px-3 py-2 font-medium text-gray-900">{a.name}</td>
                              <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{a.division || '—'}</td>
                              <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{a.teamName || '—'}</td>
                              <td className="px-3 py-2 text-gray-600 font-mono text-xs">{scoreBreakdown}</td>
                              {useLongRun && (
                                <>
                                  <td className="px-2 py-2 text-center text-indigo-700 font-mono text-sm font-semibold">
                                    {a.longRunFront ?? '—'}
                                  </td>
                                  <td className="px-2 py-2 text-center text-indigo-700 font-mono text-sm font-semibold">
                                    {a.longRunBack ?? '—'}
                                  </td>
                                </>
                              )}
                              {useCountback && allStationNums.length > 0 && (
                                <td className="px-3 py-2 text-purple-700 font-mono text-xs">
                                  {countbackDisplay ?? '—'}
                                </td>
                              )}
                              {needsShootOff && (
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={val}
                                      placeholder="—"
                                      onChange={e => {
                                        setInputs(prev => ({ ...prev, [key]: e.target.value }))
                                        setSaved(prev => ({ ...prev, [key]: false }))
                                      }}
                                      onBlur={() => { if (val !== '' && !isDuplicate) saveTiebreak(a.athleteId, group.disciplineId) }}
                                      className={`w-20 h-8 text-center text-sm font-mono border rounded bg-white focus:outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                        isDuplicate
                                          ? 'border-orange-400 focus:ring-orange-400 text-orange-700'
                                          : group.broken
                                            ? 'border-green-300 focus:ring-green-400'
                                            : 'border-red-300 focus:ring-red-400'
                                      }`}
                                    />
                                    <button
                                      onClick={() => saveTiebreak(a.athleteId, group.disciplineId)}
                                      disabled={isSaving || val === '' || isDuplicate}
                                      title={isDuplicate ? 'Duplicate score — would still be a tie' : undefined}
                                      className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
                                    >
                                      {isSaving ? '…' : 'Save'}
                                    </button>
                                    {isDuplicate && <span className="text-xs text-orange-600 font-medium">Duplicate</span>}
                                    {!isDuplicate && isSaved && <span className="text-xs text-green-600 font-medium">✓</span>}
                                  </div>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Types ────────────────────────────────────────────────────────────────────

type ScoreStatus = 'complete' | 'partial' | 'empty'

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

interface TimeSlot {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  fieldNumber: string | null
  disciplineId: string
  discipline: { id: string; name: string; displayName: string }
  squads: Squad[]
}

interface TournamentDiscipline {
  disciplineId: string
  rounds: number | null
  targets: number | null
  stations: number | null
  discipline: { id: string; name: string; displayName: string }
}

interface PreloadedShoot {
  id: string
  athleteId: string
  disciplineId: string
  tiebreakScore?: number | null
  longRunFront?: number | null
  longRunBack?: number | null
  scores: Array<{ roundNumber?: number | null; stationNumber?: number | null; targets: number; maxTargets: number }>
}

interface Tournament {
  id: string
  name: string
  awardStructureVersion: string
  longRunDisciplines: string
  tiebreakOrder: string
  shootOffMaxPlace?: number
  countbackStartStation?: number
  longRunBreaksTopTies?: boolean
  disciplines: TournamentDiscipline[]
  timeSlots: TimeSlot[]
}

interface FlatSquad {
  squad: Squad
  timeSlot: TimeSlot
}

interface ScoreEntryClientProps {
  tournament: Tournament
  initialSquadStatus: Record<string, ScoreStatus>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDateSafe(dateStr: Date | string) {
  const d = new Date(dateStr).toISOString().split('T')[0]
  return new Date(`${d}T12:00:00.000Z`)
}

const PAGE_SIZE = 10

// ── Combobox ─────────────────────────────────────────────────────────────────

function Combobox({
  value,
  onChange,
  options,
  placeholder,
  icon,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  icon: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase()
    return (q ? options.filter(o => o.toLowerCase().includes(q)) : options).slice(0, 14)
  }, [value, options])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative flex items-center gap-2 flex-1 min-w-[150px]">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
        placeholder={placeholder}
        className="w-full text-sm border-0 outline-none placeholder-gray-400 bg-transparent"
      />
      {value && (
        <button
          onClick={() => { onChange(''); setOpen(false) }}
          className="shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Clear"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
          {filtered.map(opt => (
            <li key={opt}>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(opt); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 ${
                  opt === value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status?: ScoreStatus }) {
  if (status === 'complete')
    return <span title="All scores entered" className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 inline-block" />
  if (status === 'partial')
    return <span title="Some scores missing" className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 inline-block" />
  return <span title="No scores entered" className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0 inline-block" />
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScoreEntryClient({ tournament, initialSquadStatus }: ScoreEntryClientProps) {
  // Parse tournament config
  const isV2 = tournament.awardStructureVersion === 'v2'
  const longRunDisciplines = useMemo(() => {
    try { return JSON.parse(tournament.longRunDisciplines || '[]') as string[] } catch { return [] as string[] }
  }, [tournament.longRunDisciplines])
  const tiebreakOrder = useMemo(() => {
    return parseTiebreakOrder(tournament.tiebreakOrder)
  }, [tournament.tiebreakOrder])

  // Active discipline tab
  const disciplinesWithSlots = useMemo(() => {
    const ids = new Set(tournament.timeSlots.map(ts => ts.disciplineId))
    return tournament.disciplines.filter(td => ids.has(td.disciplineId))
  }, [tournament])

  const [activeDisciplineId, setActiveDisciplineId] = useState<string>(
    disciplinesWithSlots[0]?.disciplineId ?? ''
  )

  // Bulk-preloaded scores: disciplineId → PreloadedShoot[]
  const [preloadedScores, setPreloadedScores] = useState<Record<string, PreloadedShoot[]>>({})
  const [loadingDisciplines, setLoadingDisciplines] = useState<Set<string>>(new Set())

  const loadDisciplineScores = useCallback(async (disciplineId: string) => {
    if (preloadedScores[disciplineId] !== undefined || loadingDisciplines.has(disciplineId)) return
    setLoadingDisciplines(prev => new Set([...prev, disciplineId]))
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/scores?disciplineId=${disciplineId}`)
      if (res.ok) {
        const shoots = await res.json()
        setPreloadedScores(prev => ({ ...prev, [disciplineId]: shoots }))
      }
    } finally {
      setLoadingDisciplines(prev => {
        const next = new Set(prev)
        next.delete(disciplineId)
        return next
      })
    }
  }, [tournament.id, preloadedScores, loadingDisciplines])

  // Load scores for the initial discipline on mount
  useEffect(() => {
    if (activeDisciplineId) {
      loadDisciplineScores(activeDisciplineId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filters
  const [squadFilter, setSquadFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [athleteFilter, setAthleteFilter] = useState('')
  const [page, setPage] = useState(1)

  // Expanded squads
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set())

  // Score status (seeded from server, updated as cards load/save)
  const [squadStatus, setSquadStatus] = useState<Record<string, ScoreStatus>>(initialSquadStatus)

  const handleStatusChange = useCallback((squadId: string, status: ScoreStatus) => {
    setSquadStatus(prev => prev[squadId] === status ? prev : { ...prev, [squadId]: status })
  }, [])

  const handleTabChange = (id: string) => {
    setActiveDisciplineId(id)
    setPage(1)
    loadDisciplineScores(id)
  }

  // Flat squad list for active discipline
  const allSquads: FlatSquad[] = useMemo(() => {
    const slots = tournament.timeSlots.filter(ts => ts.disciplineId === activeDisciplineId)
    return slots.flatMap(ts => ts.squads.map(squad => ({ squad, timeSlot: ts })))
  }, [tournament.timeSlots, activeDisciplineId])

  // Dropdown options (scoped to active discipline)
  const squadOptions = useMemo(() => [...new Set(allSquads.map(s => s.squad.name))].sort(), [allSquads])
  const teamOptions = useMemo(() => [
    ...new Set(allSquads.flatMap(s => s.squad.members.map(m => m.athlete.team?.name).filter(Boolean) as string[]))
  ].sort(), [allSquads])
  const athleteOptions = useMemo(() => [
    ...new Set(allSquads.flatMap(s => s.squad.members.map(m => m.athlete.user.name)))
  ].sort(), [allSquads])

  // Filtered squads
  const filteredSquads = useMemo(() => {
    const sq = squadFilter.trim().toLowerCase()
    const tm = teamFilter.trim().toLowerCase()
    const ath = athleteFilter.trim().toLowerCase()
    return allSquads.filter(({ squad }) => {
      if (sq && !squad.name.toLowerCase().includes(sq)) return false
      if (tm && !squad.members.some(m => m.athlete.team?.name.toLowerCase().includes(tm))) return false
      if (ath && !squad.members.some(m => m.athlete.user.name.toLowerCase().includes(ath))) return false
      return true
    })
  }, [allSquads, squadFilter, teamFilter, athleteFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSquads.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedSquads = filteredSquads.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Expand / collapse all filtered squads
  const allFilteredIds = filteredSquads.map(s => s.squad.id)
  const allExpanded = allFilteredIds.length > 0 && allFilteredIds.every(id => expandedSquads.has(id))

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedSquads(prev => {
        const next = new Set(prev)
        allFilteredIds.forEach(id => next.delete(id))
        return next
      })
    } else {
      setExpandedSquads(prev => new Set([...prev, ...allFilteredIds]))
    }
  }

  const toggleSquad = (squadId: string) => {
    setExpandedSquads(prev => {
      const next = new Set(prev)
      if (next.has(squadId)) next.delete(squadId)
      else next.add(squadId)
      return next
    })
  }

  const activeConfig = tournament.disciplines.find(td => td.disciplineId === activeDisciplineId)
  const activeDiscipline = disciplinesWithSlots.find(td => td.disciplineId === activeDisciplineId)?.discipline

  if (disciplinesWithSlots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No time slots found. Create time slots and squads before entering scores.
      </div>
    )
  }

  // Status legend counts (for active discipline)
  const statusCounts = useMemo(() => {
    let complete = 0, partial = 0, empty = 0
    for (const { squad } of allSquads) {
      const s = squadStatus[squad.id]
      if (s === 'complete') complete++
      else if (s === 'partial') partial++
      else empty++
    }
    return { complete, partial, empty }
  }, [allSquads, squadStatus])

  // Whether the active discipline uses long run tiebreakers (v2 only)
  const activeDisciplineUsesLongRun = isV2 && longRunDisciplines.includes(activeDisciplineId)

  return (
    <div>
      {/* ── Ties panel ──────────────────────────────────────────────── */}
      {isV2 && (
        <TiesPanel
          tournamentId={tournament.id}
          tiebreakOrder={tiebreakOrder}
          longRunDisciplines={longRunDisciplines}
          shootOffMaxPlace={tournament.shootOffMaxPlace ?? 0}
          longRunBreaksTopTies={tournament.longRunBreaksTopTies ?? false}
        />
      )}

      {/* ── Discipline tabs ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-6">
        {disciplinesWithSlots.map(td => (
          <button
            key={td.disciplineId}
            onClick={() => handleTabChange(td.disciplineId)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition -mb-px ${
              activeDisciplineId === td.disciplineId
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {td.discipline.displayName}
          </button>
        ))}
      </div>

      {/* ── Status summary ──────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
          {statusCounts.complete} complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          {statusCounts.partial} partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
          {statusCounts.empty} not started
        </span>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2 items-center">
          <Combobox
            value={squadFilter}
            onChange={v => { setSquadFilter(v); setPage(1) }}
            options={squadOptions}
            placeholder="Squad name..."
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            }
          />
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          <Combobox
            value={teamFilter}
            onChange={v => { setTeamFilter(v); setPage(1) }}
            options={teamOptions}
            placeholder="Team..."
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          <Combobox
            value={athleteFilter}
            onChange={v => { setAthleteFilter(v); setPage(1) }}
            options={athleteOptions}
            placeholder="Athlete..."
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {(squadFilter || teamFilter || athleteFilter) && (
              <button
                onClick={() => { setSquadFilter(''); setTeamFilter(''); setAthleteFilter(''); setPage(1) }}
                className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {filteredSquads.length} squad{filteredSquads.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Toolbar: expand/collapse all ────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={toggleExpandAll}
          disabled={filteredSquads.length === 0}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
        <span className="text-xs text-gray-400">
          {safePage > 1 || totalPages > 1 ? `Page ${safePage} of ${totalPages}` : ''}
        </span>
      </div>

      {/* ── Squad list ──────────────────────────────────────────────── */}
      {filteredSquads.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
          No squads match your filters.
        </div>
      ) : (
        <div className="space-y-2">
          {pagedSquads.map(({ squad, timeSlot }) => {
            // Get preloaded shots for this squad's athletes (from the bulk-fetched data)
            const preloadedForSquad = preloadedScores[activeDisciplineId]
              ? preloadedScores[activeDisciplineId].filter(
                  s => squad.members.some(m => m.athleteId === s.athleteId)
                )
              : undefined

            return (
            <div key={squad.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                onClick={() => toggleSquad(squad.id)}
              >
                {/* Status dot */}
                <StatusDot status={squadStatus[squad.id]} />

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expandedSquads.has(squad.id) ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>

                {/* Squad name */}
                <span className="font-medium text-gray-900 flex-1 truncate">{squad.name}</span>

                {/* Time slot info */}
                <span className="text-sm text-gray-500 hidden sm:block whitespace-nowrap">
                  {format(parseDateSafe(timeSlot.date), 'EEE MMM d')} · {timeSlot.startTime}
                  {timeSlot.fieldNumber && ` · ${timeSlot.fieldNumber}`}
                </span>

                {/* Member count */}
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
                  {squad.members.length} athlete{squad.members.length !== 1 ? 's' : ''}
                </span>
              </button>

              {expandedSquads.has(squad.id) && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <SquadScoreCard
                    tournamentId={tournament.id}
                    squad={squad}
                    discipline={activeDiscipline}
                    config={activeConfig}
                    timeSlotDate={timeSlot.date}
                    onStatusChange={handleStatusChange}
                    preloadedShots={preloadedForSquad}
                    useLongRun={activeDisciplineUsesLongRun}
                  />
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm rounded-md ${
                  p === safePage
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
