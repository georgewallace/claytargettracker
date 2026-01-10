// @ts-nocheck - Complex Prisma types with dynamic includes
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

interface AutoAssignOptions {
  keepTeamsTogether: boolean
  keepDivisionsTogether: boolean
  keepTeamsCloseInTime: boolean
  deleteExistingSquads: boolean
  includeAthletesWithoutTeams: boolean
  includeAthletesWithoutDivisions: boolean
  activeDisciplineId?: string | null
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params
    
    // Only coaches and admins can auto-assign squads
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Parse options from request body
    const options: AutoAssignOptions = await request.json().catch(() => ({
      keepTeamsTogether: true,
      keepDivisionsTogether: true,
      keepTeamsCloseInTime: false,
      deleteExistingSquads: false,
      includeAthletesWithoutTeams: false,
      includeAthletesWithoutDivisions: false
    }))

    // Get all registered athletes (filter by team/division based on options)
    const whereClause: any = {
      tournamentId
    }
    
    // Build athlete filter based on options
    const athleteFilter: any = {}
    if (!options.includeAthletesWithoutTeams) {
      athleteFilter.teamId = { not: null }
    }
    if (!options.includeAthletesWithoutDivisions) {
      athleteFilter.division = { not: null }
    }
    
    // Only apply athlete filter if there are conditions
    if (Object.keys(athleteFilter).length > 0) {
      whereClause.athlete = athleteFilter
    }
    
    const registrations = await prisma.registration.findMany({
      where: whereClause,
      include: {
        athlete: {
          include: {
            user: true,
            team: true
          }
        },
        disciplines: {
          include: {
            discipline: true
          }
        }
      }
    })

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: 'No registered athletes with teams found' },
        { status: 400 }
      )
    }

    // Get all time slots with their squads and disciplines
    // Filter by active discipline if specified
    const timeSlotWhere: any = { tournamentId }
    if (options.activeDisciplineId) {
      timeSlotWhere.disciplineId = options.activeDisciplineId
    }
    
    const timeSlots = await prisma.timeSlot.findMany({
      where: timeSlotWhere,
      include: {
        discipline: true,
        squads: {
          include: {
            members: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    })

    if (timeSlots.length === 0) {
      return NextResponse.json(
        { error: 'No time slots available. Please create time slots first.' },
        { status: 400 }
      )
    }

    // Get tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        disciplines: {
          include: {
            discipline: true
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Conditionally clear existing squad members and squads
    if (options.deleteExistingSquads) {
      await prisma.squadMember.deleteMany({
        where: {
          squad: {
            timeSlot: {
              tournamentId
            }
          }
        }
      })

      await prisma.squad.deleteMany({
        where: {
          timeSlot: {
            tournamentId
          }
        }
      })
    }

    let assignmentsMade = 0
    const assignments: any[] = []
    const unassignedReasons: Record<string, { athleteName: string, teamName: string, reason: string }[]> = {}

    // Helper function to check if assigning a athlete to a time slot would create a time conflict
    const hasTimeConflict = (athleteId: string, targetTimeSlot: any, existingAssignments: any[]): boolean => {
      const athleteAssignments = existingAssignments.filter(a => a.athleteId === athleteId)
      
      for (const assignment of athleteAssignments) {
        const assignedSlot = timeSlots.find(ts => ts.id === assignment.timeSlotId)
        if (!assignedSlot) continue
        
        // Check if same date
        const targetDate = targetTimeSlot.date.toISOString().split('T')[0]
        const assignedDate = assignedSlot.date.toISOString().split('T')[0]
        
        if (targetDate === assignedDate) {
          // Check if times overlap
          const targetStart = targetTimeSlot.startTime
          const targetEnd = targetTimeSlot.endTime
          const assignedStart = assignedSlot.startTime
          const assignedEnd = assignedSlot.endTime
          
          // Times overlap if one starts before the other ends
          if (
            (targetStart < assignedEnd && targetEnd > assignedStart) ||
            (assignedStart < targetEnd && assignedEnd > targetStart)
          ) {
            return true
          }
        }
      }
      
      return false
    }

    // Helper to check if athlete is already assigned (from DB or temp assignments)
    const isAthleteAssigned = async (athleteId: string, disciplineId: string): Promise<boolean> => {
      if (assignments.find(a => a.athleteId === athleteId && a.disciplineId === disciplineId)) {
        return true
      }
      
      if (!options.deleteExistingSquads) {
        const existingMember = await prisma.squadMember.findFirst({
          where: {
            athleteId,
            squad: {
              timeSlot: {
                disciplineId,
                tournamentId
              }
            }
          }
        })
        return !!existingMember
      }
      
      return false
    }

    // Group athletes by discipline, then by team/division based on options
    interface AthleteGroup {
      key: string
      athletes: any[]
      teamId: string | null
      division: string | null
    }
    const athleteGroups: Record<string, AthleteGroup[]> = {}
    
    for (const reg of registrations) {
      for (const regDisc of reg.disciplines) {
        const disciplineId = regDisc.discipline.id
        
        // Skip if we're only assigning for a specific discipline and this isn't it
        if (options.activeDisciplineId && disciplineId !== options.activeDisciplineId) {
          continue
        }
        
        if (!athleteGroups[disciplineId]) {
          athleteGroups[disciplineId] = []
        }
        
        // Skip if already assigned
        if (await isAthleteAssigned(reg.athlete.id, disciplineId)) {
          continue
        }
        
        // Find the appropriate group for this athlete
        let groupKey = 'default'
        if (options.keepTeamsTogether && options.keepDivisionsTogether) {
          groupKey = `${reg.athlete.teamId || 'noteam'}_${reg.athlete.division || 'nodiv'}`
        } else if (options.keepTeamsTogether) {
          groupKey = reg.athlete.teamId || 'noteam'
        } else if (options.keepDivisionsTogether) {
          groupKey = reg.athlete.division || 'nodiv'
        }
        
        // Find or create the group
        let group = athleteGroups[disciplineId].find(g => g.key === groupKey)
        if (!group) {
          group = { key: groupKey, athletes: [], teamId: reg.athlete.teamId, division: reg.athlete.division }
          athleteGroups[disciplineId].push(group)
        }
        
        group.athletes.push(reg.athlete)
      }
    }

    // For each discipline, assign groups to time slots
    for (const [disciplineId, groups] of Object.entries(athleteGroups)) {
      // Get time slots for this discipline
      let disciplineTimeSlots = timeSlots.filter(ts => ts.disciplineId === disciplineId)
      
      // Sort time slots by date and time if keepTeamsCloseInTime is enabled
      if (options.keepTeamsCloseInTime) {
        disciplineTimeSlots.sort((a, b) => {
          const dateCompare = a.date.getTime() - b.date.getTime()
          if (dateCompare !== 0) return dateCompare
          return a.startTime.localeCompare(b.startTime)
        })
      }
      
      if (disciplineTimeSlots.length === 0) continue

      // Get the discipline name to determine assignment logic
      const disciplineName = disciplineTimeSlots[0].discipline.name
      const squadCapacity = disciplineTimeSlots[0].squadCapacity || 5

      // Check if this is a single-squad discipline (5-stand, skeet)
      const isSingleSquadDiscipline = disciplineName === 'five_stand' || disciplineName === 'skeet'
      // Trap also has one squad per field per time slot
      const isTrap = disciplineName === 'trap'

      // Process each group
      let timeSlotIndex = 0
      
      for (const group of groups) {
        // For keep teams/divisions together, try to keep the group in the same squad
        if (options.keepTeamsTogether || options.keepDivisionsTogether) {
          // Try to fit the entire group in one squad
          let groupAssigned = false
          let failureReason = ''
          
          for (let tsIndex = timeSlotIndex; tsIndex < disciplineTimeSlots.length; tsIndex++) {
            const timeSlot = disciplineTimeSlots[tsIndex]
            
            // Check if all athletes in group can be assigned to this time slot (no time conflicts)
            const allCanAssign = group.athletes.every((athlete: any) =>
              !hasTimeConflict(athlete.id, timeSlot, assignments)
            )
            
            if (!allCanAssign) {
              failureReason = 'Time conflict with other assignments'
              continue
            }

            // Get existing squads for this time slot
            let existingSquads = await prisma.squad.findMany({
              where: { timeSlotId: timeSlot.id },
              include: { members: true }
            })

            // For single-squad disciplines (5-Stand, Skeet), only one squad per time slot
            if (isSingleSquadDiscipline) {
              // Skip if a squad already exists - only one squad allowed per time slot
              if (existingSquads.length > 0) {
                // Check if we can add to the existing squad
                const existingSquad = existingSquads[0]
                if (existingSquad.members.length + group.athletes.length > squadCapacity) {
                  failureReason = `Squad at this time slot is full (${existingSquad.members.length}/${squadCapacity})`
                  continue // This time slot can't fit the group
                }
                // If squad is full or nearly full, skip to next time slot
                if (existingSquad.members.length >= squadCapacity) {
                  failureReason = `Squad at this time slot is full (${existingSquad.members.length}/${squadCapacity})`
                  continue
                }
              }
            } else if (isTrap) {
              // One squad per field - check if we can use this field
              const fieldNumber = timeSlot.fieldNumber
              const fieldSquads = existingSquads.filter(s => s.name.includes(fieldNumber || ''))
              if (fieldSquads.length > 0) {
                const fieldSquad = fieldSquads[0]
                if (fieldSquad.members.length + group.athletes.length > squadCapacity || fieldSquad.members.length >= squadCapacity) {
                  failureReason = `${fieldNumber} squad is full (${fieldSquad.members.length}/${squadCapacity})`
                  continue
                }
              }
            }

            // Find or create appropriate squad
            // Must check: 1) Has capacity, 2) If teamOnly, must match team, 3) Discipline rules
            let targetSquad = existingSquads.find(s => {
              const hasCapacity = s.members.length + group.athletes.length <= squadCapacity
              if (!hasCapacity) {
                failureReason = `No squads with enough capacity (need ${group.athletes.length} spots)`
                return false
              }
              
              // If squad is team-only, check if all athletes in group are from the same team
              if (s.teamOnly && s.members.length > 0) {
                // Get the team ID of the first member in the squad
                const squadTeamId = s.members[0]?.athlete?.teamId
                // Check if all athletes in the group match this team
                const allMatch = group.athletes.every((athlete: any) => athlete.teamId === squadTeamId)
                if (!allMatch) {
                  failureReason = 'All available squads are team-only for different teams'
                }
                return allMatch
              }
              
              return true
            })
            
            if (!targetSquad) {
              // For single-squad disciplines, don't create a second squad
              if (isSingleSquadDiscipline && existingSquads.length > 0) {
                failureReason = `Only one squad allowed per time slot for ${disciplineName} (already exists)`
                continue // Skip this time slot, can't create another squad
              }

              // For Trap, don't create a second squad for the same field
              if (isTrap && timeSlot.fieldNumber) {
                const fieldSquads = existingSquads.filter(s => s.name.includes(timeSlot.fieldNumber || ''))
                if (fieldSquads.length > 0) {
                  failureReason = `${timeSlot.fieldNumber} already has a squad (Trap allows one per field)`
                  continue // Skip this time slot, field already has a squad
                }
              }

              // PERMISSION CHECK: Coaches cannot create multiple squads in the same timeslot
              if (user.role === 'coach' && existingSquads.length > 0) {
                failureReason = 'Only admins can create additional squads in a timeslot (coaches can only use existing squads)'
                continue // Skip this time slot, coaches can't create additional squads
              }

              // Create new squad
              const squadNumber = existingSquads.length + 1
              const squadName = isTrap && timeSlot.fieldNumber
                ? `${timeSlot.fieldNumber} Squad ${squadNumber}`
                : `Squad ${squadNumber}`

              targetSquad = await prisma.squad.create({
                data: {
                  timeSlotId: timeSlot.id,
                  name: squadName,
                  capacity: squadCapacity,
                  teamOnly: options.keepTeamsTogether
                },
                include: { members: true }
              })
            }

            // Assign all athletes in the group to this squad
            for (const athlete of group.athletes) {
              await prisma.squadMember.create({
                data: {
                  squadId: targetSquad.id,
                  athleteId: athlete.id,
                  position: targetSquad.members.length + 1
                }
              })

              assignments.push({
                athleteId: athlete.id,
                disciplineId,
                squadId: targetSquad.id,
                timeSlotId: timeSlot.id
              })

              assignmentsMade++
            }

            groupAssigned = true
            if (options.keepTeamsCloseInTime) {
              timeSlotIndex = tsIndex // Keep subsequent groups close in time
            }
            break
          }
          
          // Track unassigned athletes
          if (!groupAssigned) {
            const disciplineName = disciplineTimeSlots[0]?.discipline?.displayName || disciplineId
            if (!unassignedReasons[disciplineName]) {
              unassignedReasons[disciplineName] = []
            }
            for (const athlete of group.athletes) {
              unassignedReasons[disciplineName].push({
                athleteName: athlete.user.name,
                teamName: athlete.team?.name || 'No Team',
                reason: failureReason || 'No available time slots'
              })
            }
          }
          
          // If group couldn't be assigned as a unit and we're not strict, assign individually
          if (!groupAssigned && !options.keepTeamsTogether && !options.keepDivisionsTogether) {
            for (const athlete of group.athletes) {
              // Try to assign this individual athletes
              for (let tsIndex = 0; tsIndex < disciplineTimeSlots.length; tsIndex++) {
                const timeSlot = disciplineTimeSlots[tsIndex]
                
                if (hasTimeConflict(athlete.id, timeSlot, assignments)) continue

                let existingSquads = await prisma.squad.findMany({
                  where: { timeSlotId: timeSlot.id },
                  include: { members: true }
                })

                let targetSquad = existingSquads.find(s => s.members.length < squadCapacity)

                if (!targetSquad) {
                  // PERMISSION CHECK: Coaches cannot create multiple squads in the same timeslot
                  if (user.role === 'coach' && existingSquads.length > 0) {
                    continue // Skip this athlete, coaches can't create additional squads
                  }

                  const squadNumber = existingSquads.length + 1
                  const squadName = isTrap && timeSlot.fieldNumber
                    ? `${timeSlot.fieldNumber} Squad ${squadNumber}`
                    : `Squad ${squadNumber}`

                  targetSquad = await prisma.squad.create({
                    data: {
                      timeSlotId: timeSlot.id,
                      name: squadName,
                      capacity: squadCapacity,
                      teamOnly: false
                    },
                    include: { members: true }
                  })
                }

                await prisma.squadMember.create({
                  data: {
                    squadId: targetSquad.id,
                    athleteId: athlete.id,
                    position: targetSquad.members.length + 1
                  }
                })

                assignments.push({
                  athleteId: athlete.id,
                  disciplineId,
                  squadId: targetSquad.id,
                  timeSlotId: timeSlot.id
                })

                assignmentsMade++
                break
              }
            }
          }
        } else {
          // Not keeping teams/divisions together, assign individually
          for (const athlete of group.athletes) {
            for (let tsIndex = 0; tsIndex < disciplineTimeSlots.length; tsIndex++) {
              const timeSlot = disciplineTimeSlots[tsIndex]
              
              if (hasTimeConflict(athlete.id, timeSlot, assignments)) continue

              let existingSquads = await prisma.squad.findMany({
                where: { timeSlotId: timeSlot.id },
                include: { members: true }
              })

              let targetSquad = existingSquads.find(s => s.members.length < squadCapacity)

              if (!targetSquad) {
                // PERMISSION CHECK: Coaches cannot create multiple squads in the same timeslot
                if (user.role === 'coach' && existingSquads.length > 0) {
                  continue // Skip this athlete, coaches can't create additional squads
                }

                const squadNumber = existingSquads.length + 1
                const squadName = isTrap && timeSlot.fieldNumber
                  ? `${timeSlot.fieldNumber} Squad ${squadNumber}`
                  : `Squad ${squadNumber}`

                targetSquad = await prisma.squad.create({
                  data: {
                    timeSlotId: timeSlot.id,
                    name: squadName,
                    capacity: squadCapacity,
                    teamOnly: false
                  },
                  include: { members: true }
                })
              }

              await prisma.squadMember.create({
                data: {
                  squadId: targetSquad.id,
                  athleteId: athlete.id,
                  position: targetSquad.members.length + 1
                }
              })

              assignments.push({
                athleteId: athlete.id,
                disciplineId,
                squadId: targetSquad.id,
                timeSlotId: timeSlot.id
              })

              assignmentsMade++
              break
            }
          }
        }
      }
    }

    // Build detailed response message
    let responseMessage = `Successfully assigned ${assignmentsMade} athlete${assignmentsMade !== 1 ? 's' : ''} to squads`
    const unassignedCount = Object.values(unassignedReasons).reduce((sum, arr) => sum + arr.length, 0)
    
    if (unassignedCount > 0) {
      responseMessage += `. ${unassignedCount} athlete${unassignedCount !== 1 ? 's' : ''} could not be assigned.`
    }

    return NextResponse.json({
      message: responseMessage,
      assignmentsMade,
      squadsCreated: assignments.length,
      unassignedAthletes: unassignedReasons,
      hasUnassigned: unassignedCount > 0
    }, { status: 200 })

  } catch (error) {
    console.error('Auto-assign error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to auto-assign squads',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
