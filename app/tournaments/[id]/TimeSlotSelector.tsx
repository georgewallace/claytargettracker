'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'

interface Squad {
  id: string
  name: string
  capacity: number
  currentMembers: number
  teamOnly: boolean
  teamName?: string
}

interface TimeSlot {
  timeSlotIds: string[]
  date: string
  startTime: string
  endTime: string
  availableCapacity: number
  noSquadsCreated?: boolean
}

interface TeamRegistrationStatus {
  hasTeam: boolean
  teamId: string | null
  teamName: string | null
  isTeamRegistered: boolean
}

interface TimeSlotSelectorProps {
  disciplineId: string
  disciplineName: string
  tournamentId: string
  athleteId: string
  selectedTimeSlots: string[]
  onSelectionChange: (timeSlotIds: string[]) => void
}

export default function TimeSlotSelector({
  disciplineId,
  disciplineName,
  tournamentId,
  athleteId,
  selectedTimeSlots,
  onSelectionChange
}: TimeSlotSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [teamStatus, setTeamStatus] = useState<TeamRegistrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTimeSlots() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/tournaments/${tournamentId}/available-time-slots?disciplineId=${disciplineId}&athleteId=${athleteId}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch time slots')
        }

        const data = await response.json()
        setTimeSlots(data.timeSlots)
        setTeamStatus(data.teamRegistrationStatus)
      } catch (err) {
        console.error('Error fetching time slots:', err)
        setError('Failed to load available time slots')
      } finally {
        setLoading(false)
      }
    }

    fetchTimeSlots()
  }, [disciplineId, tournamentId, athleteId])

  const handleTimeSlotToggle = (timeSlotIds: string[]) => {
    // Check if any of these IDs are already selected
    const isSelected = timeSlotIds.some(id => selectedTimeSlots.includes(id))

    if (isSelected) {
      // Remove all IDs from this time slot
      onSelectionChange(selectedTimeSlots.filter(id => !timeSlotIds.includes(id)))
    } else {
      // Add all IDs from this time slot
      onSelectionChange([...selectedTimeSlots, ...timeSlotIds])
    }
  }

  const getPreferenceRank = (timeSlotIds: string[]): number | null => {
    // Find the first ID that's in the selection and use its index
    for (const id of timeSlotIds) {
      const index = selectedTimeSlots.indexOf(id)
      if (index >= 0) {
        return index + 1
      }
    }
    return null
  }

  const getCapacityColor = (capacity: number): string => {
    if (capacity > 3) return 'bg-green-100 text-green-800'
    if (capacity > 0) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{disciplineName}</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading time slots...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{disciplineName}</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{disciplineName}</h3>
        <p className="text-sm text-gray-600">Select your preferred time slots (optional)</p>
      </div>

      {/* Team Registration Warning */}
      {teamStatus?.hasTeam && !teamStatus.isTeamRegistered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Team Registration Notice</h4>
              <p className="mt-1 text-sm text-yellow-700">
                Your team &quot;{teamStatus.teamName}&quot; has not yet registered for this tournament.
                You can still register as an individual, but your team may register later. Check with your coach.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Time Slots */}
      {timeSlots.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            No available time slots found for {disciplineName}.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            All time slots are currently full or restricted to teams. You can still register
            and your coach will assign you to a squad later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {timeSlots.map((slot, index) => {
            const preferenceRank = getPreferenceRank(slot.timeSlotIds)
            const isSelected = preferenceRank !== null

            return (
              <div
                key={`${slot.date}_${slot.startTime}`}
                onClick={() => handleTimeSlotToggle(slot.timeSlotIds)}
                className={`
                  border rounded-lg p-4 cursor-pointer transition
                  ${isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300 bg-white'
                  }
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTimeSlotToggle(slot.timeSlotIds)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="font-semibold text-gray-900">
                        {format(parseISO(slot.date), 'EEEE, MMM d')} • {slot.startTime} - {slot.endTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`text-xs px-2 py-1 rounded ${getCapacityColor(slot.availableCapacity)}`}>
                      {slot.availableCapacity} spot{slot.availableCapacity !== 1 ? 's' : ''} available
                    </span>
                    {slot.noSquadsCreated && (
                      <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                        Squads TBD
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-2 text-sm font-medium text-indigo-600 ml-6">
                    {preferenceRank === 1 && '1st Choice'}
                    {preferenceRank === 2 && '2nd Choice'}
                    {preferenceRank === 3 && '3rd Choice'}
                    {preferenceRank && preferenceRank > 3 && `${preferenceRank}th Choice`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Time slot selections are preferences only and are not guaranteed.
              Coaches may adjust squad assignments based on team needs and availability.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
