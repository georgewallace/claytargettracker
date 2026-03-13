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

function PlaceCard({ place, entry, label }: { place: string; entry: AthleteScoreEntry | null; label?: string }) {
  if (!entry) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">{place}</div>
      <div className="font-semibold text-gray-900">{entry.athlete.name}</div>
      {entry.athlete.teamId && (
        <div className="text-sm text-gray-500">{entry.athlete.teamId}</div>
      )}
      <div className="text-sm font-medium text-gray-700 mt-1">{entry.totalScore} pts</div>
      {label && <div className="text-xs text-gray-400 mt-0.5">{label}</div>}
    </div>
  )
}

function TeamCard({ rank, team }: { rank: string; team: { teamId: string; teamName: string; athletes: AthleteScoreEntry[]; totalScore: number } | null }) {
  if (!team) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">{rank}</div>
      <div className="font-semibold text-gray-900">{team.teamName}</div>
      <div className="text-sm text-gray-700 mt-1">{team.totalScore} pts</div>
      <div className="text-xs text-gray-500 mt-1">
        {team.athletes.map(a => a.athlete.name).join(', ')}
      </div>
    </div>
  )
}

export default function AwardLeaderboard({ tournament }: AwardLeaderboardProps) {
  const disciplines = tournament.disciplines
  const [activeTab, setActiveTab] = useState<string>('hoa')

  const config: AwardConfig = useMemo(() => ({
    hoaScope: tournament.hoaScope,
    hoaIncludesDivisions: (() => {
      try { return JSON.parse(tournament.hoaIncludesDivisions) } catch { return ['Novice','Intermediate','JV','Varsity'] }
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
        }
      }
      if (!map[shoot.disciplineId]) map[shoot.disciplineId] = []
      map[shoot.disciplineId].push(entry)
    }
    return map
  }, [tournament.shoots])

  // Team names map
  const teamNames = useMemo(() => {
    const m: Record<string, string> = {}
    for (const shoot of tournament.shoots) {
      if (shoot.athlete.team) m[shoot.athlete.team.id] = shoot.athlete.team.name
    }
    return m
  }, [tournament.shoots])

  const hoaResult = useMemo(() => calculateHOAAwards(entriesByDiscipline, config), [entriesByDiscipline, config])
  const collegiateResult = useMemo(() => calculateCollegiateHOA(entriesByDiscipline, config), [entriesByDiscipline, config])

  const tabs = [
    { id: 'hoa', label: 'HOA' },
    ...disciplines.map(d => ({ id: d.disciplineId, label: d.discipline.displayName }))
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* HOA Tab */}
      {activeTab === 'hoa' && (
        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Overall Awards</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PlaceCard place="HOA" entry={hoaResult.hoa} />
              <PlaceCard place="Runner Up" entry={hoaResult.ru} />
              <PlaceCard place="3rd" entry={hoaResult.third} />
              <PlaceCard place="HOA Lady" entry={hoaResult.hoaLady} />
            </div>
          </section>

          {config.collegiateHOAEnabled && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Collegiate HOA</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <PlaceCard place="1st" entry={collegiateResult.first} />
                <PlaceCard place="2nd" entry={collegiateResult.second} />
                <PlaceCard place="3rd" entry={collegiateResult.third} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* Discipline Tabs */}
      {disciplines.map(d => {
        if (activeTab !== d.disciplineId) return null
        const disciplineEntries = entriesByDiscipline[d.disciplineId] || []
        const eventResult = calculateEventAwards(disciplineEntries, d.disciplineId, config)
        const teamResult = calculateTeamAwards(disciplineEntries, d.disciplineId, teamNames, config)
        const divisionList = ['Varsity', 'JV', 'Intermediate', 'Novice', 'Collegiate']

        return (
          <div key={d.disciplineId} className="space-y-6">
            {/* Event Champions */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Event Champions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PlaceCard place="Men's Champion" entry={eventResult.championMen} />
                <PlaceCard place="Lady's Champion" entry={eventResult.championLady} />
              </div>
            </section>

            {/* Division Placements */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Division Awards</h3>
              <div className="space-y-4">
                {divisionList.map(div => {
                  const placements = eventResult.divisionPlacements[div]
                  if (!placements || placements.length === 0) return null
                  const placeLabels = ['1st', '2nd', '3rd', '4th', '5th']
                  return (
                    <div key={div}>
                      <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{div}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {placements.map((entry, i) => (
                          <PlaceCard key={entry.athleteId} place={placeLabels[i] || `${i+1}th`} entry={entry} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Team Awards */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Team Awards</h3>
              <div className="space-y-4">
                {divisionList.map(div => {
                  const teams = teamResult.divisionTeams[div]
                  if (!teams || teams.length === 0) return null
                  const placeLabels = ['1st', '2nd', '3rd']
                  return (
                    <div key={div}>
                      <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{div} Teams</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teams.map((team, i) => (
                          <TeamCard key={`${team.teamId}-${i}`} rank={placeLabels[i] || `${i+1}th`} team={team} />
                        ))}
                      </div>
                    </div>
                  )
                })}
                {teamResult.openTeams.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Open Teams</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {teamResult.openTeams.map((team, i) => (
                        <TeamCard key={`open-${team.teamId}-${i}`} rank={['1st','2nd','3rd'][i] || `${i+1}th`} team={team} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )
      })}
    </div>
  )
}
