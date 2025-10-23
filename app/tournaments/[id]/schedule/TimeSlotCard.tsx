'use client'

import { useState } from 'react'
import { formatTimeRange } from '@/lib/timeSlotUtils'

interface Discipline {
  id: string
  name: string
  displayName: string
}

interface Squad {
  id: string
  name: string
  capacity: number
}

interface TimeSlot {
  id: string
  tournamentId: string
  disciplineId: string
  startTime: string
  endTime: string
  squadCapacity: number
  fieldNumber: string | null
  stationNumber: string | null
  notes: string | null
  discipline: Discipline
  squads: Squad[]
}

interface TimeSlotCardProps {
  timeSlot: TimeSlot
  onUpdate: () => void
}

export default function TimeSlotCard({ timeSlot, onUpdate }: TimeSlotCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (timeSlot.squads.length > 0) {
      setError('Cannot delete time slot with existing squads')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (!confirm(`Are you sure you want to delete this time slot?\n${formatTimeRange(timeSlot.startTime, timeSlot.endTime)}`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/timeslots/${timeSlot.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete time slot')
      }

      onUpdate()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-lg font-semibold text-gray-900">
              {formatTimeRange(timeSlot.startTime, timeSlot.endTime)}
            </div>
            {timeSlot.fieldNumber && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {timeSlot.fieldNumber}
              </span>
            )}
            {timeSlot.stationNumber && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                {timeSlot.stationNumber}
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">Capacity:</span> {timeSlot.squadCapacity} shooters per squad
            </div>
            <div>
              <span className="font-medium">Squads:</span>{' '}
              {timeSlot.squads.length > 0 ? (
                <span className="text-indigo-600 font-medium">
                  {timeSlot.squads.length} squad{timeSlot.squads.length !== 1 ? 's' : ''} created
                </span>
              ) : (
                <span className="text-gray-500">No squads yet</span>
              )}
            </div>
            {timeSlot.notes && (
              <div>
                <span className="font-medium">Notes:</span> {timeSlot.notes}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

