'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  calculateHOAAwards,
  calculateCollegiateHOA,
  calculateEventAwards,
  calculateTeamAwards,
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
  }
}

const DIVISION_PLACES_PER_PAGE = 6

// ── Sub-components ────────────────────────────────────────────────────────────

function PlaceCard({
  place,
  entry,
  label,
  teamNames,
}: {
  place: string
  entry: AthleteScoreEntry | null
  label?: string
  teamNames: Record<string, string>
}) {
  if (!entry) return null
  const teamName = entry.athlete.teamId ? teamNames[entry.athlete.teamId] : null
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">{place}</div>
      <div className="font-semibold text-gray-900 text-sm leading-tight truncate">{entry.athlete.name}</div>
      {teamName && <div className="text-xs text-gray-500 leading-tight truncate mt-0.5">{teamName}</div>}
      <div className="text-base font-bold text-gray-800 mt-1">
        {entry.totalScore} <span className="text-xs font-normal text-gray-400">pts</span>
      </div>
      {label && <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>}
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
  // Per-discipline pagination: divisionPage & teamPage
  const [divisionPage, setDivisionPage] = useState(0)
  const [teamPage, setTeamPage] = useState(0)

  const activeTabRef = useRef(activeTab)
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])

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
        scores: shoot.scores,
        athlete: {
          division: shoot.athlete.division,
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

  // Only show discipline tabs that have actual score data
  const disciplinesWithScores = tournament.disciplines.filter(
    d => (entriesByDiscipline[d.disciplineId]?.length ?? 0) > 0
  )

  const tabs = [
    { id: 'hoa', label: '👑 HOA' },
    ...disciplinesWithScores.map(d => ({ id: d.disciplineId, label: d.discipline.displayName })),
  ]

  const divisionList = ['Varsity', 'JV', 'Intermediate', 'Novice', 'Collegiate']
  const placeLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']

  // Auto-cycling: cycle through tabs in order
  useEffect(() => {
    if (!isCycling) return
    const intervalMs = tournament.leaderboardTabInterval || 15000
    const tabIds = tabs.map(t => t.id)

    const timer = setInterval(() => {
      const current = activeTabRef.current
      const idx = tabIds.indexOf(current)
      const next = tabIds[(idx + 1) % tabIds.length]
      setActiveTab(next)
      setDivisionPage(0)
      setTeamPage(0)
    }, intervalMs)

    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCycling, tournament.leaderboardTabInterval, tabs.length])

  // Reset pagination when tab changes
  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setDivisionPage(0)
    setTeamPage(0)
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PlaceCard place="HOA" entry={hoaResult.hoa} teamNames={teamNames} />
              <PlaceCard place="Runner Up" entry={hoaResult.ru} teamNames={teamNames} />
              <PlaceCard place="3rd Place" entry={hoaResult.third} teamNames={teamNames} />
              <PlaceCard place="HOA Lady" entry={hoaResult.hoaLady} teamNames={teamNames} />
            </div>
          </Section>

          {config.collegiateHOAEnabled && (collegiateResult.first || collegiateResult.second || collegiateResult.third) && (
            <Section title="Collegiate HOA">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <PlaceCard place="1st" entry={collegiateResult.first} teamNames={teamNames} />
                <PlaceCard place="2nd" entry={collegiateResult.second} teamNames={teamNames} />
                <PlaceCard place="3rd" entry={collegiateResult.third} teamNames={teamNames} />
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Discipline Tabs */}
      {disciplinesWithScores.map(d => {
        if (activeTab !== d.disciplineId) return null
        const disciplineEntries = entriesByDiscipline[d.disciplineId] || []
        const eventResult = calculateEventAwards(disciplineEntries, d.disciplineId, config)
        const teamResult = calculateTeamAwards(disciplineEntries, d.disciplineId, teamNames, config)
        const hasTeamAwards = Object.values(teamResult.divisionTeams).some(t => t.length > 0) || teamResult.openTeams.length > 0

        // Build flat list of division sections for pagination
        const divisionSections = divisionList.flatMap(div => {
          const placements = eventResult.divisionPlacements[div]
          if (!placements || placements.length === 0) return []
          return [{ div, placements }]
        })
        const totalDivPages = Math.ceil(divisionSections.length / DIVISION_PLACES_PER_PAGE)
        const pagedDivSections = divisionSections.slice(
          divisionPage * DIVISION_PLACES_PER_PAGE,
          (divisionPage + 1) * DIVISION_PLACES_PER_PAGE
        )

        // Flatten team sections for pagination
        const teamSections = [
          ...divisionList.flatMap(div => {
            const teams = teamResult.divisionTeams[div]
            if (!teams || teams.length === 0) return []
            return [{ label: `${div} Teams`, teams }]
          }),
          ...(teamResult.openTeams.length > 0 ? [{ label: 'Open Teams', teams: teamResult.openTeams }] : [])
        ]
        const totalTeamPages = Math.ceil(teamSections.length / DIVISION_PLACES_PER_PAGE)
        const pagedTeamSections = teamSections.slice(
          teamPage * DIVISION_PLACES_PER_PAGE,
          (teamPage + 1) * DIVISION_PLACES_PER_PAGE
        )

        return (
          <div key={d.disciplineId} className="space-y-4">
            {/* Event Champions */}
            {(eventResult.championMen || eventResult.championLady) && (
              <Section title="Event Champions">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PlaceCard place="Men's Champion" entry={eventResult.championMen} teamNames={teamNames} />
                  <PlaceCard place="Lady's Champion" entry={eventResult.championLady} teamNames={teamNames} />
                </div>
              </Section>
            )}

            {/* Division Placements */}
            {divisionSections.length > 0 && (
              <Section title="Division Awards">
                {pagedDivSections.map(({ div, placements }) => (
                  <div key={div} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                      {div}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {placements.map((entry, i) => (
                        <PlaceCard key={entry.athleteId} place={placeLabels[i] || `${i + 1}th`} entry={entry} teamNames={teamNames} />
                      ))}
                    </div>
                  </div>
                ))}
                {totalDivPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setDivisionPage(p => Math.max(0, p - 1))}
                      disabled={divisionPage === 0}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-gray-700"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalDivPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setDivisionPage(i)}
                        className={`px-3 py-1 text-sm rounded border transition font-medium ${
                          divisionPage === i
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setDivisionPage(p => Math.min(totalDivPages - 1, p + 1))}
                      disabled={divisionPage === totalDivPages - 1}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-gray-700"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </Section>
            )}

            {/* Team Awards */}
            {hasTeamAwards && (
              <Section title="Team Awards">
                {pagedTeamSections.map(({ label, teams }) => (
                  <div key={label} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
                      {label}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teams.map((team, i) => (
                        <TeamCard key={`${team.teamId}-${i}`} rank={placeLabels[i] || `${i + 1}th`} team={team} />
                      ))}
                    </div>
                  </div>
                ))}
                {totalTeamPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setTeamPage(p => Math.max(0, p - 1))}
                      disabled={teamPage === 0}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-gray-700"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: totalTeamPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setTeamPage(i)}
                        className={`px-3 py-1 text-sm rounded border transition font-medium ${
                          teamPage === i
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setTeamPage(p => Math.min(totalTeamPages - 1, p + 1))}
                      disabled={teamPage === totalTeamPages - 1}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-gray-700"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </Section>
            )}
          </div>
        )
      })}
    </div>
  )
}
