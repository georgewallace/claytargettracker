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
        name: reg.team.name,
        affiliation: reg.team.affiliation,
        athleteCount: reg.team.athletes.length,
        registeredCount: registeredAthletes.length,
        isIndividualTeam: reg.team.isIndividualTeam
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

      // Format birth date
      let birthDate = 'N/A'
      if (athlete.birthYear && athlete.birthMonth && athlete.birthDay) {
        birthDate = `${athlete.birthMonth}/${athlete.birthDay}/${athlete.birthYear}`
      } else if (athlete.birthYear && athlete.birthMonth) {
        birthDate = `${athlete.birthMonth}/${athlete.birthYear}`
      }

      // Collect disciplines
      const disciplines = reg.disciplines
        .map(d => d.discipline.displayName)
        .join(', ')

      return {
        athleteName: athlete.user.name,
        email: athlete.user.email,
        teamName: athlete.team?.name || 'N/A',
        gender: athlete.gender,
        birthDate,
        grade: athlete.grade,
        division: reg.division,
        nscaClass: athlete.nscaClass,
        ataClass: athlete.ataClass,
        disciplines,
        registrationDate: reg.createdAt.toISOString().split('T')[0],
        isActive: athlete.isActive
      }
    })

    // Fetch all squad assignments with time slot details
    const squadAssignments = await prisma.squadMember.findMany({
      where: {
        squad: {
          tournamentId
        }
      },
      include: {
        squad: {
          include: {
            discipline: true,
            timeSlot: true
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
      const registration = assignment.athlete.registrations[0]

      return {
        squadName: assignment.squad.name,
        discipline: assignment.squad.discipline.displayName,
        date: assignment.squad.timeSlot?.date
          ? new Date(assignment.squad.timeSlot.date).toISOString().split('T')[0]
          : 'N/A',
        startTime: assignment.squad.timeSlot?.startTime || 'N/A',
        endTime: assignment.squad.timeSlot?.endTime || 'N/A',
        location: assignment.squad.timeSlot?.location,
        athleteName: assignment.athlete.user.name,
        teamName: assignment.athlete.team?.name || 'N/A',
        division: registration?.division,
        position: assignment.position
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
