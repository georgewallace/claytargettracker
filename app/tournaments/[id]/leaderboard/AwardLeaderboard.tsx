'use client'

import { useState, useMemo } from 'react'
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
    disciplines: Array<{
      disciplineId: string
      discipline: { id: string; name: string; displayName: string }
    }>
    shoots: Array<{
      id: string
      athleteId: string
      disciplineId: string
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
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">{place}</div>
      <div className="font-semibold text-gray-900 text-sm leading-tight truncate">{entry.athlete.name}</div>
      {teamName && <div className="text-xs text-gray-500 leading-tight truncate">{teamName}</div>}
      <div className="text-sm font-bold text-gray-800 mt-0.5">{entry.totalScore} <span className="text-xs font-normal text-gray-400">pts</span></div>
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
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
      <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">{rank}</div>
      <div className="font-semibold text-gray-900 text-sm leading-tight">{team.teamName}</div>
      <div className="text-sm font-bold text-gray-800 mt-0.5">{team.totalScore} <span className="text-xs font-normal text-gray-400">pts</span></div>
      <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
        {team.athletes.map(a => a.athlete.name).join(', ')}
      </div>
    </div>
  )
}

// Section wrapper — white card with consistent styling
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AwardLeaderboard({ tournament }: AwardLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<string>('hoa')

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
    { id: 'hoa', label: 'HOA' },
    ...disciplinesWithScores.map(d => ({ id: d.disciplineId, label: d.discipline.displayName })),
  ]

  const divisionList = ['Varsity', 'JV', 'Intermediate', 'Novice', 'Collegiate']
  const placeLabels = ['1st', '2nd', '3rd', '4th', '5th']

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white/10 text-gray-100 border border-white/20 hover:bg-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* HOA Tab */}
      {activeTab === 'hoa' && (
        <div className="space-y-4">
          <Section title="High Over All">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <PlaceCard place="HOA" entry={hoaResult.hoa} teamNames={teamNames} />
              <PlaceCard place="Runner Up" entry={hoaResult.ru} teamNames={teamNames} />
              <PlaceCard place="3rd Place" entry={hoaResult.third} teamNames={teamNames} />
              <PlaceCard place="HOA Lady" entry={hoaResult.hoaLady} teamNames={teamNames} />
            </div>
          </Section>

          {config.collegiateHOAEnabled && (collegiateResult.first || collegiateResult.second || collegiateResult.third) && (
            <Section title="Collegiate HOA">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

        return (
          <div key={d.disciplineId} className="space-y-4">
            {/* Event Champions */}
            {(eventResult.championMen || eventResult.championLady) && (
              <Section title="Event Champions">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <PlaceCard place="Men's Champion" entry={eventResult.championMen} teamNames={teamNames} />
                  <PlaceCard place="Lady's Champion" entry={eventResult.championLady} teamNames={teamNames} />
                </div>
              </Section>
            )}

            {/* Division Placements */}
            <Section title="Division Awards">
              {divisionList.map(div => {
                const placements = eventResult.divisionPlacements[div]
                if (!placements || placements.length === 0) return null
                return (
                  <div key={div} className="mb-3 last:mb-0">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{div}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {placements.map((entry, i) => (
                        <PlaceCard key={entry.athleteId} place={placeLabels[i] || `${i + 1}th`} entry={entry} teamNames={teamNames} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </Section>

            {/* Team Awards */}
            {hasTeamAwards && (
              <Section title="Team Awards">
                {divisionList.map(div => {
                  const teams = teamResult.divisionTeams[div]
                  if (!teams || teams.length === 0) return null
                  return (
                    <div key={div} className="mb-3 last:mb-0">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{div} Teams</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teams.map((team, i) => (
                          <TeamCard key={`${team.teamId}-${i}`} rank={placeLabels[i] || `${i + 1}th`} team={team} />
                        ))}
                      </div>
                    </div>
                  )
                })}
                {teamResult.openTeams.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Open Teams</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teamResult.openTeams.map((team, i) => (
                        <TeamCard key={`open-${team.teamId}-${i}`} rank={['1st', '2nd', '3rd'][i] || `${i + 1}th`} team={team} />
                      ))}
                    </div>
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
