'use client'

import { useState } from 'react'
import SquadScoreCard from './SquadScoreCard'
import { format } from 'date-fns'

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

interface Tournament {
  id: string
  name: string
  disciplines: TournamentDiscipline[]
  timeSlots: TimeSlot[]
}

interface ScoreEntryClientProps {
  tournament: Tournament
}

function parseDateSafe(dateStr: Date | string) {
  const d = new Date(dateStr).toISOString().split('T')[0]
  return new Date(`${d}T12:00:00.000Z`)
}

export default function ScoreEntryClient({ tournament }: ScoreEntryClientProps) {
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set())

  const toggleSquad = (squadId: string) => {
    setExpandedSquads(prev => {
      const next = new Set(prev)
      if (next.has(squadId)) next.delete(squadId)
      else next.add(squadId)
      return next
    })
  }

  // Group time slots by discipline
  const disciplineGroups: Record<string, TimeSlot[]> = {}
  for (const ts of tournament.timeSlots) {
    if (!disciplineGroups[ts.disciplineId]) disciplineGroups[ts.disciplineId] = []
    disciplineGroups[ts.disciplineId].push(ts)
  }

  // Build discipline config map
  const disciplineConfig: Record<string, TournamentDiscipline> = {}
  for (const td of tournament.disciplines) {
    disciplineConfig[td.disciplineId] = td
  }

  if (Object.keys(disciplineGroups).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No time slots found. Create time slots and squads before entering scores.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(disciplineGroups).map(([disciplineId, timeSlots]) => {
        const discipline = timeSlots[0]?.discipline
        const config = disciplineConfig[disciplineId]

        return (
          <div key={disciplineId}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
              {discipline?.displayName || 'Unknown Discipline'}
            </h2>
            <div className="space-y-4">
              {timeSlots.map(ts => (
                <div key={ts.id} className="bg-white rounded-lg shadow">
                  <div className="px-4 py-3 bg-gray-50 border-b rounded-t-lg">
                    <span className="font-medium text-gray-700">
                      {format(parseDateSafe(ts.date), 'EEE, MMM d')} • {ts.startTime}–{ts.endTime}
                      {ts.fieldNumber && ` • ${ts.fieldNumber}`}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">({ts.squads.length} squad{ts.squads.length !== 1 ? 's' : ''})</span>
                  </div>
                  {ts.squads.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">No squads in this time slot.</div>
                  ) : (
                    <div className="divide-y">
                      {ts.squads.map(squad => (
                        <div key={squad.id}>
                          <button
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition text-left"
                            onClick={() => toggleSquad(squad.id)}
                          >
                            <span className="font-medium text-gray-800">
                              Squad {squad.name}
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({squad.members.length} athlete{squad.members.length !== 1 ? 's' : ''})
                              </span>
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSquads.has(squad.id) ? 'rotate-180' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {expandedSquads.has(squad.id) && (
                            <div className="px-4 pb-4">
                              <SquadScoreCard
                                tournamentId={tournament.id}
                                squad={squad}
                                discipline={discipline}
                                config={config}
                                timeSlotDate={ts.date}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
