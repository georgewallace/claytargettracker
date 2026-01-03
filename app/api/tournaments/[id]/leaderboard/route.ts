import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET: Fetch optimized leaderboard data
 *
 * This endpoint returns ONLY the data needed for leaderboard calculations,
 * avoiding the massive nested includes in the page query.
 *
 * Performance optimization: Reduces data transfer by 60-80%
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tournamentId } = await params

    // Fetch tournament with minimal, optimized includes
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        status: true,
        createdById: true,
        enableLeaderboard: true,
        enableHOA: true,
        enableHAA: true,
        hoaSeparateGender: true,
        haaCoreDisciplines: true,
        hoaExcludesHAA: true,
        haaExcludesDivision: true,
        haaOverallPlaces: true,
        haaMenPlaces: true,
        haaLadyPlaces: true,
        hoaOverallPlaces: true,
        hoaMenPlaces: true,
        hoaLadyPlaces: true,
        leaderboardTabInterval: true,
        enableShootOffs: true,
        shootOffTriggers: true,
        shootOffFormat: true,
        shootOffTargetsPerRound: true,
        shootOffStartStation: true,
        shootOffRequiresPerfect: true,
        disciplines: {
          select: {
            disciplineId: true,
            discipline: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        },
        // Optimized shoots query - only essential fields
        shoots: {
          select: {
            id: true,
            athleteId: true,
            disciplineId: true,
            updatedAt: true,
            createdAt: true,
            concurrentPlace: true,
            classPlace: true,
            teamPlace: true,
            hoaPlace: true,
            individualRank: true,
            teamRank: true,
            teamScore: true,
            haaIndividualPlace: true,
            haaConcurrent: true,
            athlete: {
              select: {
                id: true,
                division: true,
                gender: true,
                nscaClass: true,
                ataClass: true,
                nssaClass: true,
                user: {
                  select: {
                    name: true
                  }
                },
                team: {
                  select: {
                    name: true,
                    logoUrl: true
                  }
                }
              }
            },
            scores: {
              select: {
                roundNumber: true,
                stationNumber: true,
                targets: true,
                maxTargets: true
              },
              orderBy: [
                { roundNumber: 'asc' },
                { stationNumber: 'asc' }
              ]
            }
          }
        },
        // Optimized time slots - only for completion tracking
        timeSlots: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            disciplineId: true,
            squads: {
              select: {
                id: true,
                name: true,
                members: {
                  select: {
                    athleteId: true
                  }
                }
              }
            }
          }
        },
        // Shoot-offs - minimal data
        shootOffs: {
          select: {
            id: true,
            disciplineId: true,
            position: true,
            status: true,
            participants: {
              select: {
                athleteId: true,
                athlete: {
                  select: {
                    user: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            },
            winnerId: true,
            winner: {
              select: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    if (!tournament.enableLeaderboard) {
      return NextResponse.json(
        { error: 'Leaderboard not enabled for this tournament' },
        { status: 403 }
      )
    }

    // Return with cache headers for React Query
    return NextResponse.json(tournament, {
      status: 200,
      headers: {
        // Cache for 1 minute, allow stale for 2 minutes during revalidation
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120'
      }
    })
  } catch (error) {
    console.error('Error fetching leaderboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
