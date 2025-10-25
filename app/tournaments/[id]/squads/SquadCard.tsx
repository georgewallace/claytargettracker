'use client'

import { useState } from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { getSquadAvailableCapacity, classifySquad, getSquadTypeBadge, formatSquadClassification } from '@/lib/squadUtils'
import ShooterCard from './ShooterCard'

interface SquadCardProps {
  squad: any
  tournamentId: string
  disciplineId: string
  onUpdate: () => void
}

export default function SquadCard({ squad, tournamentId, disciplineId, onUpdate }: SquadCardProps) {
  const [removing, setRemoving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingTeamOnly, setUpdatingTeamOnly] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(squad.name)
  const [renamingError, setRenamingError] = useState('')
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [shooterToRemove, setShooterToRemove] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `squad-${squad.id}`,
  })

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `squad-${squad.id}`,
  })

  const availableCapacity = getSquadAvailableCapacity(squad)
  const isFull = availableCapacity === 0
  
  // Classify the squad
  const classification = classifySquad(squad.members)

  const handleRemoveClick = (shooter: any) => {
    setShooterToRemove(shooter)
    setShowRemoveModal(true)
  }

  const handleCancelRemove = () => {
    setShowRemoveModal(false)
    setShooterToRemove(null)
  }

  const handleConfirmRemove = async () => {
    if (!shooterToRemove) return

    setRemoving(shooterToRemove.id)

    try {
      const response = await fetch(`/api/squads/${squad.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shooterId: shooterToRemove.id })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove shooter')
      }

      setShowRemoveModal(false)
      setShooterToRemove(null)
      onUpdate()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setRemoving(null)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/squads/${squad.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete squad')
      }

      setShowDeleteModal(false)
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

  const handleRenameSubmit = async () => {
    if (!newName.trim() || newName === squad.name) {
      setIsRenaming(false)
      setNewName(squad.name)
      return
    }

    setRenamingError('')

    try {
      const response = await fetch(`/api/squads/${squad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName.trim(),
          tournamentId,
          disciplineId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to rename squad')
      }

      setIsRenaming(false)
      onUpdate()
    } catch (err: any) {
      setRenamingError(err.message || 'An error occurred')
    }
  }

  const handleRenameCancel = () => {
    setIsRenaming(false)
    setNewName(squad.name)
    setRenamingError('')
  }

  // Combine both refs
  const setRefs = (node: HTMLDivElement | null) => {
    setDroppableRef(node)
    setDraggableRef(node)
  }

  return (
    <div
      ref={setRefs}
      className={`border-2 rounded-lg p-4 transition ${
        isDragging 
          ? 'opacity-50 border-indigo-400 bg-indigo-100'
          : isOver && !isFull
          ? 'border-indigo-500 bg-indigo-50'
          : isFull
          ? 'border-gray-300 bg-gray-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Squad Header */}
      <div className="mb-3 pb-3 border-b border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition"
              title="Drag to move entire squad to another time slot"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
            
            {/* Squad Name - Editable */}
            {isRenaming ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit()
                    if (e.key === 'Escape') handleRenameCancel()
                  }}
                  className="px-2 py-1 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                  autoFocus
                />
                <button
                  onClick={handleRenameSubmit}
                  className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50 transition"
                  title="Save"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleRenameCancel}
                  className="text-gray-600 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition"
                  title="Cancel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <h4 className="font-semibold text-gray-900">{squad.name}</h4>
                <button
                  onClick={() => setIsRenaming(true)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition"
                  title="Rename squad"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </>
            )}
            
            <p className={`text-sm ${isFull ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              {squad.members.length}/{squad.capacity}
              {isFull && ' (Full)'}
            </p>
          </div>
          <button
            onClick={handleDeleteClick}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition text-sm"
            title="Delete squad"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        {/* Rename Error */}
        {renamingError && (
          <div className="text-xs text-red-600 ml-10">
            {renamingError}
          </div>
        )}
        
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
                    : () => handleRemoveClick(member.shooter)
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

      {/* Remove Shooter Modal */}
      {showRemoveModal && shooterToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Remove Shooter
                </h3>
                <button
                  onClick={handleCancelRemove}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={removing !== null}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to remove this shooter from the squad?
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 mb-1">
                      {shooterToRemove.user?.name}
                    </div>
                    {shooterToRemove.team && (
                      <div className="text-gray-600">
                        {shooterToRemove.team.name}
                      </div>
                    )}
                    {shooterToRemove.division && (
                      <div className="text-gray-600 mt-1">
                        {shooterToRemove.division}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  The shooter will be moved back to the unassigned list.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelRemove}
                  disabled={removing !== null}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  disabled={removing !== null}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {removing !== null ? 'Removing...' : 'Remove Shooter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Squad Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Delete Squad
                </h3>
                <button
                  onClick={handleCancelDelete}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={deleting}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete this squad?
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 mb-1">
                      {squad.name}
                    </div>
                    <div className="text-gray-600">
                      {squad.members.length} shooter{squad.members.length !== 1 ? 's' : ''} in squad
                    </div>
                  </div>
                </div>
                {squad.members.length > 0 ? (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Warning: All {squad.members.length} shooter{squad.members.length !== 1 ? 's' : ''} will be unassigned and moved back to the unassigned list.</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-3">
                    This action cannot be undone.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {deleting ? 'Deleting...' : 'Delete Squad'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

