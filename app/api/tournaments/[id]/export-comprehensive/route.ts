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
        'Team ID': reg.team.id,
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

      // Construct full name
      const firstName = athlete.user.firstName || ''
      const lastName = athlete.user.lastName || ''
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : athlete.user.name

      return {
        // Primary columns in requested order
        'Shooter ID': athlete.shooterId || '',
        'First Name': firstName,
        'Last Name': lastName,
        'Full Name': fullName,
        'Birthdate': birthDate,
        'Sex': athlete.gender || '',
        'Skeet Event': hasSkeet === 'Yes' ? 'Y' : 'N',
        'Trap Event': hasTrap === 'Yes' ? 'Y' : 'N',
        'Sporting Event': hasSportingClays === 'Yes' ? 'Y' : 'N',
        'Total Amount': '',
        'Paid': '',
        'Shooting Team': athlete.team?.name || '',
        'Age Concurrent': athlete.divisionOverride || athlete.division || '',

        // Additional columns
        'Contact Phone #': athlete.user.phone || '',
        'Contact Email': athlete.user.email,
        'Grade': athlete.grade || '',
        'NSSA Class': athlete.nssaClass || '',
        'ATA Class': athlete.ataClass || '',
        'NSCA Class': athlete.nscaClass || '',
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
    })

    const squads = squadAssignments.map(assignment => {
      const disciplineName = assignment.squad.timeSlot.discipline.name

      // Map discipline name to display format (only show Skeet for skeet discipline, empty otherwise)
      const disciplineDisplay = disciplineName === 'skeet' ? 'Skeet' :
                                disciplineName === 'trap' ? 'Trap' :
                                disciplineName === 'sporting_clays' ? 'Sporting Clays' : ''

      // Determine if squad has mixed divisions
      const squadDivisions = assignment.squad.members
        .map(m => m.athlete.divisionOverride || m.athlete.division)
        .filter(Boolean)
      const uniqueDivisions = [...new Set(squadDivisions)]

      // Team Concurrent should be the division if same division, "Open" if mixed
      const teamConcurrent = uniqueDivisions.length > 1
        ? 'Open'
        : (uniqueDivisions[0] || '')

      // Construct full name
      const firstName = assignment.athlete.user.firstName || ''
      const lastName = assignment.athlete.user.lastName || ''
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : assignment.athlete.user.name

      return {
        // Primary columns in requested order
        'Shooter ID': assignment.athlete.shooterId || '',
        'Team': assignment.athlete.team?.name || '',
        'First Name': firstName,
        'Last Name': lastName,
        'Full Name': fullName,
        'Participant Concurrent': assignment.athlete.divisionOverride || assignment.athlete.division || '',
        'Skeet': disciplineDisplay,
        'Concurrent Squad': assignment.squad.name,
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
