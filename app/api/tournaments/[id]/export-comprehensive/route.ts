import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params

    // Fetch tournament to verify it exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Fetch all registered teams with athlete counts
    const teamRegistrations = await prisma.teamTournamentRegistration.findMany({
      where: { tournamentId },
      include: {
        team: {
          include: {
            athletes: {
              include: {
                registrations: {
                  where: { tournamentId }
                }
              }
            }
          }
        }
      }
    })

    const teams = teamRegistrations.map(reg => {
      const registeredAthletes = reg.team.athletes.filter(
        athlete => athlete.registrations.length > 0
      )
      return {
        // Primary columns in requested order
        'Team Name': reg.team.name,
        'Head Coach': reg.team.headCoach || '',
        'Email': reg.team.headCoachEmail || '',
        'Address': reg.team.address || '',
        'City': reg.team.city || '',
        'State': reg.team.state || '',
        'ZIP': reg.team.zip || '',
        'Phone': reg.team.headCoachPhone || '',
        'Team Affiliation': reg.team.affiliation || '',

        // Additional columns
        'Total Athletes': reg.team.athletes.length,
        'Registered Athletes': registeredAthletes.length,
        'Team Type': reg.team.isIndividualTeam ? 'Individual' : 'Team'
      }
    })

    // Fetch all registered participants with full details
    const registrations = await prisma.registration.findMany({
      where: { tournamentId },
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

    const participants = registrations.map(reg => {
      const athlete = reg.athlete

      // Format birth date (MM/DD/YYYY)
      let birthDate = ''
      if (athlete.birthYear && athlete.birthMonth && athlete.birthDay) {
        const month = String(athlete.birthMonth).padStart(2, '0')
        const day = String(athlete.birthDay).padStart(2, '0')
        birthDate = `${month}/${day}/${athlete.birthYear}`
      }

      // Check which disciplines they're registered for
      const registeredDisciplines = reg.disciplines.map(d => d.discipline.name)
      const hasSkeet = registeredDisciplines.includes('skeet') ? 'Yes' : 'No'
      const hasTrap = registeredDisciplines.includes('trap') ? 'Yes' : 'No'
      const hasSportingClays = registeredDisciplines.includes('sporting_clays') ? 'Yes' : 'No'

      // Format grade as numerical value
      let gradeValue: string | number = ''
      if (athlete.grade) {
        const gradeLower = athlete.grade.toLowerCase()
        // Handle legacy 'K' value
        if (gradeLower === 'k') {
          gradeValue = 0
        }
        // Keep Collegiate as string
        else if (gradeLower === 'collegiate' || gradeLower === 'college') {
          gradeValue = 'Collegiate'
        }
        // Parse as number
        else {
          const gradeNum = parseInt(athlete.grade, 10)
          gradeValue = !isNaN(gradeNum) ? gradeNum : athlete.grade
        }
      }

      return {
        // Primary columns in requested order
        'Shooter ID': athlete.shooterId || '',
        'First Name': athlete.user.firstName || '',
        'Last Name': athlete.user.lastName || '',
        'Birthdate': birthDate,
        'Sex': athlete.gender || '',
        'Contact Phone #': athlete.user.phone || '',
        'Contact Email': athlete.user.email,
        'Shooting Team': athlete.team?.name || '',
        'Age Concurrent': athlete.divisionOverride || athlete.division || '',
        'Skeet': hasSkeet === 'Yes' ? 'Y' : 'N',
        'Trap': hasTrap === 'Yes' ? 'Y' : 'N',
        'Sporting Clays': hasSportingClays === 'Yes' ? 'Y' : 'N',
        'Skeet Class': athlete.nssaClass || '',
        'Trap Class': athlete.ataClass || '',
        'Sporting Class': athlete.nscaClass || '',

        // Additional columns
        'Grade': gradeValue,
        'Registration Date': reg.createdAt.toISOString().split('T')[0],
        'Status': athlete.isActive ? 'Active' : 'Inactive'
      }
    })

    // Fetch all squad assignments with time slot details
    const squadAssignments = await prisma.squadMember.findMany({
      where: {
        squad: {
          timeSlot: {
            tournamentId
          }
        }
      },
      include: {
        squad: {
          include: {
            team: true,
            timeSlot: {
              include: {
                discipline: true
              }
            },
            members: {
              include: {
                athlete: true
              }
            }
          }
        },
        athlete: {
          include: {
            user: true,
            team: true,
            registrations: {
              where: { tournamentId }
            }
          }
        }
      },
      orderBy: [
        { squad: { timeSlot: { date: 'asc' } } },
        { squad: { timeSlot: { startTime: 'asc' } } },
        { position: 'asc' }
      ]
    }) as any[]

    const squads = squadAssignments.map(assignment => {
      const disciplineName = assignment.squad.timeSlot.discipline.name

      // Map discipline name to display format (only show Skeet for skeet discipline, empty otherwise)
      const disciplineDisplay = disciplineName === 'skeet' ? 'Skeet' :
                                disciplineName === 'trap' ? 'Trap' :
                                disciplineName === 'sporting_clays' ? 'Sporting Clays' : ''

      // Parse team name and concurrent squad from squad name
      // Format: "Team Name - Division N" or "Unaffiliated - Division N"
      const squadName = assignment.squad.name
      const parts = squadName.split(' - ')
      const teamName = parts.length > 1 ? parts[0] : 'Unaffiliated'
      const concurrentSquad = parts.length > 1 ? parts.slice(1).join(' - ') : squadName

      // Team Concurrent is Concurrent Squad with last 2 characters removed
      // Example: "Varsity 1" → "Varsity"
      const teamConcurrent = concurrentSquad ? concurrentSquad.slice(0, -2) : ''

      // Construct full name
      const firstName = assignment.athlete.user.firstName || ''
      const lastName = assignment.athlete.user.lastName || ''
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : assignment.athlete.user.name

      return {
        // Primary columns in requested order
        'Shooter ID': assignment.athlete.shooterId || '',
        'Team': teamName,
        'First Name': firstName,
        'Last Name': lastName,
        'Full Name': fullName,
        'Participant Concurrent': assignment.athlete.divisionOverride || assignment.athlete.division || '',
        'Skeet': disciplineDisplay,
        'Concurrent Squad': concurrentSquad,
        'Squad Position': assignment.position || '',
        'Shooting Time': assignment.squad.timeSlot.startTime || '',

        // Additional columns
        'End Time': assignment.squad.timeSlot.endTime || '',
        'Field/Station': assignment.squad.timeSlot.fieldNumber || assignment.squad.timeSlot.stationNumber || '',
        'Team Concurrent': teamConcurrent
      }
    })

    return NextResponse.json({
      teams,
      participants,
      squads
    })
  } catch (error) {
    console.error('Export comprehensive error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to export data' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
