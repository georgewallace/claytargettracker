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
  const [draggedSquad, setDraggedSquad] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showMyTeamOnly, setShowMyTeamOnly] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false)
  const [autoAssignOptions, setAutoAssignOptions] = useState({
    keepTeamsTogether: true,
    keepDivisionsTogether: true,
    keepTeamsCloseInTime: false,
    deleteExistingSquads: false,
    includeShootersWithoutTeams: false,
    includeShootersWithoutDivisions: false,
    autoAssignAcrossDisciplines: false
  })
  const [showAddTimeSlot, setShowAddTimeSlot] = useState(false)
  const [newTimeSlot, setNewTimeSlot] = useState({
    date: '',
    startTime: '',
    endTime: '',
    squadCapacity: 5,
    fieldNumber: ''
  })
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{start: string, end: string}>>([])
  const [creatingTimeSlot, setCreatingTimeSlot] = useState(false)

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

  // Get unique fields for the active discipline
  const availableFields = activeDiscipline
    ? Array.from(
        new Set(
          tournament.timeSlots
            .filter(slot => slot.disciplineId === activeDiscipline && slot.fieldNumber)
            .map(slot => slot.fieldNumber)
        )
      ).sort()
    : []

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
      
      // Check if same date (using ISO string to avoid timezone conversion)
      const existingDateStr = new Date(existingSlot.date).toISOString().split('T')[0]
      const newDateStr = new Date(newTimeSlot.date).toISOString().split('T')[0]
      
      if (existingDateStr === newDateStr) {
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

  // Filter time slots by active discipline and ensure they're within tournament date range (using string comparison to avoid timezone issues)
  const filteredTimeSlots = activeDiscipline
    ? tournament.timeSlots.filter(slot => {
        if (slot.disciplineId !== activeDiscipline) return false
        
        // Filter out time slots outside tournament date range using string comparison
        const slotDateStr = new Date(slot.date).toISOString().split('T')[0]
        const tournamentStartStr = new Date(tournament.startDate).toISOString().split('T')[0]
        const tournamentEndStr = new Date(tournament.endDate).toISOString().split('T')[0]
        
        return slotDateStr >= tournamentStartStr && slotDateStr <= tournamentEndStr
      })
    : tournament.timeSlots.filter(slot => {
        // Filter out time slots outside tournament date range using string comparison
        const slotDateStr = new Date(slot.date).toISOString().split('T')[0]
        const tournamentStartStr = new Date(tournament.startDate).toISOString().split('T')[0]
        const tournamentEndStr = new Date(tournament.endDate).toISOString().split('T')[0]
        
        return slotDateStr >= tournamentStartStr && slotDateStr <= tournamentEndStr
      })

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

  // Group sorted time slots by date (using ISO string to avoid timezone conversion)
  const timeSlotsByDate = sortedTimeSlots.reduce((acc, slot) => {
    // Extract date in YYYY-MM-DD format without timezone conversion
    const dateKey = new Date(slot.date).toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(slot)
    return acc
  }, {} as Record<string, any[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string
    
    // Check if dragging a squad
    if (activeId.startsWith('squad-')) {
      const squadId = activeId.replace('squad-', '')
      const squad = tournament.timeSlots
        .flatMap(slot => slot.squads)
        .find((s: any) => s.id === squadId)
      setDraggedSquad(squad || null)
      return
    }
    
    const shooter = allShooters.find(s => s.id === activeId)
    setDraggedShooter(shooter)
  }

  const handleAutoAssignClick = () => {
    setShowAutoAssignModal(true)
  }

  const handleConfirmAutoAssign = async () => {
    setAutoAssigning(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/auto-assign-squads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...autoAssignOptions,
          activeDisciplineId: autoAssignOptions.autoAssignAcrossDisciplines ? null : activeDiscipline
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to auto-assign shooters')
      }

      setShowAutoAssignModal(false)
      setSuccess(data.message || 'Auto-assignment completed successfully!')
      setTimeout(() => setSuccess(''), 5000)
      router.refresh()
    } catch (err: any) {
      setShowAutoAssignModal(false)
      setError(err.message || 'An error occurred during auto-assignment')
      setTimeout(() => setError(''), 5000)
    } finally {
      setAutoAssigning(false)
    }
  }

  const handleCancelAutoAssign = () => {
    setShowAutoAssignModal(false)
  }

  // Calculate available time slots when date changes
  const calculateAvailableSlots = (selectedDate: string, fieldNumber?: string) => {
    if (!activeDiscipline || !selectedDate) {
      setAvailableTimeSlots([])
      return
    }

    // Get all existing time slots for this date and discipline
    const existingSlots = filteredTimeSlots
      .filter(slot => {
        // Extract date in YYYY-MM-DD format without timezone conversion
        const slotDateStr = new Date(slot.date).toISOString().split('T')[0]
        const matchesDate = slotDateStr === selectedDate
        const matchesField = !fieldNumber || !slot.fieldNumber || slot.fieldNumber === fieldNumber
        return matchesDate && matchesField
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    // Determine typical slot duration from existing slots
    let typicalDuration = 120 // Default 2 hours
    if (existingSlots.length > 0) {
      const durations = existingSlots.map(slot => {
        const [startH, startM] = slot.startTime.split(':').map(Number)
        const [endH, endM] = slot.endTime.split(':').map(Number)
        return (endH * 60 + endM) - (startH * 60 + startM)
      })
      typicalDuration = durations[0] || 120 // Use first slot's duration
    }

    // Generate all possible time slots for the day (8 AM - 6 PM)
    const allSlots: Array<{start: string, end: string}> = []
    const startHour = 8
    const endHour = 18
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startMinutes = hour * 60
      const endMinutes = startMinutes + typicalDuration
      
      if (endMinutes <= endHour * 60) {
        const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
        allSlots.push({ start: startTime, end: endTime })
      }
    }

    // Filter out slots that overlap with existing slots
    const available = allSlots.filter(slot => {
      return !existingSlots.some(existing => {
        // Check if times overlap
        return (slot.start < existing.endTime && slot.end > existing.startTime)
      })
    })

    setAvailableTimeSlots(available)
  }

  const handleCreateTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!activeDiscipline || !newTimeSlot.date || !newTimeSlot.startTime || !newTimeSlot.endTime) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(''), 3000)
      return
    }

    // Validate date is within tournament range (compare date strings to avoid timezone issues)
    const slotDateStr = newTimeSlot.date // Format: YYYY-MM-DD
    const tournamentStartDate = new Date(tournament.startDate)
    const tournamentEndDate = new Date(tournament.endDate)
    
    // Convert tournament dates to YYYY-MM-DD format for comparison
    const tournamentStartStr = format(tournamentStartDate, 'yyyy-MM-dd')
    const tournamentEndStr = format(tournamentEndDate, 'yyyy-MM-dd')

    if (slotDateStr < tournamentStartStr || slotDateStr > tournamentEndStr) {
      setError(`Time slot must be between ${format(tournamentStartDate, 'MMM d, yyyy')} and ${format(tournamentEndDate, 'MMM d, yyyy')}`)
      setTimeout(() => setError(''), 5000)
      return
    }

    setCreatingTimeSlot(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/timeslots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disciplineId: activeDiscipline,
          date: newTimeSlot.date,
          startTime: newTimeSlot.startTime,
          endTime: newTimeSlot.endTime,
          squadCapacity: newTimeSlot.squadCapacity,
          fieldNumber: newTimeSlot.fieldNumber || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create time slot')
      }

      setSuccess('Time slot created successfully!')
      setTimeout(() => setSuccess(''), 3000)
      setShowAddTimeSlot(false)
      setNewTimeSlot({ date: '', startTime: '', endTime: '', squadCapacity: 5, fieldNumber: '' })
      setAvailableTimeSlots([])
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating time slot')
      setTimeout(() => setError(''), 5000)
    } finally {
      setCreatingTimeSlot(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    setDraggedShooter(null)
    setDraggedSquad(null)
    
    if (!over) return

    const activeId = active.id as string
    const targetId = over.id as string

    // Handle squad dragging
    if (activeId.startsWith('squad-') && targetId.startsWith('timeslot-')) {
      const squadId = activeId.replace('squad-', '')
      const timeSlotId = targetId.replace('timeslot-', '')
      
      setLoading(true)
      setError('')
      setSuccess('')
      
      try {
        const response = await fetch(`/api/squads/${squadId}/move`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSlotId })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to move squad')
        }
        
        setSuccess('Squad moved successfully!')
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
    
    // Continue with shooter dragging logic below...
    if (activeId.startsWith('squad-')) return // Don't continue if it was a squad drag
    
    const shooterId = activeId // Use the activeId we already declared
    
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
            
            <div className="flex items-center gap-4 ml-6 pl-6 border-l border-gray-200">
              {/* Auto-Assign Button */}
              <button
                onClick={handleAutoAssignClick}
                disabled={autoAssigning || unassignedShooters.length === 0}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-sm"
              >
                {autoAssigning ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assigning...
                  </span>
                ) : (
                  <>Auto-Assign Squads</>
                )}
              </button>

              {/* Team Filter Toggle (Coaches only) */}
              {currentUser?.coachedTeam && (
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
              )}
            </div>
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
          {/* Add Time Slot Section */}
          {activeDiscipline && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {!showAddTimeSlot ? (
                <button
                  onClick={() => setShowAddTimeSlot(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Time Slot for {tournamentDisciplines.find(d => d.id === activeDiscipline)?.displayName}
                </button>
              ) : (
                <form onSubmit={handleCreateTimeSlot} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      New Time Slot - {tournamentDisciplines.find(d => d.id === activeDiscipline)?.displayName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTimeSlot(false)
                        setNewTimeSlot({ date: '', startTime: '', endTime: '', squadCapacity: 5, fieldNumber: '' })
                        setAvailableTimeSlots([])
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={newTimeSlot.date}
                        onChange={(e) => {
                          setNewTimeSlot({ ...newTimeSlot, date: e.target.value })
                          calculateAvailableSlots(e.target.value, newTimeSlot.fieldNumber)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    
                    {(tournamentDisciplines.find(d => d.id === activeDiscipline)?.name === 'trap' || 
                      tournamentDisciplines.find(d => d.id === activeDiscipline)?.name === 'skeet') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field *
                        </label>
                        <select
                          value={newTimeSlot.fieldNumber}
                          onChange={(e) => {
                            setNewTimeSlot({ ...newTimeSlot, fieldNumber: e.target.value })
                            if (newTimeSlot.date) {
                              calculateAvailableSlots(newTimeSlot.date, e.target.value)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select a field...</option>
                          {availableFields.map(field => (
                            <option key={field} value={field}>
                              {field}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Squad Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newTimeSlot.squadCapacity}
                        onChange={(e) => setNewTimeSlot({ ...newTimeSlot, squadCapacity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {newTimeSlot.date && availableTimeSlots.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Time Slots *
                      </label>
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {availableTimeSlots.map((slot, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setNewTimeSlot({ 
                                ...newTimeSlot, 
                                startTime: slot.start, 
                                endTime: slot.end 
                              })
                            }}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                              newTimeSlot.startTime === slot.start && newTimeSlot.endTime === slot.end
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {slot.start} - {slot.end}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {newTimeSlot.date && availableTimeSlots.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <p className="text-sm text-amber-800">
                        No available time slots found for this date{newTimeSlot.fieldNumber ? ` and field` : ''}. All time slots may be in use.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTimeSlot(false)
                        setNewTimeSlot({ date: '', startTime: '', endTime: '', squadCapacity: 5, fieldNumber: '' })
                        setAvailableTimeSlots([])
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                      disabled={creatingTimeSlot}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingTimeSlot || !newTimeSlot.startTime || !newTimeSlot.endTime}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                      {creatingTimeSlot ? 'Creating...' : 'Create Time Slot'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

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
                  {format(new Date(`${date}T12:00:00.000Z`), 'EEEE, MMMM d, yyyy')}
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
        {draggedSquad && (
          <div className="opacity-80 bg-white border-2 border-indigo-400 rounded-lg p-4 shadow-xl min-w-[300px]">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              <h4 className="font-semibold text-gray-900">{draggedSquad.name}</h4>
              <p className="text-sm text-gray-600">
                ({draggedSquad.members.length}/{draggedSquad.capacity})
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Moving squad with {draggedSquad.members.length} {draggedSquad.members.length === 1 ? 'shooter' : 'shooters'}
            </p>
          </div>
        )}
      </DragOverlay>

      {/* Auto-Assign Confirmation Modal */}
      {showAutoAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Auto-Assign Squads
                </h3>
                <button
                  onClick={handleCancelAutoAssign}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={autoAssigning}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  This will automatically assign all unassigned shooters with teams to squads.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Assignment Rules:
                  </h4>
                  <ul className="text-sm text-blue-900 space-y-1 ml-7">
                    <li>• One squad per time slot per field for Trap</li>
                    <li>• One squad per time slot for 5-Stand and Skeet</li>
                    <li>• Multiple squads per time slot for Sporting Clays</li>
                    <li>• Time conflicts are automatically prevented</li>
                  </ul>
                </div>

                <div className="bg-white border border-gray-300 rounded-md p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Assignment Options:</h4>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAssignOptions.keepTeamsTogether}
                        onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, keepTeamsTogether: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">Keep teams together</span>
                        <p className="text-xs text-gray-600 mt-0.5">Team members will be in the same squad (squads may not be full)</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAssignOptions.keepDivisionsTogether}
                        onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, keepDivisionsTogether: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">Keep divisions together</span>
                        <p className="text-xs text-gray-600 mt-0.5">Shooters in the same division will be grouped together</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAssignOptions.keepTeamsCloseInTime}
                        onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, keepTeamsCloseInTime: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">Keep teams close in time</span>
                        <p className="text-xs text-gray-600 mt-0.5">Teams will be assigned to nearby time slots when possible</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAssignOptions.autoAssignAcrossDisciplines}
                        onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, autoAssignAcrossDisciplines: e.target.checked }))}
                        className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">Auto-assign across all disciplines</span>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {autoAssignOptions.autoAssignAcrossDisciplines 
                            ? 'Will assign shooters to squads in all disciplines' 
                            : `Will only assign shooters to squads in ${tournamentDisciplines.find(d => d.id === activeDiscipline)?.displayName || 'the active discipline'}`
                          }
                        </p>
                      </div>
                    </label>

                    <div className="pt-3 border-t border-gray-200 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAssignOptions.includeShootersWithoutTeams}
                          onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, includeShootersWithoutTeams: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Include shooters without teams</span>
                          <p className="text-xs text-gray-600 mt-0.5">Assign shooters who are not on a team</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAssignOptions.includeShootersWithoutDivisions}
                          onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, includeShootersWithoutDivisions: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Include shooters without divisions</span>
                          <p className="text-xs text-gray-600 mt-0.5">Assign shooters who don't have a division set</p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAssignOptions.deleteExistingSquads}
                          onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, deleteExistingSquads: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Delete existing squads</span>
                          <p className="text-xs text-gray-600 mt-0.5">Remove all current squads before auto-assigning. If unchecked, only unassigned shooters will be added to available squads.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Unassigned shooters:</span>
                      <span className="font-semibold text-gray-900">{unassignedShooters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available time slots:</span>
                      <span className="font-semibold text-gray-900">{sortedTimeSlots.length}</span>
                    </div>
                  </div>
                </div>

                {autoAssignOptions.deleteExistingSquads && (
                  <p className="text-sm text-amber-600 mt-3 flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Warning: This will delete all existing squads and create new ones.</span>
                  </p>
                )}
                {!autoAssignOptions.deleteExistingSquads && (
                  <p className="text-sm text-blue-600 mt-3 flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Only unassigned shooters will be added. Existing squads will be preserved, and shooters will not be assigned if it would violate time conflict or squad rules.</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelAutoAssign}
                  disabled={autoAssigning}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAutoAssign}
                  disabled={autoAssigning}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {autoAssigning ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </span>
                  ) : (
                    'Confirm & Assign'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}

