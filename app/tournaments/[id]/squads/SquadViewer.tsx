'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { getDivisionColor } from '@/lib/squadUtils'

const getDivisionAcronym = (division: string): string => {
  const acronyms: Record<string, string> = {
    'Varsity': 'Var',
    'Junior Varsity': 'JV',
    'Novice': 'Nov',
    'Intermediate': 'Int',
    'Collegiate': 'Col',
    'Open': 'Open',
    'Unassigned': 'Unass',
    'Senior': 'Var',
    'College-Trade School': 'Col',
  }
  return acronyms[division] || division
}

interface Tournament {
  id: string
  name: string
  startDate: Date
  endDate: Date
  timeSlots: any[]
  registrations: any[]
}

interface SquadViewerProps {
  tournament: Tournament
}

export default function SquadViewer({ tournament }: SquadViewerProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null)

  // Get unique disciplines from tournament time slots
  const tournamentDisciplines = Array.from(
    new Set(tournament.timeSlots.map((slot: any) => slot.disciplineId))
  ).map(disciplineId => {
    const slot = tournament.timeSlots.find((s: any) => s.disciplineId === disciplineId)
    return slot?.discipline
  }).filter(Boolean)

  // Set initial active discipline from URL params or default to first
  useEffect(() => {
    if (tournamentDisciplines.length > 0) {
      const disciplineParam = searchParams.get('discipline')
      if (disciplineParam && tournamentDisciplines.some((d: any) => d.id === disciplineParam)) {
        setActiveDiscipline(disciplineParam)
      } else if (!activeDiscipline) {
        setActiveDiscipline(tournamentDisciplines[0].id)
      }
    }
  }, [tournamentDisciplines.length, searchParams])

  const updateDisciplineParam = (disciplineId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('discipline', disciplineId)
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`)
    setActiveDiscipline(disciplineId)
  }

  // Filter time slots by active discipline, within tournament date range,
  // and only include those with at least one member (athlete view hides empty slots)
  const filteredTimeSlots = activeDiscipline
    ? tournament.timeSlots.filter((slot: any) => {
        if (slot.disciplineId !== activeDiscipline) return false

        const slotDateStr = new Date(slot.date).toISOString().split('T')[0]
        const tournamentStartStr = new Date(tournament.startDate).toISOString().split('T')[0]
        const tournamentEndStr = new Date(tournament.endDate).toISOString().split('T')[0]

        if (slotDateStr < tournamentStartStr || slotDateStr > tournamentEndStr) return false

        // Hide time slots where no squad has any members
        return slot.squads.some((squad: any) => squad.members.length > 0)
      })
    : []

  // Sort time slots by date then time
  const sortedTimeSlots = [...filteredTimeSlots].sort((a, b) => {
    const dateCompare = new Date(a.date).toISOString().localeCompare(new Date(b.date).toISOString())
    if (dateCompare !== 0) return dateCompare
    return a.startTime.localeCompare(b.startTime)
  })

  // Group by date
  const timeSlotsByDate = sortedTimeSlots.reduce((acc: Record<string, any[]>, slot: any) => {
    const dateKey = new Date(slot.date).toISOString().split('T')[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(slot)
    return acc
  }, {})

  const activeDisciplineObj = tournamentDisciplines.find((d: any) => d.id === activeDiscipline)

  const hasAnySquads = sortedTimeSlots.length > 0

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-sm text-gray-600 mt-0.5">Squad Assignments</p>
          </div>
          <Link
            href={`/tournaments/${tournament.id}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Back to Tournament
          </Link>
        </div>

        {/* Discipline Tabs */}
        {tournamentDisciplines.length > 0 && (
          <div className="bg-white rounded-lg shadow-md mb-3">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-4" aria-label="Disciplines">
                {tournamentDisciplines.map((discipline: any) => {
                  const isActive = activeDiscipline === discipline.id
                  const disciplineSlots = tournament.timeSlots.filter(
                    (s: any) => s.disciplineId === discipline.id &&
                    s.squads.some((sq: any) => sq.members.length > 0)
                  )
                  const totalMembers = disciplineSlots.reduce(
                    (sum: number, slot: any) =>
                      sum + slot.squads.reduce((s2: number, sq: any) => s2 + sq.members.length, 0),
                    0
                  )

                  return (
                    <button
                      key={discipline.id}
                      onClick={() => updateDisciplineParam(discipline.id)}
                      className={`${
                        isActive
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition`}
                    >
                      {discipline.displayName}
                      <span className={`ml-2 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'} py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                        {totalMembers}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {!hasAnySquads ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No squads assigned yet</h3>
          <p className="text-gray-500">
            {activeDisciplineObj
              ? `Squad assignments for ${activeDisciplineObj.displayName} haven't been made yet. Check back later.`
              : 'Squad assignments haven\'t been made yet. Check back later.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(timeSlotsByDate).map(([dateKey, slots]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                {format(new Date(`${dateKey}T12:00:00.000Z`), 'EEEE, MMMM d, yyyy')}
              </h2>

              <div className="space-y-4">
                {(slots as any[]).map((slot: any) => {
                  const location = slot.fieldNumber || slot.stationNumber
                  const squadsWithMembers = slot.squads.filter((sq: any) => sq.members.length > 0)

                  return (
                    <div key={slot.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {/* Time Slot Header */}
                      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">
                            {slot.startTime} – {slot.endTime}
                          </span>
                          {location && (
                            <span className="text-sm text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                              {location}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 ml-auto">
                            {squadsWithMembers.length} squad{squadsWithMembers.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Squad Cards */}
                      <div className="p-2 grid grid-cols-1 gap-2">
                        {squadsWithMembers.map((squad: any) => {
                          const squadCapacity = slot.squadCapacity || squad.capacity || 5
                          const isFull = squad.members.length >= squadCapacity
                          const sortedMembers = [...squad.members].sort(
                            (a: any, b: any) => (a.position || 0) - (b.position || 0)
                          )

                          return (
                            <div key={squad.id} className="border border-gray-200 rounded-lg p-2 bg-white">
                              {/* Squad Header */}
                              <div className="mb-2 pb-2 border-b border-gray-200 flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-gray-900">{squad.name}</h4>
                                <p className={`text-xs ${isFull ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                  {squad.members.length}/{squadCapacity}
                                  {isFull && ' ✓'}
                                </p>
                              </div>

                              {/* Members — horizontal layout matching SquadCard */}
                              <div className="flex items-start gap-2 flex-wrap min-h-[60px]">
                                {sortedMembers.map((member: any, idx: number) => {
                                  const athlete = member.athlete
                                  const position = idx + 1
                                  return (
                                    <div key={member.id} className="flex-shrink-0 w-[175px]">
                                      <div className="p-2 bg-white border border-gray-200 rounded-md">
                                        <div className="flex items-start gap-1">
                                          <div className="flex-1 min-w-0">
                                            {/* Name + Division */}
                                            <div className="flex items-center gap-1">
                                              <div className="font-medium text-xs text-gray-900 truncate">
                                                {athlete.user.name}
                                              </div>
                                              {athlete.division && (
                                                <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getDivisionColor(athlete.division)}`}>
                                                  {getDivisionAcronym(athlete.division)}
                                                </span>
                                              )}
                                            </div>
                                            {/* Position */}
                                            <div className="text-xs text-gray-600 mt-0.5">
                                              Pos #{position}
                                            </div>
                                            {/* Team */}
                                            {athlete.team && (
                                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                                {athlete.team.name}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
