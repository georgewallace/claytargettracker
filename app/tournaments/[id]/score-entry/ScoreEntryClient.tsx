'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import SquadScoreCard from './SquadScoreCard'
import { format } from 'date-fns'

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

interface Tournament {
  id: string
  name: string
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
  // Active discipline tab
  const disciplinesWithSlots = useMemo(() => {
    const ids = new Set(tournament.timeSlots.map(ts => ts.disciplineId))
    return tournament.disciplines.filter(td => ids.has(td.disciplineId))
  }, [tournament])

  const [activeDisciplineId, setActiveDisciplineId] = useState<string>(
    disciplinesWithSlots[0]?.disciplineId ?? ''
  )

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

  return (
    <div>
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
          {pagedSquads.map(({ squad, timeSlot }) => (
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
                  />
                </div>
              )}
            </div>
          ))}
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
