import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { tournamentId, athleteIds, disciplineIds } = await request.json()
    
    // Validate input
    if (!tournamentId || !athleteIds || !Array.isArray(athleteIds) || athleteIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid shooter list' },
        { status: 400 }
      )
    }
    
    if (!disciplineIds || disciplineIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one discipline' },
        { status: 400 }
      )
    }
    
    // Verify the user is a coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can perform bulk registration' },
        { status: 403 }
      )
    }

    // Fetch athletes to check active status
    const athletes = await prisma.athlete.findMany({
      where: {
        id: { in: athleteIds }
      },
      select: {
        id: true,
        isActive: true
      }
    })

    // Filter out inactive athletes
    const activeAthleteIds = athletes
      .filter(a => a.isActive !== false)
      .map(a => a.id)

    const inactiveCount = athleteIds.length - activeAthleteIds.length

    // Check which athletes are already registered
    const existingRegistrations = await prisma.registration.findMany({
      where: {
        tournamentId,
        athleteId: {
          in: activeAthleteIds
        }
      },
      select: {
        athleteId: true
      }
    })

    const existingShooterIds = existingRegistrations.map((r: { athleteId: string }) => r.athleteId)
    const newShooterIds = activeAthleteIds.filter((id: string) => !existingShooterIds.includes(id))
    
    // Fetch full athlete info including team to auto-register teams
    const athletesWithTeams = await prisma.athlete.findMany({
      where: {
        id: { in: newShooterIds }
      },
      include: {
        team: true
      }
    })

    // Auto-register teams that aren't already registered
    const teamIds = [...new Set(athletesWithTeams.map(a => a.teamId).filter(Boolean))] as string[]
    for (const teamId of teamIds) {
      try {
        // Check if team is already registered
        const existingTeamReg = await prisma.teamTournamentRegistration.findUnique({
          where: {
            teamId_tournamentId: {
              teamId,
              tournamentId
            }
          }
        })

        // Auto-register team if not already registered
        if (!existingTeamReg) {
          await prisma.teamTournamentRegistration.create({
            data: {
              teamId,
              tournamentId,
              registeredBy: user.id
            }
          })
        }
      } catch (error) {
        // Continue even if team registration fails - team may already be registered
      }
    }

    // Create registrations for athletes who aren't already registered with disciplines
    let successCount = 0
    for (const athleteId of newShooterIds) {
      try {
        await prisma.registration.create({
          data: {
            tournamentId,
            athleteId,
            disciplines: {
              create: disciplineIds.map((disciplineId: string) => ({
                disciplineId,
                assignedBy: user.id // Coach assigned
              }))
            }
          }
        })
        successCount++
      } catch (error) {
        // Skip if already exists (race condition)
      }
    }
    
    const message = inactiveCount > 0
      ? `Successfully registered ${successCount} shooter(s). ${inactiveCount} inactive athlete(s) were skipped.`
      : `Successfully registered ${successCount} shooter(s)`

    return NextResponse.json({
      message,
      registered: successCount,
      alreadyRegistered: existingShooterIds.length,
      inactive: inactiveCount,
      total: athleteIds.length
    }, { status: 201 })
  } catch (error) {
    console.error('Bulk registration error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to register shooters' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

