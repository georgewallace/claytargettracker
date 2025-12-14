import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET: Fetch score completion status for all athletes in a discipline
 * This is a bulk endpoint to avoid N+1 queries
 *
 * Query params:
 * - disciplineId: required - the discipline to check completion for
 *
 * Returns: { athleteId: boolean } - map of athlete IDs to completion status
 *
 * Performance: 1 query instead of N queries (where N = number of athletes)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id: tournamentId } = await params
    const { searchParams } = new URL(request.url)
    const disciplineId = searchParams.get('disciplineId')

    if (!disciplineId) {
      return NextResponse.json(
        { error: 'Missing required parameter: disciplineId' },
        { status: 400 }
      )
    }

    // Fetch all shoots for this tournament/discipline that have scores
    // This is a single efficient query instead of N queries (one per athlete)
    const shootsWithScores = await prisma.shoot.findMany({
      where: {
        tournamentId,
        disciplineId,
        scores: {
          some: {}  // Has at least one score
        }
      },
      select: {
        athleteId: true
      }
    })

    // Build completion map: { athleteId: true } for athletes with scores
    const completionMap: Record<string, boolean> = {}
    shootsWithScores.forEach(shoot => {
      completionMap[shoot.athleteId] = true
    })

    return NextResponse.json(completionMap, {
      status: 200,
      headers: {
        // Cache for 30 seconds - scores don't change that frequently
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Error fetching score completion:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
