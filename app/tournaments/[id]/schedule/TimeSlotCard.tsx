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
  userRole?: string
}

export default function TimeSlotCard({ timeSlot, onUpdate, userRole }: TimeSlotCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDeleteClick = () => {
    if (timeSlot.squads.length > 0) {
      setError('Cannot delete time slot with existing squads')
      setTimeout(() => setError(''), 3000)
      return
    }

    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
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

      setShowDeleteModal(false)
      onUpdate()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setTimeout(() => setError(''), 3000)
      setShowDeleteModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
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
              <span className="font-medium">Capacity:</span> {timeSlot.squadCapacity} athletes per squad
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

        {/* Only show delete button for admins */}
        {userRole === 'admin' && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleDeleteClick}
              disabled={loading}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Delete Time Slot
                </h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete this time slot?
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 mb-1">
                      {formatTimeRange(timeSlot.startTime, timeSlot.endTime)}
                    </div>
                    <div className="text-gray-600">
                      {timeSlot.discipline.displayName}
                    </div>
                    {timeSlot.fieldNumber && (
                      <div className="text-gray-600 mt-1">
                        {timeSlot.fieldNumber}
                      </div>
                    )}
                    {timeSlot.stationNumber && (
                      <div className="text-gray-600 mt-1">
                        {timeSlot.stationNumber}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Deleting...' : 'Delete Time Slot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

