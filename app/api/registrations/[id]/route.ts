import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'



interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Check if registration has scores
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    // Check if user is coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can check registration details' },
        { status: 403 }
      )
    }

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        athlete: {
          include: {
            shoots: {
              where: {
                tournamentId: {
                  // We need to get the tournament ID from the registration
                }
              }
            }
          }
        },
        tournament: true
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Count shoots for this tournament and athlete
    const shootCount = await prisma.shoot.count({
      where: {
        tournamentId: registration.tournamentId,
        athleteId: registration.athleteId
      }
    })

    return NextResponse.json({
      hasScores: shootCount > 0,
      shootCount
    })
  } catch (error) {
    console.error('Registration check error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete registration
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const url = new URL(request.url)
    const deleteScores = url.searchParams.get('deleteScores') === 'true'
    
    // Check if user is coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can remove registrations' },
        { status: 403 }
      )
    }

    // Fetch registration with tournament info
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        athlete: {
          include: {
            team: true
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // If user is coach (not admin), verify they have permission
    if (user.role === 'coach') {
      // Coach can remove if:
      // 1. They're the tournament creator, OR
      // 2. The athlete is on their team
      const isTournamentCreator = registration.tournament.createdById === user.id
      const { isUserCoachOfTeam: checkCoach } = await import('@/lib/teamHelpers')
      const isShooterOnTheirTeam = registration.athlete.team ? await checkCoach(user.id, registration.athlete.team.id) : false
      
      if (!isTournamentCreator && !isShooterOnTheirTeam) {
        return NextResponse.json(
          { error: 'You can only remove shooters from your own tournaments or shooters on your team' },
          { status: 403 }
        )
      }
    }

    // If deleteScores is true, also delete all shoots and scores
    if (deleteScores) {
      await prisma.shoot.deleteMany({
        where: {
          tournamentId: registration.tournamentId,
          athleteId: registration.athleteId
        }
      })
    }

    // Delete the registration (cascade will delete RegistrationDiscipline records)
    await prisma.registration.delete({
      where: { id }
    })
    
    return NextResponse.json({ 
      message: 'Registration removed successfully',
      deletedScores: deleteScores
    })
  } catch (error) {
    console.error('Registration deletion error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to remove registrations' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

