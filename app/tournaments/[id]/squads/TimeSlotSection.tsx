'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { formatTimeSlotLabel } from '@/lib/squadUtils'
import SquadCard from './SquadCard'

interface TimeSlotSectionProps {
  timeSlot: any
  tournamentId: string
  onUpdate: () => void
  userRole?: string
  coachedTeamId?: string | null
}

export default function TimeSlotSection({ timeSlot, tournamentId, onUpdate, userRole, coachedTeamId }: TimeSlotSectionProps) {
  const [deleting, setDeleting] = useState(false)

  // Coaches can't create additional squads if one already exists (admins can)
  const canCreateAdditionalSquad = userRole === 'admin' || timeSlot.squads.length === 0

  // Make the time slot droppable
  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${timeSlot.id}`,
    disabled: !canCreateAdditionalSquad // Disable for coaches when squads exist
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
    <div className="bg-white rounded-lg shadow-md p-2">
      {/* Time Slot Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {formatTimeSlotLabel(timeSlot)}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {timeSlot.discipline.displayName} • Cap: {timeSlot.squadCapacity}/squad • {timeSlot.squads.length} squad{timeSlot.squads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Delete button for empty time slots - admins only */}
          {timeSlot.squads.length === 0 && userRole === 'admin' && (
            <button
              onClick={handleDeleteTimeSlot}
              disabled={deleting}
              className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md border border-red-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete this empty time slot"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {/* Squads Grid */}
      {timeSlot.squads.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mb-2">
          {timeSlot.squads.map((squad: any) => (
            <SquadCard
              key={squad.id}
              squad={squad}
              squadCapacity={timeSlot.squadCapacity || 5}
              tournamentId={tournamentId}
              disciplineId={timeSlot.disciplineId}
              onUpdate={onUpdate}
              userRole={userRole}
              coachedTeamId={coachedTeamId}
            />
          ))}
        </div>
      )}

      {/* Droppable Zone - Only show if user can create additional squads */}
      {canCreateAdditionalSquad && (
        <div
          ref={setNodeRef}
          className={`text-center py-${timeSlot.squads.length > 0 ? '4' : '8'} rounded-lg border-2 border-dashed transition ${
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
              {timeSlot.squads.length > 0 ? 'Drop athlete to create another squad' : 'No squads yet • Drop an athlete here to create a squad'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

