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
  const [creating, setCreating] = useState(false)
  const [squadName, setSquadName] = useState('')
  
  // Make the time slot droppable when it has no squads
  const { setNodeRef, isOver } = useDroppable({
    id: `timeslot-${timeSlot.id}`,
    disabled: timeSlot.squads.length > 0 // Only droppable when empty
  })

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!squadName.trim()) return

    setCreating(true)

    try {
      const response = await fetch(`/api/timeslots/${timeSlot.id}/squads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: squadName.trim(),
          capacity: timeSlot.squadCapacity
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create squad')
      }

      setSquadName('')
      onUpdate()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Time Slot Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {formatTimeSlotLabel(timeSlot)}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">
            {timeSlot.discipline.displayName} • Capacity: {timeSlot.squadCapacity} per squad
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {timeSlot.squads.length} squad{timeSlot.squads.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Squads Grid */}
      {timeSlot.squads.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 mb-4">
          {timeSlot.squads.map((squad: any) => (
            <SquadCard 
              key={squad.id} 
              squad={squad} 
              onUpdate={onUpdate}
            />
          ))}
        </div>
      ) : (
        <div 
          ref={setNodeRef}
          className={`text-center py-12 mb-4 rounded-lg border-2 border-dashed transition ${
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
              No squads yet • Drop a shooter here or use form below
            </p>
          )}
        </div>
      )}

      {/* Create Squad Form */}
      <form onSubmit={handleCreateSquad} className="flex gap-2">
        <input
          type="text"
          value={squadName}
          onChange={(e) => setSquadName(e.target.value)}
          placeholder="Squad name (e.g., Squad A)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !squadName.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          {creating ? 'Creating...' : '+ Add Squad'}
        </button>
      </form>
    </div>
  )
}

