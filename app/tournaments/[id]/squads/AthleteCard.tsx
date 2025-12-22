'use client'

import { useDraggable } from '@dnd-kit/core'
import { getDivisionColor } from '@/lib/squadUtils'
import { format, parseISO } from 'date-fns'

interface athleteCardProps {
  athlete: any
  isDragging?: boolean
  onRemove?: () => void
  currentDisciplineId?: string
  currentTimeSlotId?: string
  position?: number
}

// Convert division names to acronyms
const getDivisionAcronym = (division: string): string => {
  const acronyms: Record<string, string> = {
    'Varsity': 'Var',
    'Junior Varsity': 'JV',
    'Novice': 'Nov',
    'Intermediate': 'Int',
    'Collegiate': 'Col',
    'Open': 'Open',
    'Unassigned': 'Unass',
    // Legacy support (should not appear after migration)
    'Senior': 'Var',
    'College-Trade School': 'Col',
  }
  return acronyms[division] || division
}

export default function athleteCard({ athlete, isDragging: isDraggingProp, onRemove, currentDisciplineId, currentTimeSlotId, position }: athleteCardProps) {
  // Only make the card draggable if it has the onRemove prop (i.e., it's in a squad)
  const { attributes, listeners, setNodeRef, isDragging: isDraggingFromHook } = useDraggable({
    id: athlete.id,
    disabled: !onRemove, // Disable dragging if athlete is in unassigned list (no onRemove prop)
  })

  const isDragging = isDraggingProp || isDraggingFromHook
  // Find time slot preferences for current discipline
  // Note: athlete.disciplines comes from registration mapping in SquadManager
  const disciplinePreferences = athlete.disciplines?.find(
    (rd: any) => rd.disciplineId === currentDisciplineId
  )?.timeSlotPreferences || []

  // Group preferences by time (date + startTime + endTime) to get the correct preference rank
  const groupedPreferences = disciplinePreferences.reduce((acc: any[], pref: any) => {
    const key = `${pref.timeSlot.date}_${pref.timeSlot.startTime}_${pref.timeSlot.endTime}`
    const existing = acc.find(p =>
      `${p.timeSlot.date}_${p.timeSlot.startTime}_${p.timeSlot.endTime}` === key
    )

    // Keep the one with the lowest preference value (in case of old data with ungrouped preferences)
    if (!existing) {
      acc.push(pref)
    } else if (pref.preference < existing.preference) {
      // Replace with lower preference
      const index = acc.indexOf(existing)
      acc[index] = pref
    }

    return acc
  }, [])

  // Check if this athlete prefers the current time slot
  // Find the matching time slot to get its date+time, then find the lowest preference for that time
  let preferenceForCurrentSlot = null
  if (currentTimeSlotId) {
    const currentSlotPref = disciplinePreferences.find(
      (pref: any) => pref.timeSlotId === currentTimeSlotId
    )

    if (currentSlotPref) {
      // Find all preferences that match this date+time and get the lowest preference value
      const timeKey = `${currentSlotPref.timeSlot.date}_${currentSlotPref.timeSlot.startTime}_${currentSlotPref.timeSlot.endTime}`
      const matchingPrefs = disciplinePreferences.filter((pref: any) =>
        `${pref.timeSlot.date}_${pref.timeSlot.startTime}_${pref.timeSlot.endTime}` === timeKey
      )

      // Use the lowest preference value for this time
      const lowestPref = Math.min(...matchingPrefs.map((p: any) => p.preference))
      preferenceForCurrentSlot = { ...currentSlotPref, preference: lowestPref }
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-2 bg-white border rounded-md transition cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'border-indigo-500 shadow-lg'
          : preferenceForCurrentSlot
          ? 'border-blue-300 bg-blue-50 hover:border-blue-400'
          : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <div className="font-medium text-xs text-gray-900 truncate">
              {athlete.user.name}
            </div>
            {position !== undefined && (
              <span className="inline-block px-1 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 flex-shrink-0">
                Pos #{position}
              </span>
            )}
            {athlete.division && (
              <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium ${getDivisionColor(athlete.division)} flex-shrink-0`}>
                {getDivisionAcronym(athlete.division)}
              </span>
            )}
          </div>

          {athlete.team && (
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {athlete.team.name}
            </div>
          )}

          {/* Show all time slot preferences for this discipline */}
          {groupedPreferences.length > 0 && !onRemove && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-900 mb-1">Time Preferences:</div>
              <div className="space-y-1">
                {groupedPreferences.map((pref: any) => (
                  <div key={pref.id} className="text-xs bg-blue-100 border border-blue-300 rounded px-2 py-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="truncate text-gray-900 font-medium">
                        {pref.timeSlot.startTime} - {pref.timeSlot.endTime}
                      </div>
                      <span className="text-xs font-bold text-blue-900 flex-shrink-0">
                        {pref.preference === 1 && '1st'}
                        {pref.preference === 2 && '2nd'}
                        {pref.preference === 3 && '3rd'}
                        {pref.preference > 3 && `${pref.preference}th`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
            title="Remove from squad"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

