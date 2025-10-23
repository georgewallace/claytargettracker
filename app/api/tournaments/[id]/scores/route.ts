import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = "force-static"

// For static export (demo mode)
export async function generateStaticParams() {
  return []
}

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

// GET: Fetch existing scores for a squad
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params
    const { searchParams } = new URL(request.url)
    const squadId = searchParams.get('squadId')
    const disciplineId = searchParams.get('disciplineId')

    if (!squadId || !disciplineId) {
      return NextResponse.json(
        { error: 'Missing squadId or disciplineId' },
        { status: 400 }
      )
    }

    // Get squad members
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          include: {
            shooter: true
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

    const shooterIds = squad.members.map((m: { shooter: { id: string } }) => m.shooter.id)

    // Fetch existing shoots and scores
    const shoots = await prisma.shoot.findMany({
      where: {
        tournamentId,
        disciplineId,
        shooterId: { in: shooterIds }
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

// POST: Save scores for shooters
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

    // Process each shooter's scores
    for (const shooterScore of scores as Array<{
      shooterId: string;
      disciplineId: string;
      date: string;
      rounds: Array<{ station: number; targets: number; totalTargets: number }>;
    }>) {
      const { shooterId, disciplineId, date, rounds } = shooterScore

      if (!shooterId || !disciplineId || !date || !Array.isArray(rounds)) {
        continue // Skip invalid entries
      }

      // Find or create Shoot record
      let shoot = await prisma.shoot.findFirst({
        where: {
          tournamentId,
          shooterId,
          disciplineId,
          date: new Date(date)
        }
      })

      if (!shoot) {
        shoot = await prisma.shoot.create({
          data: {
            tournamentId,
            shooterId,
            disciplineId,
            date: new Date(date)
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

