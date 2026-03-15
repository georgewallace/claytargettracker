'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  calculateHOAAwards,
  calculateCollegiateHOA,
  calculateEventAwards,
  calculateTeamAwards,
  getDisciplineCategory,
  AwardConfig,
  AthleteScoreEntry,
} from '@/lib/awardCalculations'

interface AwardLeaderboardProps {
  tournament: {
    id: string
    name: string
    leaderboardTabInterval?: number | null
    disciplines: Array<{
      disciplineId: string
      discipline: { id: string; name: string; displayName: string }
    }>
    shoots: Array<{
      id: string
      athleteId: string
      disciplineId: string
      tiebreakScore?: number | null
      longRunFront?: number | null
      longRunBack?: number | null
      scores: Array<{ roundNumber?: number | null; stationNumber?: number | null; targets: number; maxTargets: number }>
      athlete: {
        id: string
        division: string | null
        gender: string | null
        user: { name: string }
        team: { id: string; name: string; logoUrl?: string | null } | null
      }
    }>
    awardStructureVersion: string
    hoaScope: string
    hoaIncludesDivisions: string
    hoaHighLadyCanWinBoth: boolean
    collegiateHOAEnabled: boolean
    individualEventPlaces: number
    teamEventPlaces: number
    teamSizeDefault: number
    trapTeamSize: number
    leaderboardHideTeams: boolean
    longRunDisciplines?: string
    tiebreakOrder?: string
  }
}

const DIVISION_PLACES_PER_PAGE = 6

// ── Sub-components ────────────────────────────────────────────────────────────

function PlaceCard({
  place,
  entry,
  label,
  teamNames,
  highlight,
}: {
  place: string
  entry: AthleteScoreEntry | null
  label?: string
  teamNames: Record<string, string>
  highlight?: RowHighlight
}) {
  if (!entry) return null
  const teamName = entry.athlete.teamId ? teamNames[entry.athlete.teamId] : null
  return (
    <div className={`border border-gray-200 rounded p-1.5 shadow-sm hover:shadow-md transition-shadow ${highlight ? highlight.rowBg : 'bg-white'}`}>
      <div className={`text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 ${highlight ? highlight.rankColor : 'text-indigo-600'}`}>{place}</div>
      <div className="font-semibold text-gray-900 text-xs leading-tight truncate">{entry.athlete.name}</div>
      {teamName && <div className="text-[10px] text-gray-500 leading-tight truncate">{teamName}</div>}
      <div className={`text-sm font-bold leading-tight ${highlight ? highlight.rankColor : 'text-gray-800'}`}>
        {entry.totalScore} <span className="text-[10px] font-normal text-gray-400">pts</span>
      </div>
      {label && <div className="text-[9px] text-gray-400">{label}</div>}
    </div>
  )
}

function TeamCard({
  rank,
  team,
}: {
  rank: string
  team: { teamId: string; teamName: string; athletes: AthleteScoreEntry[]; totalScore: number } | null
}) {
  if (!team) return null
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">{rank}</div>
      <div className="font-semibold text-gray-900 text-sm leading-tight">{team.teamName}</div>
      <div className="text-base font-bold text-gray-800 mt-1">
        {team.totalScore} <span className="text-xs font-normal text-gray-400">pts</span>
      </div>
      <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
        {team.athletes.map(a => a.athlete.name).join(', ')}
      </div>
    </div>
  )
}

type RowHighlight = {
  rowBg: string       // Tailwind bg class for the row
  rankColor: string   // Tailwind text class for the rank number
  badge?: string      // Short label shown after the name
  badgeColor: string  // Tailwind text+bg classes for the badge
}

const HIGHLIGHT_STYLES: Record<string, RowHighlight> = {
  hoa:   { rowBg: 'bg-yellow-50',  rankColor: 'text-yellow-600', badge: 'HOA',      badgeColor: 'bg-yellow-100 text-yellow-700' },
  ru:    { rowBg: 'bg-gray-100',   rankColor: 'text-gray-500',   badge: 'RU',       badgeColor: 'bg-gray-200 text-gray-600' },
  third: { rowBg: 'bg-orange-50',  rankColor: 'text-orange-500', badge: '3rd',      badgeColor: 'bg-orange-100 text-orange-600' },
  lady:  { rowBg: 'bg-pink-50',    rankColor: 'text-pink-500',   badge: 'HOA Lady', badgeColor: 'bg-pink-100 text-pink-600' },
}

// Place-indexed highlight styles (1st=gold, 2nd=silver, 3rd=bronze, 4th/5th=subtle)
const PLACE_HIGHLIGHTS: RowHighlight[] = [
  { rowBg: 'bg-yellow-50',  rankColor: 'text-yellow-600', badge: '1st', badgeColor: 'bg-yellow-100 text-yellow-700' },
  { rowBg: 'bg-gray-100',   rankColor: 'text-gray-500',   badge: '2nd', badgeColor: 'bg-gray-200 text-gray-600' },
  { rowBg: 'bg-orange-50',  rankColor: 'text-orange-500', badge: '3rd', badgeColor: 'bg-orange-100 text-orange-600' },
  { rowBg: 'bg-blue-50',    rankColor: 'text-blue-500',   badge: '4th', badgeColor: 'bg-blue-100 text-blue-600' },
  { rowBg: 'bg-blue-50',    rankColor: 'text-blue-500',   badge: '5th', badgeColor: 'bg-blue-100 text-blue-600' },
]

// Build highlights map for a ranked list of entries, capped to configured places
function buildPlaceHighlights(entries: AthleteScoreEntry[], places: number): Record<string, RowHighlight> {
  const result: Record<string, RowHighlight> = {}
  for (let i = 0; i < Math.min(places, PLACE_HIGHLIGHTS.length, entries.length); i++) {
    result[entries[i].athleteId] = PLACE_HIGHLIGHTS[i]
  }
  return result
}

const DIVISION_LABELS: Record<string, string> = { JV: 'Junior Varsity' }
function divLabel(div: string | null) { return div ? (DIVISION_LABELS[div] ?? div) : '—' }

// Returns athleteIds that share the same effective rank (after applying all tiebreak criteria)
// with at least one other athlete — these are "unbroken" ties with no way to separate them
function getUnbrokenTiedIds(entries: AthleteScoreEntry[], config: AwardConfig, disciplineId?: string): Set<string> {
  const category = disciplineId ? getDisciplineCategory(disciplineId) : 'other'
  const key = (e: AthleteScoreEntry): string => {
    const parts = [`score:${e.totalScore}`]
    for (const criterion of config.tiebreakOrder) {
      if (criterion === 'longrun' && category === 'skeet' && disciplineId && config.longRunDisciplines.includes(disciplineId)) {
        parts.push(`lr_max:${Math.max(e.longRunFront ?? 0, e.longRunBack ?? 0)}`)
        parts.push(`lr_min:${Math.min(e.longRunFront ?? 0, e.longRunBack ?? 0)}`)
      } else if (criterion === 'countback' && category === 'sporting') {
        // NSCA: include each station score descending in the key
        const nums = [...new Set(e.scores.map(s => s.stationNumber ?? s.roundNumber ?? 0))]
          .filter(n => n > 0).sort((x, y) => y - x)
        for (const num of nums) {
          const score = e.scores.find(s => (s.stationNumber ?? s.roundNumber ?? 0) === num)?.targets ?? 0
          parts.push(`cb${num}:${score}`)
        }
      } else if (criterion === 'shootoff') parts.push(`so:${e.tiebreakScore ?? 'null'}`)
    }
    return parts.join('|')
  }
  const counts: Record<string, number> = {}
  for (const e of entries) counts[key(e)] = (counts[key(e)] || 0) + 1
  return new Set(entries.filter(e => counts[key(e)] > 1).map(e => e.athleteId))
}

// Compact ranked table of athletes
function RankedTable({
  rows,
  teamNames,
  showDivision = false,
  disciplineCols,
  highlights = {},
  startRank = 1,
  showTies = true,
  config,
}: {
  rows: AthleteScoreEntry[]
  teamNames: Record<string, string>
  showDivision?: boolean
  disciplineCols?: { id: string; label: string }[]
  highlights?: Record<string, RowHighlight>
  startRank?: number
  showTies?: boolean
  config: AwardConfig
  disciplineId?: string
}) {
  if (rows.length === 0) return null
  const unbrokenTied = showTies ? getUnbrokenTiedIds(rows, config, disciplineId) : new Set<string>()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="px-2 py-1.5 text-left font-semibold w-8">#</th>
            <th className="px-2 py-1.5 text-left font-semibold">Athlete</th>
            {showDivision && <th className="px-2 py-1.5 text-left font-semibold hidden sm:table-cell">Concurrent</th>}
            <th className="px-2 py-1.5 text-left font-semibold hidden sm:table-cell">Team</th>
            {disciplineCols?.map(d => (
              <th key={d.id} className="px-2 py-1.5 text-right font-semibold hidden md:table-cell whitespace-nowrap">{d.label}</th>
            ))}
            <th className="px-2 py-1.5 text-right font-semibold">Total</th>
            <th className="w-3 pr-1"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, i) => {
            const teamName = entry.athlete.teamId ? teamNames[entry.athlete.teamId] : null
            const hl = highlights[entry.athleteId]
            const isTied = unbrokenTied.has(entry.athleteId)
            return (
              <tr
                key={entry.athleteId}
                className={`border-t border-gray-100 ${isTied ? 'bg-red-50' : hl ? hl.rowBg : 'hover:bg-gray-50'}`}
              >
                <td className="px-2 py-1.5">
                  <span className={`text-xs font-bold tabular-nums ${isTied ? 'text-red-500' : hl ? hl.rankColor : 'text-gray-400'}`}>
                    {startRank + i}
                  </span>
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-gray-900 text-xs leading-tight">{entry.athlete.name}</span>
                    {isTied && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded leading-none bg-red-100 text-red-600">TIE</span>
                    )}
                    {!isTied && hl?.badge && (
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${hl.badgeColor}`}>
                        {hl.badge}
                      </span>
                    )}
                  </div>
                  {showDivision && (
                    <div className="text-[10px] text-gray-400 sm:hidden leading-tight">
                      {divLabel(entry.athlete.division)}{teamName ? ` · ${teamName}` : ''}
                    </div>
                  )}
                </td>
                {showDivision && (
                  <td className="px-2 py-1.5 text-xs text-gray-500 hidden sm:table-cell whitespace-nowrap">
                    {divLabel(entry.athlete.division)}
                  </td>
                )}
                <td className="px-2 py-1.5 text-xs text-gray-500 hidden sm:table-cell truncate max-w-[120px]">
                  {teamName || '—'}
                </td>
                {disciplineCols?.map(d => {
                  const score = (entry as any)[`disc_${d.id}`]
                  return (
                    <td key={d.id} className="px-2 py-1.5 text-right text-xs text-gray-500 hidden md:table-cell tabular-nums">
                      {score != null ? score : '—'}
                    </td>
                  )
                })}
                <td className="px-2 py-1.5 text-right">
                  <span className={`font-bold text-sm tabular-nums ${isTied ? 'text-red-600' : hl ? hl.rankColor : 'text-gray-800'}`}>
                    {entry.totalScore}
                  </span>
                </td>
                <td className="w-3 pr-1 text-left align-middle">
                  {isTied && (
                    <span className="text-[10px] text-red-500 font-bold leading-none">*</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Section wrapper — white card matching old leaderboard style
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AwardLeaderboard({ tournament }: AwardLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<string>('hoa')
  const [isCycling, setIsCycling] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [allAthletesPage, setAllAthletesPage] = useState(0)
  const showAthleteTeams = !tournament.leaderboardHideTeams
  const ALL_ATHLETES_PAGE_SIZE = 20

  const activeTabRef = useRef(activeTab)
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])

  const allAthletesPageRef = useRef(allAthletesPage)
  useEffect(() => { allAthletesPageRef.current = allAthletesPage }, [allAthletesPage])

  // Fullscreen support
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const config: AwardConfig = useMemo(() => ({
    hoaScope: tournament.hoaScope,
    hoaIncludesDivisions: (() => {
      try { return JSON.parse(tournament.hoaIncludesDivisions) } catch { return ['Novice', 'Intermediate', 'JV', 'Varsity'] }
    })(),
    hoaHighLadyCanWinBoth: tournament.hoaHighLadyCanWinBoth,
    collegiateHOAEnabled: tournament.collegiateHOAEnabled,
    individualEventPlaces: tournament.individualEventPlaces,
    teamEventPlaces: tournament.teamEventPlaces,
    teamSizeDefault: tournament.teamSizeDefault,
    trapTeamSize: tournament.trapTeamSize,
    tiebreakOrder: (() => {
      try { return JSON.parse(tournament.tiebreakOrder ?? '["shootoff","longrun"]') } catch { return ['shootoff', 'longrun'] }
    })(),
    longRunDisciplines: (() => {
      try { return JSON.parse(tournament.longRunDisciplines ?? '[]') } catch { return [] }
    })(),
  }), [tournament])

  // Build AthleteScoreEntry map per discipline
  const entriesByDiscipline = useMemo(() => {
    const map: Record<string, AthleteScoreEntry[]> = {}
    for (const shoot of tournament.shoots) {
      const total = shoot.scores.reduce((sum, s) => sum + (s.targets || 0), 0)
      const entry: AthleteScoreEntry = {
        athleteId: shoot.athleteId,
        disciplineId: shoot.disciplineId,
        totalScore: total,
        tiebreakScore: shoot.tiebreakScore,
        longRunFront: shoot.longRunFront,
        longRunBack: shoot.longRunBack,
        scores: shoot.scores,
        athlete: {
          division: shoot.athlete.division === 'Junior Varsity' ? 'JV' : shoot.athlete.division,
          gender: shoot.athlete.gender,
          teamId: shoot.athlete.team?.id || null,
          name: shoot.athlete.user.name,
        },
      }
      if (!map[shoot.disciplineId]) map[shoot.disciplineId] = []
      map[shoot.disciplineId].push(entry)
    }
    return map
  }, [tournament.shoots])

  // Team names lookup: teamId → teamName
  const teamNames = useMemo(() => {
    const m: Record<string, string> = {}
    for (const shoot of tournament.shoots) {
      if (shoot.athlete.team) m[shoot.athlete.team.id] = shoot.athlete.team.name
    }
    return m
  }, [tournament.shoots])

  const hoaResult = useMemo(() => calculateHOAAwards(entriesByDiscipline, config), [entriesByDiscipline, config])
  const collegiateResult = useMemo(() => calculateCollegiateHOA(entriesByDiscipline, config), [entriesByDiscipline, config])

  // Combined scores for full HOA rankings (all athletes, sorted by total across disciplines)
  const allAthletesHOA = useMemo((): AthleteScoreEntry[] => {
    const combined: Record<string, { entry: AthleteScoreEntry; total: number; tiebreak: number; byDisc: Record<string, number> }> = {}
    for (const [discId, entries] of Object.entries(entriesByDiscipline)) {
      for (const e of entries) {
        if (!combined[e.athleteId]) {
          combined[e.athleteId] = { entry: e, total: 0, tiebreak: 0, byDisc: {} }
        }
        combined[e.athleteId].total += e.totalScore
        combined[e.athleteId].byDisc[discId] = e.totalScore
        if ((e.tiebreakScore ?? 0) > combined[e.athleteId].tiebreak) {
          combined[e.athleteId].tiebreak = e.tiebreakScore ?? 0
        }
      }
    }
    return Object.values(combined)
      .sort((a, b) => b.total - a.total || b.tiebreak - a.tiebreak || a.entry.athlete.name.localeCompare(b.entry.athlete.name))
      .map(({ entry, total, tiebreak, byDisc }) => {
        const extras: Record<string, number> = {}
        for (const [discId, score] of Object.entries(byDisc)) extras[`disc_${discId}`] = score
        return { ...entry, ...extras, totalScore: total, tiebreakScore: tiebreak || null }
      })
  }, [entriesByDiscipline])

  // Only show discipline tabs that have actual score data
  const disciplinesWithScores = tournament.disciplines.filter(
    d => (entriesByDiscipline[d.disciplineId]?.length ?? 0) > 0
  )

  const tabs = [
    { id: 'hoa', label: '👑 HOA' },
    ...disciplinesWithScores.map(d => ({ id: d.disciplineId, label: d.discipline.displayName })),
    { id: 'all', label: '📋 All Athletes' },
  ]

  const divisionList = ['Varsity', 'JV', 'Intermediate', 'Novice', 'Collegiate']
  const divisionLabel: Record<string, string> = { JV: 'Junior Varsity' }
  const placeLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']

  // Auto-cycling: cycle through tabs; on the "all" tab, page through before advancing
  useEffect(() => {
    if (!isCycling) return
    const intervalMs = tournament.leaderboardTabInterval || 15000
    const tabIds = tabs.map(t => t.id)
    const totalAllPages = Math.ceil(allAthletesHOA.length / ALL_ATHLETES_PAGE_SIZE)

    const timer = setInterval(() => {
      const current = activeTabRef.current
      if (current === 'all' && totalAllPages > 1) {
        const nextPage = allAthletesPageRef.current + 1
        if (nextPage < totalAllPages) {
          setAllAthletesPage(nextPage)
          return
        }
        // Last page reached — fall through to next tab, reset page
        setAllAthletesPage(0)
      }
      const idx = tabIds.indexOf(current)
      const next = tabIds[(idx + 1) % tabIds.length]
      setActiveTab(next)
      if (next === 'all') setAllAthletesPage(0)
    }, intervalMs)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCycling, tournament.leaderboardTabInterval, tabs.length, allAthletesHOA.length])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    if (id === 'all') setAllAthletesPage(0)
  }

  return (
    <div className="space-y-4" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
      {/* Controls Bar — matches old leaderboard style */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded border border-gray-200">
            <div className="w-2 h-2 rounded-full flex-shrink-0 bg-green-400 animate-pulse" />
            <span className="text-gray-700 text-xs font-medium whitespace-nowrap">Live</span>
          </div>
          <button
            onClick={() => setIsCycling(c => !c)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition font-medium border border-gray-300"
          >
            {isCycling ? 'Pause Cycling' : 'Auto-Cycle'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 flex-wrap justify-center md:justify-start">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Zoom + Fullscreen */}
        <div className="flex items-center gap-2 justify-center md:justify-end">
          <button
            onClick={() => setZoom(z => Math.max(50, z - 10))}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition font-medium border border-gray-300"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-gray-700 text-sm font-medium min-w-[3.5rem] text-center whitespace-nowrap">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(150, z + 10))}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition font-medium border border-gray-300"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition font-medium border border-gray-300 whitespace-nowrap"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            <span className="hidden sm:inline">{isFullscreen ? '⊗' : '⛶'} </span>
            {isFullscreen ? 'Exit' : 'Full'}
          </button>
        </div>
      </div>

      {/* HOA Tab */}
      {activeTab === 'hoa' && (
        <div className="space-y-4">
          <Section title="High Over All">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <PlaceCard place="HOA" entry={hoaResult.hoa} teamNames={teamNames} highlight={HIGHLIGHT_STYLES.hoa} />
              <PlaceCard place="Runner Up" entry={hoaResult.ru} teamNames={teamNames} highlight={HIGHLIGHT_STYLES.ru} />
              <PlaceCard place="3rd Place" entry={hoaResult.third} teamNames={teamNames} highlight={HIGHLIGHT_STYLES.third} />
              <PlaceCard place="HOA Lady" entry={hoaResult.hoaLady} teamNames={teamNames} highlight={HIGHLIGHT_STYLES.lady} />
            </div>
          </Section>

          {config.collegiateHOAEnabled && (collegiateResult.first || collegiateResult.second || collegiateResult.third) && (
            <Section title="Collegiate HOA">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <PlaceCard place="1st" entry={collegiateResult.first} teamNames={teamNames} highlight={PLACE_HIGHLIGHTS[0]} />
                <PlaceCard place="2nd" entry={collegiateResult.second} teamNames={teamNames} highlight={PLACE_HIGHLIGHTS[1]} />
                <PlaceCard place="3rd" entry={collegiateResult.third} teamNames={teamNames} highlight={PLACE_HIGHLIGHTS[2]} />
              </div>
            </Section>
          )}

        </div>
      )}

      {/* All Athletes Tab */}
      {activeTab === 'all' && allAthletesHOA.length > 0 && (() => {
        const totalPages = Math.ceil(allAthletesHOA.length / ALL_ATHLETES_PAGE_SIZE)
        const pageRows = allAthletesHOA.slice(
          allAthletesPage * ALL_ATHLETES_PAGE_SIZE,
          (allAthletesPage + 1) * ALL_ATHLETES_PAGE_SIZE
        )
        const start = allAthletesPage * ALL_ATHLETES_PAGE_SIZE + 1
        const end = Math.min((allAthletesPage + 1) * ALL_ATHLETES_PAGE_SIZE, allAthletesHOA.length)
        return (
          <Section title={`All Athletes — Combined (${allAthletesHOA.length})`}>
            <RankedTable
              rows={pageRows}
              teamNames={teamNames}
              showDivision
              showTies={false}
              config={config}
              disciplineCols={disciplinesWithScores.map(d => ({ id: d.disciplineId, label: d.discipline.displayName }))}
              highlights={{
                ...(hoaResult.hoa ? { [hoaResult.hoa.athleteId]: HIGHLIGHT_STYLES.hoa } : {}),
                ...(hoaResult.ru ? { [hoaResult.ru.athleteId]: HIGHLIGHT_STYLES.ru } : {}),
                ...(hoaResult.third ? { [hoaResult.third.athleteId]: HIGHLIGHT_STYLES.third } : {}),
                // Lady overrides her position style if she also holds a top-3 spot
                ...(hoaResult.hoaLady ? { [hoaResult.hoaLady.athleteId]: HIGHLIGHT_STYLES.lady } : {}),
              }}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{start}–{end} of {allAthletesHOA.length}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAllAthletesPage(p => Math.max(0, p - 1))}
                    disabled={allAthletesPage === 0}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-gray-700"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setAllAthletesPage(i)}
                      className={`px-3 py-1 text-sm rounded border transition font-medium ${
                        allAthletesPage === i
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setAllAthletesPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={allAthletesPage === totalPages - 1}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-gray-700"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </Section>
        )
      })()}

      {/* Discipline Tabs */}
      {disciplinesWithScores.map(d => {
        if (activeTab !== d.disciplineId) return null
        const disciplineEntries = entriesByDiscipline[d.disciplineId] || []
        const eventResult = calculateEventAwards(disciplineEntries, d.disciplineId, config)
        const teamResult = calculateTeamAwards(disciplineEntries, d.disciplineId, teamNames, config)
        const hasTeamAwards = Object.values(teamResult.divisionTeams).some(t => t.length > 0) || teamResult.openTeams.length > 0

        // IDs of event champions — excluded from division results
        const championIds = new Set([
          eventResult.championMen?.athleteId,
          eventResult.championLady?.athleteId,
        ].filter(Boolean) as string[])

        // All athletes by division (uncapped, champions excluded)
        const allDivisionSections = divisionList.flatMap(div => {
          const all = [...disciplineEntries]
            .filter(e => e.athlete.division === div && !championIds.has(e.athleteId))
            .sort((a, b) => b.totalScore - a.totalScore || (b.tiebreakScore ?? 0) - (a.tiebreakScore ?? 0) || a.athlete.name.localeCompare(b.athlete.name))
          if (all.length === 0) return []
          return [{ div, athletes: all }]
        })

        // All teams (uncapped) — recalculate without teamEventPlaces cap
        const uncappedTeamResult = calculateTeamAwards(disciplineEntries, d.disciplineId, teamNames, { ...config, teamEventPlaces: 999 })
        const allTeamSections = [
          ...divisionList.flatMap(div => {
            const teams = uncappedTeamResult.divisionTeams[div]
            if (!teams || teams.length === 0) return []
            return [{ label: `${divisionLabel[div] ?? div} Concurrent`, teams }]
          }),
          ...(uncappedTeamResult.openTeams.length > 0 ? [{ label: 'Open', teams: uncappedTeamResult.openTeams }] : [])
        ]

        const COLS = 3
        const ROWS_PER_COL = 10

        return (
          <div key={d.disciplineId} className="space-y-4">
            {/* Event Champions — PlaceCards */}
            {(eventResult.championMen || eventResult.championLady) && (
              <Section title="Event Champions">
                <div className="grid grid-cols-2 gap-2">
                  <PlaceCard place="Men's Champion" entry={eventResult.championMen} teamNames={teamNames} />
                  <PlaceCard place="Lady's Champion" entry={eventResult.championLady} teamNames={teamNames} />
                </div>
              </Section>
            )}

            {/* Division Results — divisions side by side, athletes flow down each column */}
            {allDivisionSections.length > 0 && (
              <Section title="Concurrent Results">
                <div className="overflow-x-auto">
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${allDivisionSections.length}, minmax(160px, 260px))` }}>
                  {allDivisionSections.map(({ div, athletes }) => {
                    const divHighlights = buildPlaceHighlights(athletes, config.individualEventPlaces)
                    const divUnbrokenTied = getUnbrokenTiedIds(athletes, config, d.disciplineId)
                    return (
                      <div key={div} className="border border-gray-100 rounded overflow-hidden">
                        {/* Division header */}
                        <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{divisionLabel[div] ?? div}</span>
                          <span className="text-[10px] text-gray-400">{athletes.length}</span>
                        </div>
                        {/* Athletes */}
                        {athletes.map((entry, i) => {
                          const hl = divHighlights[entry.athleteId]
                          const isTied = divUnbrokenTied.has(entry.athleteId)
                          const teamName = entry.athlete.teamId ? teamNames[entry.athlete.teamId] : null
                          return (
                            <div
                              key={entry.athleteId}
                              className={`flex items-center gap-1.5 px-2 py-1 border-b border-gray-100 last:border-b-0 ${isTied ? 'bg-red-50' : hl ? hl.rowBg : 'hover:bg-gray-50'}`}
                            >
                              <span className={`text-[10px] font-bold tabular-nums w-5 shrink-0 ${isTied ? 'text-red-500' : hl ? hl.rankColor : 'text-gray-400'}`}>
                                {i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate leading-tight text-gray-900">
                                  {entry.athlete.name}
                                  {isTied && (
                                    <span className="ml-1 text-[9px] font-bold px-1 py-0.5 rounded leading-none bg-red-100 text-red-600">TIE</span>
                                  )}
                                  {!isTied && hl?.badge && (
                                    <span className={`ml-1 text-[9px] font-bold px-1 py-0.5 rounded leading-none ${hl.badgeColor}`}>
                                      {hl.badge}
                                    </span>
                                  )}
                                </div>
                                {showAthleteTeams && teamName && (
                                  <div className="text-[10px] text-gray-400 truncate leading-tight">{teamName}</div>
                                )}
                              </div>
                              <span className={`text-xs font-bold tabular-nums shrink-0 ${isTied ? 'text-red-600' : hl ? hl.rankColor : 'text-gray-700'}`}>
                                {entry.totalScore}
                              </span>
                              <span className="w-3 shrink-0 text-left">
                                {isTied && (
                                  <span className="text-[10px] text-red-500 font-bold leading-none">*</span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
                </div>
              </Section>
            )}

            {/* Team Results — columns side-by-side, same layout as Division Results */}
            {allTeamSections.length > 0 && (
              <Section title="Team Results">
                <div className="overflow-x-auto">
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${allTeamSections.length}, minmax(200px, 260px))` }}>
                    {allTeamSections.map(({ label, teams }) => (
                      <div key={label} className="border border-gray-100 rounded overflow-hidden">
                        {/* Group header */}
                        <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{label}</span>
                          <span className="text-[10px] text-gray-400">{teams.length}</span>
                        </div>
                        {/* Teams */}
                        {teams.map((team, i) => {
                          const hl = i < config.teamEventPlaces && i < PLACE_HIGHLIGHTS.length ? PLACE_HIGHLIGHTS[i] : undefined
                          return (
                            <div
                              key={`${team.teamId}-${i}`}
                              className={`px-2 py-1.5 border-b border-gray-100 last:border-b-0 ${hl ? hl.rowBg : 'hover:bg-gray-50'}`}
                            >
                              <div className="flex items-start gap-1.5">
                                <span className={`text-[10px] font-bold tabular-nums w-7 shrink-0 ${hl ? hl.rankColor : 'text-gray-400'}`}>
                                  {placeLabels[i] ?? `${i + 1}`}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-gray-900 truncate leading-tight">{team.teamName}</div>
                                  <div className="leading-tight">
                                    {team.athletes.map(a => (
                                      <div key={a.athleteId} className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-gray-400 truncate">{a.athlete.name}</span>
                                        <span className="text-[10px] text-gray-500 tabular-nums shrink-0">{a.totalScore}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <span className={`text-xs font-bold tabular-nums shrink-0 ${hl ? hl.rankColor : 'text-gray-700'}`}>
                                  {team.totalScore}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

          </div>
        )
      })}
    </div>
  )
}
