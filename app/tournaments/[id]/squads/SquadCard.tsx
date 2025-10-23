'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { getSquadAvailableCapacity, classifySquad, getSquadTypeBadge, formatSquadClassification } from '@/lib/squadUtils'
import ShooterCard from './ShooterCard'

interface SquadCardProps {
  squad: any
  onUpdate: () => void
}

export default function SquadCard({ squad, onUpdate }: SquadCardProps) {
  const [removing, setRemoving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingTeamOnly, setUpdatingTeamOnly] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: `squad-${squad.id}`,
  })

  const availableCapacity = getSquadAvailableCapacity(squad)
  const isFull = availableCapacity === 0
  
  // Classify the squad
  const classification = classifySquad(squad.members)

  const handleRemoveShooter = async (shooterId: string) => {
    if (!confirm('Remove this shooter from the squad?')) return

    setRemoving(shooterId)

    try {
      const response = await fetch(`/api/squads/${squad.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shooterId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove shooter')
      }

      onUpdate()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setRemoving(null)
    }
  }

  const handleDeleteSquad = async () => {
    if (squad.members.length > 0) {
      if (!confirm(`This squad has ${squad.members.length} shooter(s). Remove them first, or they will be unassigned. Continue?`)) {
        return
      }
    } else {
      if (!confirm('Delete this squad?')) return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/squads/${squad.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete squad')
      }

      onUpdate()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleTeamOnly = async () => {
    setUpdatingTeamOnly(true)

    try {
      const response = await fetch(`/api/squads/${squad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamOnly: !squad.teamOnly })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update squad')
      }

      onUpdate()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setUpdatingTeamOnly(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`border-2 rounded-lg p-4 transition ${
        isOver && !isFull
          ? 'border-indigo-500 bg-indigo-50'
          : isFull
          ? 'border-gray-300 bg-gray-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Squad Header */}
      <div className="mb-3 pb-3 border-b border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-gray-900">{squad.name}</h4>
            <p className={`text-sm ${isFull ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              {squad.members.length}/{squad.capacity}
              {isFull && ' (Full)'}
            </p>
          </div>
          <button
            onClick={handleDeleteSquad}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition text-sm"
            title="Delete squad"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        {/* Squad Classification and Team-Only Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Classification Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSquadTypeBadge(classification.type)}`}>
              {classification.type === 'division' ? '🏆 Division' : '🌐 Open'}
            </span>
            
            {classification.type === 'division' && classification.team && (
              <span className="text-xs text-gray-600">
                {classification.team} - {classification.division}
              </span>
            )}
            
            {squad.teamOnly && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium border border-blue-300">
                🔒 Team Only
              </span>
            )}
          </div>
          
          {/* Team-Only Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-600">Team Only:</span>
            <input
              type="checkbox"
              checked={squad.teamOnly}
              onChange={handleToggleTeamOnly}
              disabled={updatingTeamOnly}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
              title="When enabled, only shooters from the same team can be added"
            />
          </label>
        </div>
      </div>

      {/* Squad Members - Horizontal Layout */}
      <div className="flex items-start gap-3 flex-wrap min-h-[100px]">
        {squad.members.length > 0 ? (
          squad.members.map((member: any) => (
            <div key={member.id} className="flex-shrink-0 w-[180px]">
              <ShooterCard
                shooter={member.shooter}
                onRemove={
                  removing === member.shooterId
                    ? undefined
                    : () => handleRemoveShooter(member.shooterId)
                }
              />
            </div>
          ))
        ) : (
          <div className="flex-1 text-center py-6 text-gray-400 text-sm">
            {isOver ? (
              <span className="text-indigo-600 font-medium">Drop shooter here</span>
            ) : (
              'Drop shooters here'
            )}
          </div>
        )}

        {/* Drop Zone Indicator - Shows as a card slot */}
        {isOver && !isFull && squad.members.length > 0 && (
          <div className="flex-shrink-0 w-[180px] border-2 border-dashed border-indigo-400 rounded-md p-3 text-center text-indigo-600 text-sm font-medium flex items-center justify-center min-h-[80px]">
            Drop here
          </div>
        )}

        {/* Full Indicator */}
        {isFull && isOver && (
          <div className="flex-1 border-2 border-dashed border-red-400 rounded-md p-3 text-center text-red-600 text-sm font-medium flex items-center justify-center">
            Squad is full
          </div>
        )}
      </div>
    </div>
  )
}

