'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { formatTimeSlotLabel } from '@/lib/squadUtils'
import SquadCard from './SquadCard'

interface TimeSlotSectionProps {
  timeSlot: any
  tournamentId: string
  onUpdate: () => void
}

export default function TimeSlotSection({ timeSlot, tournamentId, onUpdate }: TimeSlotSectionProps) {
  const [deleting, setDeleting] = useState(false)
  
  // Make the time slot droppable (can have multiple squads)
  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${timeSlot.id}`,
    disabled: false // Allow multiple squads per time slot
  })

  const handleDeleteTimeSlot = async () => {
    if (!confirm('Delete this empty time slot?')) return

    setDeleting(true)

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
      alert(err.message || 'An error occurred')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Time Slot Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {formatTimeSlotLabel(timeSlot)}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {timeSlot.discipline.displayName} • Capacity: {timeSlot.squadCapacity} per squad
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {timeSlot.squads.length} squad{timeSlot.squads.length !== 1 ? 's' : ''}
          </div>
          {/* Delete button for empty time slots */}
          {timeSlot.squads.length === 0 && (
            <button
              onClick={handleDeleteTimeSlot}
              disabled={deleting}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete this empty time slot"
            >
              {deleting ? 'Deleting...' : 'Delete Slot'}
            </button>
          )}
        </div>
      </div>

      {/* Squads Grid */}
      {timeSlot.squads.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {timeSlot.squads.map((squad: any) => (
            <SquadCard 
              key={squad.id} 
              squad={squad} 
              tournamentId={tournamentId}
              disciplineId={timeSlot.disciplineId}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      ) : (
        <div
          ref={setNodeRef}
          className={`text-center py-8 rounded-lg border-2 border-dashed transition ${
            isOver
              ? 'bg-indigo-50 border-indigo-400'
              : 'bg-gray-50 border-gray-300'
          }`}
        >
          {isOver ? (
            <p className="text-indigo-600 font-medium text-sm">
              Drop here to create a new squad
            </p>
          ) : (
            <p className="text-gray-500 text-sm">
              No squads yet • Drop a shooter here to create a squad
            </p>
          )}
        </div>
      )}
    </div>
  )
}

