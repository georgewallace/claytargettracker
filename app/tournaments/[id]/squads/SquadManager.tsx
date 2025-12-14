'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { format } from 'date-fns'
import Link from 'next/link'
import { getDivisionColor, formatTimeSlotLabel, isAthleteAssigned } from '@/lib/squadUtils'
import { squadNameOptions } from '@/lib/divisions'
import Unassignedathletes from './UnassignedAthletes'
import TimeSlotSection from './TimeSlotSection'
import AthleteCard from './AthleteCard'

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
  userRole: string
  coachedTeamId?: string | null
}

export default function SquadManager({ tournament: initialTournament, userRole, coachedTeamId }: SquadManagerProps) {
  const router = useRouter()
  const [draggedathlete, setDraggedathlete] = useState<any | null>(null)
  const [draggedSquad, setDraggedSquad] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // New: Track background save operations
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showMyTeamOnly, setShowMyTeamOnly] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [tournament, setTournament] = useState(initialTournament) // New: Local state for optimistic updates
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false)
  const [autoAssignOptions, setAutoAssignOptions] = useState({
    keepTeamsTogether: true,
    keepDivisionsTogether: true,
    keepTeamsCloseInTime: false,
    deleteExistingSquads: false,
    includeathletesWithoutTeams: false,
    includeathletesWithoutDivisions: false,
    autoAssignAcrossDisciplines: false
  })
  const [showAddTimeSlot, setShowAddTimeSlot] = useState(false)
  const [showCreateSquadModal, setShowCreateSquadModal] = useState(false)
  const [newSquadName, setNewSquadName] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [teams, setTeams] = useState<Array<{id: string, name: string}>>([])
  const [pendingSquadCreation, setPendingSquadCreation] = useState<{
    timeSlotId: string
    athleteId: string
    disciplineId: string
  } | null>(null)
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

  // Sync local state with prop changes
  useEffect(() => {
    setTournament(initialTournament)
  }, [initialTournament])

  // Get current user's team if they're a coach
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setCurrentUser(data))
      .catch(() => {})
  }, [])

  // Fetch teams for admin squad creation
  useEffect(() => {
    if (userRole === 'admin') {
      fetch('/api/teams')
        .then(res => res.json())
        .then(data => setTeams(data || []))
        .catch(() => {})
    }
  }, [userRole])

  // MEMOIZED: Get all registered athletes with team filtering
  // PERFORMANCE: Only recalculates when registrations, team filters, or user change
  const allathletes = useMemo(() => {
    let athletes = tournament.registrations.map(reg => ({
      ...reg.athlete,
      registrationId: reg.id,
      disciplines: reg.disciplines
    }))

    // Filter by team - coaches can ONLY see their own team's athletes
    if (userRole === 'coach' && coachedTeamId) {
      athletes = athletes.filter(athlete => athlete.teamId === coachedTeamId)
    }
    // Admins can optionally filter by team using the toggle
    else if (showMyTeamOnly && currentUser?.coachedTeam) {
      athletes = athletes.filter(athlete => athlete.teamId === currentUser.coachedTeam.id)
    }

    return athletes
  }, [tournament.registrations, userRole, coachedTeamId, showMyTeamOnly, currentUser?.coachedTeam])

  // Initialize selectedTeamId when modal opens
  useEffect(() => {
    if (showCreateSquadModal) {
      if (userRole === 'coach' && coachedTeamId) {
        setSelectedTeamId(coachedTeamId)
      } else if (userRole === 'admin' && pendingSquadCreation) {
        // Try to get the team from the athlete being added
        const athlete = allathletes.find((a: any) => a.id === pendingSquadCreation.athleteId)
        if (athlete?.teamId) {
          setSelectedTeamId(athlete.teamId)
        } else {
          setSelectedTeamId('unaffiliated')
        }
      }
    }
  }, [showCreateSquadModal, userRole, coachedTeamId, pendingSquadCreation, allathletes])

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

  // Create a map of athlete ID to registration data for easy lookup
  const athleteRegistrationMap = new Map(
    tournament.registrations.map(reg => [reg.athlete.id, reg.disciplines])
  )

  // Helper function to check if athlete is assigned in this discipline
  const isAthleteAssignedInDiscipline = (athleteId: string, disciplineId: string) => {
    return tournament.timeSlots
      .filter(slot => slot.disciplineId === disciplineId)
      .some(slot => slot.squads.some((squad: any) => 
        squad.members.some((member: any) => member.athleteId === athleteId)
      ))
  }

  // Helper function to get all squads a athlete is in
  const getathletesquads = (athleteId: string) => {
    const squads: any[] = []
    tournament.timeSlots.forEach(slot => {
      slot.squads.forEach((squad: any) => {
        if (squad.members.some((m: any) => m.athleteId === athleteId)) {
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
  const hasTimeOverlap = (athleteId: string, newTimeSlot: any): {hasOverlap: boolean, overlappingSlots: any[]} => {
    const athletesquads = getathletesquads(athleteId)
    const overlapping: any[] = []
    
    for (const squadInfo of athletesquads) {
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

  // Filter unassigned athletes for active discipline
  // BUG FIX: Only show athletes who are registered for the active discipline
  const unassignedathletes = activeDiscipline
    ? allathletes.filter(athlete => {
        // Check if athlete is registered for this discipline
        const isRegisteredForDiscipline = athlete.disciplines?.some(
          (d: any) => d.disciplineId === activeDiscipline
        )
        // Only include if registered AND not already assigned AND active
        return isRegisteredForDiscipline &&
               !isAthleteAssignedInDiscipline(athlete.id, activeDiscipline) &&
               athlete.isActive !== false // Filter out inactive athletes
      })
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

  // MEMOIZED: Sort and group time slots
  // PERFORMANCE: Only recalculates when time slots or active discipline changes
  const { sortedTimeSlots, timeSlotsByDate } = useMemo(() => {
    const sorted = [...filteredTimeSlots].sort((a, b) => {
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
    const byDate = sorted.reduce((acc, slot) => {
      // Extract date in YYYY-MM-DD format without timezone conversion
      const dateKey = new Date(slot.date).toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(slot)
      return acc
    }, {} as Record<string, any[]>)

    return { sortedTimeSlots: sorted, timeSlotsByDate: byDate }
  }, [filteredTimeSlots])

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
    
    const athlete = allathletes.find(s => s.id === activeId)
    setDraggedathlete(athlete)
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
        throw new Error(data.error || 'Failed to auto-assign athletes')
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
    
    setDraggedathlete(null)
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
    
    // Continue with athlete dragging logic below...
    if (activeId.startsWith('squad-')) return // Don't continue if it was a squad drag
    
    const athleteId = activeId // Use the activeId we already declared
    
    // Check if dropping on a squad
    if (targetId.startsWith('squad-')) {
      const squadId = targetId.replace('squad-', '')

      // Find the time slot for this squad
      const timeSlot = tournament.timeSlots.find(slot =>
        slot.squads.some((s: any) => s.id === squadId)
      )

      if (timeSlot) {
        // Check for time overlaps - block if conflict exists
        const overlapCheck = hasTimeOverlap(athleteId, timeSlot)

        if (overlapCheck.hasOverlap) {
          // Filter out overlaps that are in the same time slot (allow moving within same time slot)
          const realConflicts = overlapCheck.overlappingSlots.filter(info => {
            const existingSlot = info.timeSlot
            // Check if this is the exact same time slot (same date and time)
            const existingDateStr = new Date(existingSlot.date).toISOString().split('T')[0]
            const targetDateStr = new Date(timeSlot.date).toISOString().split('T')[0]

            const isSameTime =
              existingDateStr === targetDateStr &&
              existingSlot.startTime === timeSlot.startTime &&
              existingSlot.endTime === timeSlot.endTime

            // Only include this as a conflict if it's NOT the same time slot
            return !isSameTime
          })

          // Only show error if there are real conflicts (not just moving within same time slot)
          if (realConflicts.length > 0) {
            const overlapInfo = realConflicts.map(info => {
              const slot = info.timeSlot
              return `• ${slot.discipline.displayName} - ${slot.startTime} to ${slot.endTime} (${info.name})`
            }).join('\n')

            const errorMsg = `❌ CANNOT ASSIGN - TIME CONFLICT\n\nThis athlete is already assigned to:\n${overlapInfo}\n\nThese times overlap with ${timeSlot.startTime} to ${timeSlot.endTime}.\n\nPlease remove the athlete from the conflicting squad first.`

            alert(errorMsg)
            return
          }
        }
      }
      
      // Check if athlete is already in a squad at this time slot and remove them first
      const existingSquadAtThisTime = timeSlot.squads.find((squad: any) =>
        squad.members.some((member: any) => member.athleteId === athleteId)
      )

      // OPTIMISTIC UPDATE: Update local state immediately
      const previousState = structuredClone(tournament) // Fast deep clone for rollback

      setTournament(prevTournament => {
        const newTournament = structuredClone(prevTournament)

        // Find and remove athlete from ANY existing squad (across all time slots)
        for (const slot of newTournament.timeSlots) {
          for (const squad of slot.squads) {
            const memberIndex = squad.members.findIndex((m: any) => m.athleteId === athleteId)
            if (memberIndex !== -1) {
              squad.members.splice(memberIndex, 1)
            }
          }
        }

        // Add to new squad
        const targetTimeSlot = newTournament.timeSlots.find((slot: any) => slot.id === timeSlot.id)
        if (targetTimeSlot) {
          const targetSquad = targetTimeSlot.squads.find((s: any) => s.id === squadId)
          if (targetSquad) {
            const athlete = allathletes.find((a: any) => a.id === athleteId)
            if (athlete) {
              targetSquad.members.push({
                id: `temp-${Date.now()}`, // Temporary ID
                squadId,
                athleteId,
                athlete,
                createdAt: new Date(),
                updatedAt: new Date()
              })
            }
          }
        }

        return newTournament
      })

      setIsSaving(true)
      setError('')

      // Background sync with server
      try {
        // If athlete is in another squad at this time slot, remove them first
        if (existingSquadAtThisTime && existingSquadAtThisTime.id !== squadId) {
          const removeResponse = await fetch(`/api/squads/${existingSquadAtThisTime.id}/members`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ athleteId })
          })

          if (!removeResponse.ok) {
            const data = await removeResponse.json()
            throw new Error(data.error || 'Failed to remove athlete from previous squad')
          }
        }

        // Add athlete to new squad
        const response = await fetch(`/api/squads/${squadId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteId })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to assign athlete')
        }

        // Success - no need to update UI again, already done optimistically
      } catch (err: any) {
        // ROLLBACK: Restore previous state on error
        setTournament(previousState)
        setError(err.message || 'An error occurred')
        setTimeout(() => setError(''), 5000)
      } finally {
        setIsSaving(false)
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
        const overlapCheck = hasTimeOverlap(athleteId, timeSlot)

        if (overlapCheck.hasOverlap) {
          // Filter out overlaps that are in the same time slot (allow moving within same time slot)
          const realConflicts = overlapCheck.overlappingSlots.filter(info => {
            const existingSlot = info.timeSlot
            // Check if this is the exact same time slot (same date and time)
            const existingDateStr = new Date(existingSlot.date).toISOString().split('T')[0]
            const targetDateStr = new Date(timeSlot.date).toISOString().split('T')[0]

            const isSameTime =
              existingDateStr === targetDateStr &&
              existingSlot.startTime === timeSlot.startTime &&
              existingSlot.endTime === timeSlot.endTime

            // Only include this as a conflict if it's NOT the same time slot
            return !isSameTime
          })

          // Only show error if there are real conflicts (not just moving within same time slot)
          if (realConflicts.length > 0) {
            const overlapInfo = realConflicts.map(info => {
              const slot = info.timeSlot
              return `• ${slot.discipline.displayName} - ${slot.startTime} to ${slot.endTime} (${info.name})`
            }).join('\n')

            const errorMsg = `❌ CANNOT ASSIGN - TIME CONFLICT\n\nThis athlete is already assigned to:\n${overlapInfo}\n\nThese times overlap with ${timeSlot.startTime} to ${timeSlot.endTime}.\n\nPlease remove the athlete from the conflicting squad first.`

            alert(errorMsg)
            return
          }
        }
      }

      // Store pending squad creation data and show modal
      setPendingSquadCreation({
        timeSlotId,
        athleteId,
        disciplineId: timeSlot.disciplineId
      })
      setNewSquadName('')
      setShowCreateSquadModal(true)
      return
    }
  }

  const handleConfirmCreateSquad = async () => {
    if (!pendingSquadCreation || !newSquadName.trim() || !selectedTeamId) return

    const { timeSlotId, athleteId } = pendingSquadCreation

    // Build full squad name with team prefix
    let teamPrefix = 'Unknown'
    if (selectedTeamId === 'unaffiliated') {
      teamPrefix = 'Unaffiliated'
    } else if (userRole === 'coach' && coachedTeamId === selectedTeamId) {
      // For coaches, get team name from any athlete on their team
      const coachTeamAthlete = allathletes.find((a: any) => a.teamId === coachedTeamId)
      teamPrefix = coachTeamAthlete?.team?.name || 'Unknown'
    } else {
      // For admins, get from teams list
      teamPrefix = teams.find(t => t.id === selectedTeamId)?.name || 'Unknown'
    }
    const squadName = `${teamPrefix} - ${newSquadName.trim()}`

    // OPTIMISTIC UPDATE: Add squad and athlete to local state immediately
    const previousState = structuredClone(tournament)
    const tempSquadId = `temp-squad-${Date.now()}`
    const athlete = allathletes.find((a: any) => a.id === athleteId)

    // Create new squad object
    const newSquad = {
      id: tempSquadId,
      name: squadName,
      capacity: 5,
      timeSlotId,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: athlete ? [{
        id: `temp-member-${Date.now()}`,
        squadId: tempSquadId,
        athleteId,
        athlete,
        createdAt: new Date(),
        updatedAt: new Date()
      }] : []
    }

    // Fast update - only clone/update the specific timeslot, not entire tournament
    setTournament(prevTournament => ({
      ...prevTournament,
      timeSlots: prevTournament.timeSlots.map((slot: any) =>
        slot.id === timeSlotId
          ? { ...slot, squads: [...slot.squads, newSquad] }
          : slot
      )
    }))

    // Close modal AFTER optimistic update so UI updates instantly
    setShowCreateSquadModal(false)
    setPendingSquadCreation(null)
    setNewSquadName('')

    setLoading(true)
    setError('')
    setSuccess('')

    // Background sync with server
    try {
      // Create the squad
      const createResponse = await fetch(`/api/timeslots/${timeSlotId}/squads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: squadName,
          capacity: 5
        })
      })

      if (!createResponse.ok) {
        const data = await createResponse.json()
        throw new Error(data.error || 'Failed to create squad')
      }

      const newSquad = await createResponse.json()

      // Add athlete to the squad
      const addResponse = await fetch(`/api/squads/${newSquad.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId })
      })

      if (!addResponse.ok) {
        const data = await addResponse.json()
        throw new Error(data.error || 'Failed to add athlete to squad')
      }

      // Update local state with real IDs from server (fast shallow update)
      setTournament(prevTournament => ({
        ...prevTournament,
        timeSlots: prevTournament.timeSlots.map((slot: any) =>
          slot.id === timeSlotId
            ? {
                ...slot,
                squads: slot.squads.map((squad: any) =>
                  squad.id === tempSquadId
                    ? {
                        ...squad,
                        id: newSquad.id,
                        members: squad.members.map((member: any, idx: number) =>
                          idx === 0 ? { ...member, squadId: newSquad.id } : member
                        )
                      }
                    : squad
                )
              }
            : slot
        )
      }))

      setSuccess(`Squad "${squadName}" created and athlete assigned!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      // ROLLBACK: Restore previous state on error
      setTournament(previousState)
      setError(err.message || 'An error occurred')
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelCreateSquad = () => {
    setShowCreateSquadModal(false)
    setPendingSquadCreation(null)
    setNewSquadName('')
    setSelectedTeamId('')
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-sm text-gray-600 mt-0.5">Squad Management</p>
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md mb-3 text-sm">
            {success}
          </div>
        )}

        {/* Saving Indicator - Fixed position toast */}
        {isSaving && (
          <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-pulse">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </div>
        )}

        {/* Discipline Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-3">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-4" aria-label="Disciplines">
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
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition`}
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
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-xs text-gray-600">Total athletes</p>
                <p className="text-xl font-bold text-gray-900">{allathletes.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Unassigned</p>
                <p className="text-xl font-bold text-orange-600">{unassignedathletes.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Time Slots</p>
                <p className="text-xl font-bold text-gray-900">{sortedTimeSlots.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Squads</p>
                <p className="text-xl font-bold text-gray-900">
                  {sortedTimeSlots.reduce((sum, slot) => sum + slot.squads.length, 0)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-6 pl-6 border-l border-gray-200">
              {/* Auto-Assign Button */}
              <button
                onClick={handleAutoAssignClick}
                disabled={autoAssigning || unassignedathletes.length === 0}
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

              {/* Team Filter Toggle (Admins only - coaches always see only their team) */}
              {userRole === 'admin' && currentUser?.coachedTeam && (
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
      <div className="grid grid-cols-12 gap-4">
        {/* Unassigned athletes - Left Sidebar */}
        <div className="col-span-3">
          <Unassignedathletes athletes={unassignedathletes} currentDisciplineId={activeDiscipline} />
        </div>

        {/* Time Slots & Squads - Main Area */}
        <div className="col-span-9 space-y-4">
          {/* Add Time Slot Section */}
          {activeDiscipline && (
            <div className="bg-white rounded-lg shadow-md p-4">
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
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  {format(new Date(`${date}T12:00:00.000Z`), 'EEEE, MMMM d, yyyy')}
                </h2>
                <div className="space-y-3">
                  {(slots as any[]).map((timeSlot: any) => {
                    // Attach registration data to squad athletes
                    const enhancedTimeSlot = {
                      ...timeSlot,
                      squads: timeSlot.squads.map((squad: any) => ({
                        ...squad,
                        members: squad.members.map((member: any) => ({
                          ...member,
                          athlete: {
                            ...member.athlete,
                            disciplines: athleteRegistrationMap.get(member.athlete.id) || []
                          }
                        }))
                      }))
                    }

                    return (
                      <TimeSlotSection
                        key={timeSlot.id}
                        timeSlot={enhancedTimeSlot}
                        tournamentId={tournament.id}
                        onUpdate={() => router.refresh()}
                        userRole={userRole}
                        coachedTeamId={coachedTeamId}
                      />
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedathlete && (
          <div className="opacity-80">
            <AthleteCard athlete={draggedathlete} isDragging />
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
              Moving squad with {draggedSquad.members.length} {draggedSquad.members.length === 1 ? 'athlete' : 'athletes'}
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
                  This will automatically assign all unassigned athletes with teams to squads.
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
                        <p className="text-xs text-gray-600 mt-0.5">Athletes in the same division will be grouped together</p>
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
                            ? 'Will assign athletes to squads in all disciplines' 
                            : `Will only assign athletes to squads in ${tournamentDisciplines.find(d => d.id === activeDiscipline)?.displayName || 'the active discipline'}`
                          }
                        </p>
                      </div>
                    </label>

                    <div className="pt-3 border-t border-gray-200 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAssignOptions.includeathletesWithoutTeams}
                          onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, includeathletesWithoutTeams: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Include athletes without teams</span>
                          <p className="text-xs text-gray-600 mt-0.5">Assign athletes who are not on a team</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoAssignOptions.includeathletesWithoutDivisions}
                          onChange={(e) => setAutoAssignOptions(prev => ({ ...prev, includeathletesWithoutDivisions: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">Include athletes without divisions</span>
                          <p className="text-xs text-gray-600 mt-0.5">Assign athletes who don't have a division set</p>
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
                          <p className="text-xs text-gray-600 mt-0.5">Remove all current squads before auto-assigning. If unchecked, only unassigned athletes will be added to available squads.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Unassigned athletes:</span>
                      <span className="font-semibold text-gray-900">{unassignedathletes.length}</span>
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
                    <span>Only unassigned athletes will be added. Existing squads will be preserved, and athletes will not be assigned if it would violate time conflict or squad rules.</span>
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

      {/* Create Squad Modal */}
      {showCreateSquadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Create New Squad
                </h3>
                <button
                  onClick={handleCancelCreateSquad}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <p className="text-gray-700">
                  Create a new squad. The athlete will be automatically assigned to this squad.
                </p>

                {/* Team Selection (Admin only) */}
                {userRole === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select team...</option>
                      <option value="unaffiliated">Unaffiliated</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Team Display (Coach only) */}
                {userRole === 'coach' && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-indigo-900">Team</div>
                    <div className="text-lg font-semibold text-indigo-700 mt-1">
                      {(() => {
                        const coachTeamAthlete = allathletes.find((a: any) => a.teamId === coachedTeamId)
                        return coachTeamAthlete?.team?.name || 'Your Team'
                      })()}
                    </div>
                  </div>
                )}

                {/* Squad Name Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Division & Number
                  </label>
                  <select
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus={userRole === 'coach'}
                  >
                    <option value="">Select division and number...</option>
                    {squadNameOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Squad Name Preview */}
                {newSquadName && selectedTeamId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-green-700 mb-1">Full Squad Name:</div>
                    <div className="text-base font-bold text-green-900">
                      {(() => {
                        let teamPrefix = 'Unknown'
                        if (selectedTeamId === 'unaffiliated') {
                          teamPrefix = 'Unaffiliated'
                        } else if (userRole === 'coach' && coachedTeamId === selectedTeamId) {
                          const coachTeamAthlete = allathletes.find((a: any) => a.teamId === coachedTeamId)
                          teamPrefix = coachTeamAthlete?.team?.name || 'Unknown'
                        } else {
                          teamPrefix = teams.find(t => t.id === selectedTeamId)?.name || 'Unknown'
                        }
                        return `${teamPrefix} - ${newSquadName}`
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelCreateSquad}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCreateSquad}
                  disabled={loading || !newSquadName.trim() || !selectedTeamId}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Creating...' : 'Create Squad'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  )
}

