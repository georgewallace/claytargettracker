'use client'

import { useState, useMemo } from 'react'
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

// Flat squad item carrying its time slot context
interface FlatSquad {
  squad: Squad
  timeSlot: TimeSlot
}

function parseDateSafe(dateStr: Date | string) {
  const d = new Date(dateStr).toISOString().split('T')[0]
  return new Date(`${d}T12:00:00.000Z`)
}

const PAGE_SIZE = 10

export default function ScoreEntryClient({ tournament }: ScoreEntryClientProps) {
  // ── Derive ordered disciplines that have at least one time slot ──────
  const disciplinesWithSlots = useMemo(() => {
    const disciplineIds = new Set(tournament.timeSlots.map(ts => ts.disciplineId))
    return tournament.disciplines.filter(td => disciplineIds.has(td.disciplineId))
  }, [tournament])

  const [activeDisciplineId, setActiveDisciplineId] = useState<string>(
    disciplinesWithSlots[0]?.disciplineId ?? ''
  )

  // ── Filters ──────────────────────────────────────────────────────────
  const [squadFilter, setSquadFilter] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [athleteFilter, setAthleteFilter] = useState('')
  const [page, setPage] = useState(1)

  // Reset page when filters or tab changes
  const handleTabChange = (id: string) => {
    setActiveDisciplineId(id)
    setSquadFilter('')
    setTeamFilter('')
    setAthleteFilter('')
    setPage(1)
  }
  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value)
    setPage(1)
  }

  // ── Expanded squads ──────────────────────────────────────────────────
  const [expandedSquads, setExpandedSquads] = useState<Set<string>>(new Set())
  const toggleSquad = (squadId: string) => {
    setExpandedSquads(prev => {
      const next = new Set(prev)
      if (next.has(squadId)) next.delete(squadId)
      else next.add(squadId)
      return next
    })
  }

  // ── Build flat squad list for active discipline ──────────────────────
  const allSquads: FlatSquad[] = useMemo(() => {
    const slots = tournament.timeSlots.filter(ts => ts.disciplineId === activeDisciplineId)
    const flat: FlatSquad[] = []
    for (const ts of slots) {
      for (const squad of ts.squads) {
        flat.push({ squad, timeSlot: ts })
      }
    }
    return flat
  }, [tournament.timeSlots, activeDisciplineId])

  // ── Apply filters ────────────────────────────────────────────────────
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

  // ── Pagination ───────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredSquads.length / PAGE_SIZE))
  const safeePage = Math.min(page, totalPages)
  const pagedSquads = filteredSquads.slice((safeePage - 1) * PAGE_SIZE, safeePage * PAGE_SIZE)

  // ── Active discipline config ─────────────────────────────────────────
  const activeConfig = tournament.disciplines.find(td => td.disciplineId === activeDisciplineId)
  const activeDiscipline = disciplinesWithSlots.find(td => td.disciplineId === activeDisciplineId)?.discipline

  if (disciplinesWithSlots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No time slots found. Create time slots and squads before entering scores.
      </div>
    )
  }

  return (
    <div>
      {/* ── Discipline tabs ───────────────────────────────────────────── */}
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

      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by squad name..."
            value={squadFilter}
            onChange={handleFilterChange(setSquadFilter)}
            className="w-full text-sm border-0 outline-none placeholder-gray-400"
          />
        </div>
        <div className="w-px h-5 bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by team..."
            value={teamFilter}
            onChange={handleFilterChange(setTeamFilter)}
            className="w-full text-sm border-0 outline-none placeholder-gray-400"
          />
        </div>
        <div className="w-px h-5 bg-gray-200 hidden sm:block" />
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <input
            type="text"
            placeholder="Filter by athlete..."
            value={athleteFilter}
            onChange={handleFilterChange(setAthleteFilter)}
            className="w-full text-sm border-0 outline-none placeholder-gray-400"
          />
        </div>
        {(squadFilter || teamFilter || athleteFilter) && (
          <>
            <div className="w-px h-5 bg-gray-200 hidden sm:block" />
            <button
              onClick={() => { setSquadFilter(''); setTeamFilter(''); setAthleteFilter(''); setPage(1) }}
              className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
            >
              Clear filters
            </button>
          </>
        )}
        <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
          {filteredSquads.length} squad{filteredSquads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Squad list ───────────────────────────────────────────────── */}
      {filteredSquads.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
          No squads match your filters.
        </div>
      ) : (
        <div className="space-y-2">
          {pagedSquads.map(({ squad, timeSlot }) => (
            <div key={squad.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Squad header row */}
              <button
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition text-left"
                onClick={() => toggleSquad(squad.id)}
              >
                {/* Expand chevron */}
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

                {/* Member count badge */}
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 whitespace-nowrap">
                  {squad.members.length} athlete{squad.members.length !== 1 ? 's' : ''}
                </span>

                {/* Saved indicator placeholder — SquadScoreCard manages its own saved state */}
              </button>

              {/* Expanded score card */}
              {expandedSquads.has(squad.id) && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <SquadScoreCard
                    tournamentId={tournament.id}
                    squad={squad}
                    discipline={activeDiscipline}
                    config={activeConfig}
                    timeSlotDate={timeSlot.date}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safeePage === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {safeePage} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safeePage === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
