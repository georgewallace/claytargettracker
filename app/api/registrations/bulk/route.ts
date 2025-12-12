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
    
    // Check which shooters are already registered
    const existingRegistrations = await prisma.registration.findMany({
      where: {
        tournamentId,
        athleteId: {
          in: athleteIds
        }
      },
      select: {
        athleteId: true
      }
    })
    
    const existingShooterIds = existingRegistrations.map((r: { athleteId: string }) => r.athleteId)
    const newShooterIds = athleteIds.filter((id: string) => !existingShooterIds.includes(id))
    
    // Create registrations for shooters who aren't already registered with disciplines
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
        console.log(`Skipped shooter ${athleteId} - already registered`)
      }
    }
    
    return NextResponse.json({
      message: `Successfully registered ${successCount} shooter(s)`,
      registered: successCount,
      alreadyRegistered: existingShooterIds.length,
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

