'use client'

import { useState } from 'react'
import { DndContext, useDroppable, useDraggable, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getSquadAvailableCapacity, classifySquad, getSquadTypeBadge, formatSquadClassification } from '@/lib/squadUtils'
import AthleteCard from './AthleteCard'

interface SquadCardProps {
  squad: any
  squadCapacity: number
  tournamentId: string
  disciplineId: string
  onUpdate: () => void
  userRole?: string
  coachedTeamId?: string | null
}

// Sortable member wrapper component
function SortableMember({ member, disciplineId, timeSlotId, onRemove, removing }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-[175px] relative"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 z-10 cursor-grab active:cursor-grabbing bg-white/90 rounded p-1 shadow-sm hover:bg-gray-50 transition"
        title="Drag to reorder"
      >
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>
      <AthleteCard
        athlete={member.athlete}
        currentDisciplineId={disciplineId}
        currentTimeSlotId={timeSlotId}
        onRemove={removing === member.athleteId ? undefined : onRemove}
      />
    </div>
  )
}

export default function SquadCard({ squad, squadCapacity, tournamentId, disciplineId, onUpdate, userRole, coachedTeamId }: SquadCardProps) {
  const [removing, setRemoving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingTeamOnly, setUpdatingTeamOnly] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [athleteToRemove, setathleteToRemove] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sortedMembers, setSortedMembers] = useState(
    [...squad.members].sort((a, b) => (a.position || 0) - (b.position || 0))
  )
  const [reordering, setReordering] = useState(false)

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `squad-${squad.id}`,
  })

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `squad-${squad.id}`,
  })

  // Handle drag end for reordering within squad
  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = sortedMembers.findIndex((m: any) => m.id === active.id)
    const newIndex = sortedMembers.findIndex((m: any) => m.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Optimistically update UI
    const reordered = arrayMove(sortedMembers, oldIndex, newIndex)
    setSortedMembers(reordered)

    // Update positions on server
    setReordering(true)
    try {
      const updates = reordered.map((member: any, index: number) => ({
        athleteId: member.athleteId,
        position: index + 1
      }))

      const response = await fetch(`/api/squads/${squad.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      if (!response.ok) {
        throw new Error('Failed to update positions')
      }

      onUpdate()
    } catch (err: any) {
      // Revert on error
      setSortedMembers(squad.members)
      alert(err.message || 'Failed to reorder athletes')
    } finally {
      setReordering(false)
    }
  }

  // Use the time slot's squadCapacity instead of the stored squad.capacity
  const availableCapacity = squadCapacity - squad.members.length
  const isFull = availableCapacity === 0
  const isPartial = squad.members.length > 0 && !isFull
  const isEmpty = squad.members.length === 0

  // Classify the squad
  const classification = classifySquad(squad.members)

  // Determine if the user can delete this squad
  const canDeleteSquad = () => {
    // Admins can delete any squad
    if (userRole === 'admin') return true

    // Coaches can only delete squads where all members are from their team
    if (userRole === 'coach' && coachedTeamId) {
      // Empty squads can be deleted by coaches
      if (squad.members.length === 0) return true

      // Check if all members are from the coach's team
      const allMembersFromCoachTeam = squad.members.every(
        (member: any) => member.athlete?.teamId === coachedTeamId
      )
      return allMembersFromCoachTeam
    }

    return false
  }

  const handleRemoveClick = (athlete: any) => {
    setathleteToRemove(athlete)
    setShowRemoveModal(true)
  }

  const handleCancelRemove = () => {
    setShowRemoveModal(false)
    setathleteToRemove(null)
  }

  const handleConfirmRemove = async () => {
    if (!athleteToRemove) return

    setRemoving(athleteToRemove.id)

    try {
      const response = await fetch(`/api/squads/${squad.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athleteToRemove.id })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove athlete')
      }

      setShowRemoveModal(false)
      setathleteToRemove(null)
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


  // Combine both refs
  const setRefs = (node: HTMLDivElement | null) => {
    setDroppableRef(node)
    setDraggableRef(node)
  }

  return (
    <div
      ref={setRefs}
      className={`border rounded-lg p-2 transition ${
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
      <div className="mb-2 pb-2 border-b border-gray-200 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100 transition"
              title="Drag to move entire squad to another time slot"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>

            {/* Squad Name - Auto-generated, read-only */}
            <h4 className="text-sm font-semibold text-gray-900">{squad.name}</h4>

            <div className="flex items-center gap-1.5">
              <p className={`text-xs ${isFull ? 'text-green-600 font-medium' : isPartial ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                {squad.members.length}/{squadCapacity}
                {isFull && ' ✓'}
              </p>
              {isPartial && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-medium" title="Squad is not completely filled">
                  ⚠ Incomplete
                </span>
              )}
            </div>
          </div>
          {canDeleteSquad() && (
            <button
              onClick={handleDeleteClick}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-0.5 rounded transition text-sm"
              title="Delete squad"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Squad Classification and Team-Only Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Classification Badge */}
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSquadTypeBadge(classification.type)}`}>
              {classification.type === 'division' ? '🏆 Division' : '🌐 Open'}
            </span>

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
              title="When enabled, only athletes from the same team can be added"
            />
          </label>
        </div>
      </div>

      {/* Squad Members - Horizontal Layout with Sortable Support */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={sortedMembers.map((m: any) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex items-start gap-2 flex-wrap min-h-[60px]">
            {sortedMembers.length > 0 ? (
              sortedMembers.map((member: any) => (
                <SortableMember
                  key={member.id}
                  member={member}
                  disciplineId={disciplineId}
                  timeSlotId={squad.timeSlotId}
                  onRemove={() => handleRemoveClick(member.athlete)}
                  removing={removing}
                />
              ))
            ) : (
              <div className="flex-1 text-center py-3 text-gray-400 text-xs">
                {isOver ? (
                  <span className="text-indigo-600 font-medium">Drop athlete here</span>
                ) : (
                  'Drop athletes here'
                )}
              </div>
            )}

        {/* Drop Zone Indicator - Shows as a card slot */}
        {isOver && !isFull && squad.members.length > 0 && (
          <div className="flex-shrink-0 w-[175px] border-2 border-dashed border-indigo-400 rounded-md p-2 text-center text-indigo-600 text-xs font-medium flex items-center justify-center min-h-[60px]">
            Drop here
          </div>
        )}

        {/* Full Indicator */}
        {isFull && isOver && (
          <div className="flex-1 border-2 border-dashed border-red-400 rounded-md p-2 text-center text-red-600 text-xs font-medium flex items-center justify-center">
            Squad is full
          </div>
        )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Remove Athlete Modal */}
      {showRemoveModal && athleteToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Remove athlete
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
                  Are you sure you want to remove this athlete from the squad?
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 mb-1">
                      {athleteToRemove.user?.name}
                    </div>
                    {athleteToRemove.team && (
                      <div className="text-gray-600">
                        {athleteToRemove.team.name}
                      </div>
                    )}
                    {athleteToRemove.division && (
                      <div className="text-gray-600 mt-1">
                        {athleteToRemove.division}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  The athlete will be moved back to the unassigned list.
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
                  {removing !== null ? 'Removing...' : 'Remove athlete'}
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
                      {squad.members.length} athlete{squad.members.length !== 1 ? 's' : ''} in squad
                    </div>
                  </div>
                </div>
                {squad.members.length > 0 ? (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Warning: All {squad.members.length} athlete{squad.members.length !== 1 ? 's' : ''} will be unassigned and moved back to the unassigned list.</span>
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

