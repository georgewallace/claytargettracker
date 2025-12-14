import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'



type RouteParams = {
  params: Promise<{
    id: string
  }>
}

// GET: Fetch existing scores for a squad or athlete
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params
    const { searchParams } = new URL(request.url)
    const squadId = searchParams.get('squadId')
    const athleteId = searchParams.get('athleteId')
    const disciplineId = searchParams.get('disciplineId')

    // Must have either squadId or athleteId, and must have disciplineId
    if (!disciplineId || (!squadId && !athleteId)) {
      return NextResponse.json(
        { error: 'Missing required parameters. Need disciplineId and either squadId or athleteId' },
        { status: 400 }
      )
    }

    let athleteIds: string[] = []

    if (squadId) {
      // Get squad members
      const squad = await prisma.squad.findUnique({
        where: { id: squadId },
        include: {
          members: {
            include: {
              athlete: true
            }
          }
        }
      })

      if (!squad) {
        return NextResponse.json(
          { error: 'Squad not found' },
          { status: 404 }
        )
      }

      athleteIds = squad.members.map((m: { athlete: { id: string } }) => m.athlete.id)
    } else if (athleteId) {
      // Query for a single athlete
      athleteIds = [athleteId]
    }

    // Fetch existing shoots and scores
    const shoots = await prisma.shoot.findMany({
      where: {
        tournamentId,
        disciplineId,
        athleteId: { in: athleteIds }
      },
      include: {
        scores: {
          orderBy: {
            station: 'asc'
          }
        }
      }
    })

    return NextResponse.json(shoots, { status: 200 })
  } catch (error) {
    console.error('Error fetching scores:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Save scores for athletes
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params
    
    // Only coaches and admins can enter scores
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can enter scores' },
        { status: 403 }
      )
    }

    const { scores } = await request.json()

    // Validate input
    if (!Array.isArray(scores)) {
      return NextResponse.json(
        { error: 'Invalid scores data' },
        { status: 400 }
      )
    }

    // Process each athlete's scores
    for (const athleteScore of scores as Array<{
      athleteId: string;
      disciplineId: string;
      date: string;
      rounds: Array<{ station: number; targets: number; totalTargets: number }>;
    }>) {
      const { athleteId, disciplineId, date, rounds } = athleteScore

      if (!athleteId || !disciplineId || !date || !Array.isArray(rounds)) {
        continue // Skip invalid entries
      }

      // Find or create Shoot record (unique on tournamentId, athleteId, disciplineId)
      let shoot = await prisma.shoot.findFirst({
        where: {
          tournamentId,
          athleteId,
          disciplineId
        }
      })

      if (!shoot) {
        shoot = await prisma.shoot.create({
          data: {
            tournamentId,
            athleteId,
            disciplineId,
            date: new Date(date)
          }
        })
      } else {
        // Update the date if it changed
        shoot = await prisma.shoot.update({
          where: { id: shoot.id },
          data: { date: new Date(date) }
        })
      }

      // Delete existing scores for this shoot
      await prisma.score.deleteMany({
        where: { shootId: shoot.id }
      })

      // Create new scores
      if (rounds.length > 0) {
        await prisma.score.createMany({
          data: rounds.map((round: { station: number; targets: number; totalTargets: number }) => ({
            shootId: shoot.id,
            station: round.station,
            targets: round.targets,
            totalTargets: round.totalTargets
          }))
        })
      }
    }

    return NextResponse.json({ message: 'Scores saved successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error saving scores:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

