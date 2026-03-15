import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'



type RouteParams = {
  params: Promise<{
    id: string
  }>
}

// GET: Fetch existing scores for a squad, athlete, or the entire discipline (bulk)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params
    const { searchParams } = new URL(request.url)
    const squadId = searchParams.get('squadId')
    const athleteId = searchParams.get('athleteId')
    const disciplineId = searchParams.get('disciplineId')

    if (!disciplineId) {
      return NextResponse.json(
        { error: 'Missing required parameter: disciplineId' },
        { status: 400 }
      )
    }

    // Bulk mode: no squadId or athleteId — return all shoots for the tournament+discipline
    if (!squadId && !athleteId) {
      const shoots = await prisma.shoot.findMany({
        where: { tournamentId, disciplineId },
        select: {
          id: true,
          athleteId: true,
          disciplineId: true,
          date: true,
          tiebreakScore: true,
          longRunFront: true,
          longRunBack: true,
          scores: {
            orderBy: [
              { roundNumber: 'asc' },
              { stationNumber: 'asc' }
            ]
          }
        }
      })
      return NextResponse.json(shoots, { status: 200 })
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
      select: {
        id: true,
        athleteId: true,
        disciplineId: true,
        date: true,
        tiebreakScore: true,
        longRunFront: true,
        longRunBack: true,
        scores: {
          orderBy: [
            { roundNumber: 'asc' },
            { stationNumber: 'asc' }
          ]
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
      rounds: Array<{ roundNumber?: number; stationNumber?: number; targets: number; maxTargets: number }>;
      longRunFront?: number | null;
      longRunBack?: number | null;
    }>) {
      const { athleteId, disciplineId, date, rounds, longRunFront, longRunBack } = athleteScore

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
            date: new Date(date),
            ...(longRunFront !== undefined && { longRunFront: longRunFront === null ? null : longRunFront }),
            ...(longRunBack !== undefined && { longRunBack: longRunBack === null ? null : longRunBack }),
          }
        })
      } else {
        // Update the date and LRF/LRB if they changed
        shoot = await prisma.shoot.update({
          where: { id: shoot.id },
          data: {
            date: new Date(date),
            ...(longRunFront !== undefined && { longRunFront: longRunFront === null ? null : longRunFront }),
            ...(longRunBack !== undefined && { longRunBack: longRunBack === null ? null : longRunBack }),
          }
        })
      }

      // Delete existing scores for this shoot
      await prisma.score.deleteMany({
        where: { shootId: shoot.id }
      })

      // Create new scores
      if (rounds.length > 0) {
        await prisma.score.createMany({
          data: rounds.map((round: { roundNumber?: number; stationNumber?: number; targets: number; maxTargets: number }) => ({
            shootId: shoot.id,
            ...(round.roundNumber !== undefined && { roundNumber: round.roundNumber }),
            ...(round.stationNumber !== undefined && { stationNumber: round.stationNumber }),
            targets: round.targets,
            maxTargets: round.maxTargets
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

// PATCH: Save tiebreak score for a specific athlete+discipline
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params

    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only coaches and admins can update tiebreak scores' }, { status: 403 })
    }

    const { athleteId, disciplineId, tiebreakScore } = await request.json()

    if (!athleteId || !disciplineId) {
      return NextResponse.json({ error: 'Missing athleteId or disciplineId' }, { status: 400 })
    }

    const shoot = await prisma.shoot.findFirst({ where: { tournamentId, athleteId, disciplineId } })
    if (!shoot) {
      return NextResponse.json({ error: 'Shoot record not found' }, { status: 404 })
    }

    await prisma.shoot.update({
      where: { id: shoot.id },
      data: { tiebreakScore: tiebreakScore === '' || tiebreakScore === null ? null : parseFloat(tiebreakScore) }
    })

    return NextResponse.json({ message: 'Tiebreak score saved' }, { status: 200 })
  } catch (error) {
    console.error('Error saving tiebreak score:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
