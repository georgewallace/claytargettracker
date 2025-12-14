'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import TeamLogo from '@/components/TeamLogo'
import RemoveRegistrationButton from './RemoveRegistrationButton'

interface RegistrationListProps {
  registrations: any[]
  isAdmin: boolean
  userRole: string
  allathletes: any[]
}

const ITEMS_PER_PAGE = 12

export default function RegistrationList({
  registrations,
  isAdmin,
  userRole,
  allathletes
}: RegistrationListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate pagination
  const totalPages = Math.ceil(registrations.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentRegistrations = registrations.slice(startIndex, endIndex)

  const parseDateSafe = (date: Date) => {
    const dateStr = new Date(date).toISOString().split('T')[0]
    return new Date(`${dateStr}T12:00:00.000Z`)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToPrevious = () => {
    if (currentPage > 1) goToPage(currentPage - 1)
  }

  const goToNext = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1)
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show current page and neighbors
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <>
      {/* Pagination Info */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {startIndex + 1}-{Math.min(endIndex, registrations.length)} of {registrations.length} athletes
      </div>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {currentRegistrations.map((registration) => (
          <div
            key={registration.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {registration.athlete.team && (
                  <TeamLogo
                    logoUrl={registration.athlete.team.logoUrl}
                    teamName={registration.athlete.team.name}
                    size="sm"
                  />
                )}
                <div className="font-semibold text-gray-900">
                  {registration.athlete.user.name}
                </div>
              </div>
              {/* Remove button for admins or coaches (for their own team) */}
              {(isAdmin || (userRole === 'coach' && registration.athlete.teamId && allathletes.some(a => a.id === registration.athleteId))) && (
                <RemoveRegistrationButton
                  registrationId={registration.id}
                  athleteName={registration.athlete.user.name}
                  isCompact={true}
                />
              )}
            </div>

            <div className="space-y-1">
              {registration.athlete.team && (
                <div className="text-sm text-gray-600">
                  Team: {registration.athlete.team.name}
                </div>
              )}
              {(registration.athlete.grade || registration.athlete.division) && (
                <div className="text-sm text-gray-600">
                  {registration.athlete.grade && <span>Grade: {registration.athlete.grade}</span>}
                  {registration.athlete.grade && registration.athlete.division && <span> • </span>}
                  {registration.athlete.division && (
                    <span className="font-medium text-indigo-600">{registration.athlete.division}</span>
                  )}
                </div>
              )}
            </div>

            {/* Disciplines */}
            {registration.disciplines.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Disciplines:</div>
                <div className="flex flex-wrap gap-1">
                  {registration.disciplines.map((rd: any) => (
                    <span
                      key={rd.id}
                      className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                    >
                      {rd.discipline.displayName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Time Slot Preferences */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1.5">Time Preferences:</div>
              {registration.disciplines.some((d: any) => d.timeSlotPreferences && d.timeSlotPreferences.length > 0) ? (
                <>
                  {registration.disciplines.map((rd: any) => {
                    if (!rd.timeSlotPreferences || rd.timeSlotPreferences.length === 0) return null

                    // Group preferences by time and get the lowest preference value for each time
                    const groupedPrefs = rd.timeSlotPreferences.reduce((acc: any[], pref: any) => {
                      const key = `${pref.timeSlot.date}_${pref.timeSlot.startTime}_${pref.timeSlot.endTime}`
                      const existing = acc.find(p =>
                        `${p.timeSlot.date}_${p.timeSlot.startTime}_${p.timeSlot.endTime}` === key
                      )
                      if (!existing) {
                        acc.push(pref)
                      } else if (pref.preference < existing.preference) {
                        const index = acc.indexOf(existing)
                        acc[index] = pref
                      }
                      return acc
                    }, [])

                    // Sort by preference value and re-number them sequentially
                    const sortedPrefs = groupedPrefs
                      .sort((a, b) => a.preference - b.preference)
                      .map((pref, index) => ({ ...pref, displayPreference: index + 1 }))

                    return (
                      <div key={rd.id} className="mb-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">{rd.discipline.displayName}</div>
                        <div className="space-y-1">
                          {sortedPrefs.map((pref: any) => (
                            <div key={pref.id} className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-blue-900">
                                    {format(parseDateSafe(pref.timeSlot.date), 'EEE, MMM d')} • {pref.timeSlot.startTime} - {pref.timeSlot.endTime}
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-blue-700">
                                  {pref.displayPreference === 1 && '1st'}
                                  {pref.displayPreference === 2 && '2nd'}
                                  {pref.displayPreference === 3 && '3rd'}
                                  {pref.displayPreference > 3 && `${pref.displayPreference}th`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="text-xs text-gray-400 italic">None selected</div>
              )}
            </div>

            {/* Squad Assignments */}
            {(() => {
              const tournamentSquads = registration.athlete.squadMembers?.filter(
                (sm: any) => sm.squad.timeSlot.tournamentId === registration.tournamentId
              ) || []

              if (tournamentSquads.length > 0) {
                return (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-1.5">Assigned Squads:</div>
                    <div className="space-y-1.5">
                      {tournamentSquads.map((sm: any) => (
                        <div key={sm.id} className="text-xs bg-green-50 border border-green-200 rounded px-2 py-1.5">
                          <div className="font-medium text-green-900">
                            {sm.squad.timeSlot.discipline.displayName}
                          </div>
                          <div className="text-green-700 mt-0.5">
                            {format(parseDateSafe(sm.squad.timeSlot.date), 'EEE, MMM d')} • {sm.squad.timeSlot.startTime} - {sm.squad.timeSlot.endTime}
                          </div>
                          <div className="text-green-600">
                            {sm.squad.timeSlot.fieldNumber || sm.squad.timeSlot.stationNumber} • Squad {sm.squad.name}
                            {sm.position && ` • Pos ${sm.position}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              } else {
                return (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5">
                      ⚠ No squad assigned yet
                    </div>
                  </div>
                )
              }
            })()}

            <div className="text-xs text-gray-500 mt-2">
              Registered: {format(new Date(registration.createdAt), 'PP')}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page as number)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium transition ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </>
  )
}
