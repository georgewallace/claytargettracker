'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { format } from 'date-fns'
import Link from 'next/link'
import { getDivisionColor, formatTimeSlotLabel, isShooterAssigned } from '@/lib/squadUtils'
import UnassignedShooters from './UnassignedShooters'
import TimeSlotSection from './TimeSlotSection'
import ShooterCard from './ShooterCard'

interface Tournament {
  id: string
  name: string
  startDate: Date
  endDate: Date
  timeSlots: any[]
  registrations: any[]
}

interface SquadManagerProps {
  tournament: Tournament
}

export default function SquadManager({ tournament }: SquadManagerProps) {
  const router = useRouter()
  const [draggedShooter, setDraggedShooter] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showMyTeamOnly, setShowMyTeamOnly] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null)

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    })
  )

  // Get current user's team if they're a coach
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setCurrentUser(data))
      .catch(() => {})
  }, [])

  // Get unique disciplines from tournament
  const tournamentDisciplines = Array.from(
    new Set(tournament.timeSlots.map(slot => slot.disciplineId))
  ).map(disciplineId => {
    const slot = tournament.timeSlots.find(s => s.disciplineId === disciplineId)
    return slot?.discipline
  }).filter(Boolean)

  // Set initial active discipline
  useEffect(() => {
    if (!activeDiscipline && tournamentDisciplines.length > 0) {
      setActiveDiscipline(tournamentDisciplines[0].id)
    }
  }, [tournamentDisciplines, activeDiscipline])

  // Get all registered shooters
  let allShooters = tournament.registrations.map(reg => ({
    ...reg.shooter,
    registrationId: reg.id,
    disciplines: reg.disciplines
  }))

  // Filter by team if toggle is on
  if (showMyTeamOnly && currentUser?.coachedTeam) {
    allShooters = allShooters.filter(shooter => shooter.teamId === currentUser.coachedTeam.id)
  }

  // Helper function to check if shooter is assigned in this discipline
  const isShooterAssignedInDiscipline = (shooterId: string, disciplineId: string) => {
    return tournament.timeSlots
      .filter(slot => slot.disciplineId === disciplineId)
      .some(slot => slot.squads.some((squad: any) => 
        squad.members.some((member: any) => member.shooterId === shooterId)
      ))
  }

  // Helper function to get all squads a shooter is in
  const getShooterSquads = (shooterId: string) => {
    const squads: any[] = []
    tournament.timeSlots.forEach(slot => {
      slot.squads.forEach((squad: any) => {
        if (squad.members.some((m: any) => m.shooterId === shooterId)) {
          squads.push({
            ...squad,
            timeSlot: slot
          })
        }
      })
    })
    return squads
  }

  // Helper function to check for time overlaps
  const hasTimeOverlap = (shooterId: string, newTimeSlot: any): {hasOverlap: boolean, overlappingSlots: any[]} => {
    const shooterSquads = getShooterSquads(shooterId)
    const overlapping: any[] = []
    
    for (const squadInfo of shooterSquads) {
      const existingSlot = squadInfo.timeSlot
      
      // Check if same date
      if (format(new Date(existingSlot.date), 'yyyy-MM-dd') === format(new Date(newTimeSlot.date), 'yyyy-MM-dd')) {
        // Check if times overlap
        const existingStart = existingSlot.startTime
        const existingEnd = existingSlot.endTime
        const newStart = newTimeSlot.startTime
        const newEnd = newTimeSlot.endTime
        
        // Times overlap if: (StartA < EndB) AND (EndA > StartB)
        if (newStart < existingEnd && newEnd > existingStart) {
          overlapping.push({
            ...squadInfo,
            timeSlot: existingSlot
          })
        }
      }
    }
    
    return {
      hasOverlap: overlapping.length > 0,
      overlappingSlots: overlapping
    }
  }

  // Filter unassigned shooters for active discipline
  const unassignedShooters = activeDiscipline 
    ? allShooters.filter(shooter => 
        !isShooterAssignedInDiscipline(shooter.id, activeDiscipline)
      )
    : []

  // Filter time slots by active discipline and sort
  const filteredTimeSlots = activeDiscipline
    ? tournament.timeSlots.filter(slot => slot.disciplineId === activeDiscipline)
    : tournament.timeSlots

  const sortedTimeSlots = [...filteredTimeSlots].sort((a, b) => {
    // Compare times first
    const timeCompare = a.startTime.localeCompare(b.startTime)
    if (timeCompare !== 0) return timeCompare
    
    // Extract numbers from field/station strings for comparison
    const getNumber = (slot: any) => {
      const fieldMatch = slot.fieldNumber?.match(/\d+/)
      const stationMatch = slot.stationNumber?.match(/\d+/)
      return parseInt(fieldMatch?.[0] || stationMatch?.[0] || '0')
    }
    
    return getNumber(a) - getNumber(b)
  })

  // Group sorted time slots by date
  const timeSlotsByDate = sortedTimeSlots.reduce((acc, slot) => {
    const dateKey = format(new Date(slot.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(slot)
    return acc
  }, {} as Record<string, any[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const shooter = allShooters.find(s => s.id === event.active.id)
    setDraggedShooter(shooter)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setDraggedShooter(null)
    
    if (!over) return
    
    const shooterId = active.id as string
    const targetId = over.id as string
    
    // Check if dropping on a squad
    if (targetId.startsWith('squad-')) {
      const squadId = targetId.replace('squad-', '')
      
      // Find the time slot for this squad
      const timeSlot = tournament.timeSlots.find(slot => 
        slot.squads.some((s: any) => s.id === squadId)
      )
      
      if (timeSlot) {
        // Check for time overlaps - block if conflict exists
        const overlapCheck = hasTimeOverlap(shooterId, timeSlot)
        
        if (overlapCheck.hasOverlap) {
          const overlapInfo = overlapCheck.overlappingSlots.map(info => {
            const slot = info.timeSlot
            return `• ${slot.discipline.displayName} - ${slot.startTime} to ${slot.endTime} (${info.name})`
          }).join('\n')
          
          const errorMsg = `❌ CANNOT ASSIGN - TIME CONFLICT\n\nThis shooter is already assigned to:\n${overlapInfo}\n\nThese times overlap with ${timeSlot.startTime} to ${timeSlot.endTime}.\n\nPlease remove the shooter from the conflicting squad first.`
          
          alert(errorMsg)
          return
        }
      }
      
      // Add shooter to squad
      setLoading(true)
      setError('')
      setSuccess('')
      
      try {
        const response = await fetch(`/api/squads/${squadId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shooterId })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to assign shooter')
        }
        
        setSuccess(`Shooter assigned successfully!`)
        setTimeout(() => setSuccess(''), 3000)
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'An error occurred')
        setTimeout(() => setError(''), 5000)
      } finally {
        setLoading(false)
      }
      return
    }
    
    // Check if dropping on a time slot (to create new squad)
    if (targetId.startsWith('timeslot-')) {
      const timeSlotId = targetId.replace('timeslot-', '')
      
      // Find the time slot
      const timeSlot = tournament.timeSlots.find(slot => slot.id === timeSlotId)
      
      if (timeSlot) {
        // Check for time overlaps - block if conflict exists
        const overlapCheck = hasTimeOverlap(shooterId, timeSlot)
        
        if (overlapCheck.hasOverlap) {
          const overlapInfo = overlapCheck.overlappingSlots.map(info => {
            const slot = info.timeSlot
            return `• ${slot.discipline.displayName} - ${slot.startTime} to ${slot.endTime} (${info.name})`
          }).join('\n')
          
          const errorMsg = `❌ CANNOT ASSIGN - TIME CONFLICT\n\nThis shooter is already assigned to:\n${overlapInfo}\n\nThese times overlap with ${timeSlot.startTime} to ${timeSlot.endTime}.\n\nPlease remove the shooter from the conflicting squad first.`
          
          alert(errorMsg)
          return
        }
      }
      
      const squadName = prompt('Create a new squad for this shooter.\n\nSquad name:')
      if (!squadName) return
      
      setLoading(true)
      setError('')
      setSuccess('')
      
      try {
        // First create the squad
        const createResponse = await fetch(`/api/timeslots/${timeSlotId}/squads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: squadName.trim(),
            capacity: 5 // Default capacity
          })
        })
        
        if (!createResponse.ok) {
          const data = await createResponse.json()
          throw new Error(data.error || 'Failed to create squad')
        }
        
        const newSquad = await createResponse.json()
        
        // Then add shooter to the new squad
        const addResponse = await fetch(`/api/squads/${newSquad.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shooterId })
        })
        
        if (!addResponse.ok) {
          const data = await addResponse.json()
          throw new Error(data.error || 'Failed to add shooter to squad')
        }
        
        setSuccess(`Squad "${squadName}" created and shooter assigned!`)
        setTimeout(() => setSuccess(''), 3000)
        router.refresh()
      } catch (err: any) {
        setError(err.message || 'An error occurred')
        setTimeout(() => setError(''), 5000)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-gray-600 mt-1">Squad Management</p>
          </div>
          <Link
            href={`/tournaments/${tournament.id}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Back to Tournament
          </Link>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
            {success}
          </div>
        )}

        {/* Discipline Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Disciplines">
              {tournamentDisciplines.map((discipline: any) => {
                const isActive = activeDiscipline === discipline.id
                const disciplineSlots = tournament.timeSlots.filter(s => s.disciplineId === discipline.id)
                const disciplineSquadCount = disciplineSlots.reduce((sum, slot) => sum + slot.squads.length, 0)
                
                return (
                  <button
                    key={discipline.id}
                    onClick={() => setActiveDiscipline(discipline.id)}
                    className={`${
                      isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
                  >
                    {discipline.displayName}
                    <span className={`ml-2 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'} py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                      {disciplineSquadCount}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Stats & Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="grid grid-cols-4 gap-6 flex-1">
              <div>
                <p className="text-sm text-gray-600">Total Shooters</p>
                <p className="text-2xl font-bold text-gray-900">{allShooters.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unassigned</p>
                <p className="text-2xl font-bold text-orange-600">{unassignedShooters.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Slots</p>
                <p className="text-2xl font-bold text-gray-900">{sortedTimeSlots.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Squads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sortedTimeSlots.reduce((sum, slot) => sum + slot.squads.length, 0)}
                </p>
              </div>
            </div>
            
            {/* Team Filter Toggle (Coaches only) */}
            {currentUser?.coachedTeam && (
              <div className="ml-6 pl-6 border-l border-gray-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMyTeamOnly}
                    onChange={(e) => setShowMyTeamOnly(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Show only my team ({currentUser.coachedTeam.name})
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Unassigned Shooters - Left Sidebar */}
        <div className="col-span-3">
          <UnassignedShooters shooters={unassignedShooters} />
        </div>

        {/* Time Slots & Squads - Main Area */}
        <div className="col-span-9 space-y-8">
          {Object.keys(timeSlotsByDate).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">No time slots created yet</p>
              <Link
                href={`/tournaments/${tournament.id}/schedule`}
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Manage Schedule
              </Link>
            </div>
          ) : (
            Object.entries(timeSlotsByDate).map(([date, slots]) => (
              <div key={date}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h2>
                <div className="space-y-6">
                  {(slots as any[]).map((timeSlot: any) => (
                    <TimeSlotSection 
                      key={timeSlot.id} 
                      timeSlot={timeSlot}
                      tournamentId={tournament.id}
                      onUpdate={() => router.refresh()}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedShooter && (
          <div className="opacity-80">
            <ShooterCard shooter={draggedShooter} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

