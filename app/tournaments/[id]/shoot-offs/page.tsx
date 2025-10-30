import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'
import TieAlert from '@/components/TieAlert'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ShootOffsPage({ params }: PageProps) {
  const { id } = await params
  
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Shoot-Offs Management" />
  }

  // Get current user
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Get tournament with shoot-offs
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      createdBy: true,
      disciplines: {
        include: {
          discipline: true
        }
      },
      shootOffs: {
        include: {
          participants: {
            include: {
              shooter: {
                include: {
                  user: true,
                  team: true
                }
              }
            }
          },
          rounds: {
            include: {
              scores: true
            },
            orderBy: {
              roundNumber: 'asc'
            }
          },
          winner: {
            include: {
              user: true
            }
          },
          discipline: true
        },
        orderBy: {
          position: 'asc'
        }
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  // Check if user is admin or tournament creator
  const isAdmin = user.role === 'admin' || tournament.createdById === user.id
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              Only tournament administrators can manage shoot-offs.
            </p>
            <Link
              href={`/tournaments/${id}`}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Back to Tournament
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch shooter scores for tie detection
  interface ShooterScore {
    shooterId: string
    shooterName: string
    teamName: string | null
    totalScore: number
    disciplineCount: number
  }

  const shoots = await prisma.shoot.findMany({
    where: { tournamentId: id },
    include: {
      shooter: {
        include: {
          user: true,
          team: true
        }
      },
      scores: true
    }
  })

  // Calculate total scores
  const shooterScores = new Map<string, ShooterScore>()
  shoots.forEach(shoot => {
    const shooterId = shoot.shooter.id
    const totalForShoot = shoot.scores.reduce((sum, score) => sum + score.targets, 0)
    
    if (!shooterScores.has(shooterId)) {
      shooterScores.set(shooterId, {
        shooterId,
        shooterName: shoot.shooter.user.name,
        teamName: shoot.shooter.team?.name || null,
        totalScore: 0,
        disciplineCount: 0
      })
    }
    
    const shooterData = shooterScores.get(shooterId)!
    shooterData.totalScore += totalForShoot
    shooterData.disciplineCount += 1
  })

  const allShooters = Array.from(shooterScores.values())

  // Detect ties for shoot-offs
  const detectTies = () => {
    if (!tournament.enableShootOffs || !tournament.shootOffTriggers) {
      return []
    }

    const triggers = JSON.parse(tournament.shootOffTriggers) as string[]
    const ties: { position: number; shooters: ShooterScore[]; description: string }[] = []

    // Sort all shooters by total score
    const sortedShooters = [...allShooters]
      .filter(s => s.disciplineCount > 0)
      .sort((a, b) => b.totalScore - a.totalScore)

    // Helper to check if a position trigger matches
    const shouldCheckPosition = (pos: number): boolean => {
      if (triggers.includes('1st') && pos === 1) return true
      if (triggers.includes('2nd') && pos === 2) return true
      if (triggers.includes('3rd') && pos === 3) return true
      if (triggers.includes('top5') && pos <= 5) return true
      if (triggers.includes('top10') && pos <= 10) return true
      return false
    }

    // Group by score and find ties
    const scoreGroups = new Map<number, ShooterScore[]>()
    sortedShooters.forEach(shooter => {
      const score = shooter.totalScore
      if (!scoreGroups.has(score)) {
        scoreGroups.set(score, [])
      }
      scoreGroups.get(score)!.push(shooter)
    })

    // Check each position for ties
    let currentPosition = 1
    Array.from(scoreGroups.entries())
      .sort(([a], [b]) => b - a) // Sort by score descending
      .forEach(([score, shooters]) => {
        if (shooters.length > 1 && shouldCheckPosition(currentPosition)) {
          // Check if shoot-off already exists for this tie
          const existingShootOff = tournament.shootOffs.find(so => 
            so.position === currentPosition && 
            so.status !== 'cancelled' &&
            // Check if participants match
            so.participants.every((p: any) => shooters.some(s => s.shooterId === p.shooterId))
          )

          if (!existingShootOff) {
            const positionName = currentPosition === 1 ? '1st Place' : 
                                currentPosition === 2 ? '2nd Place' : 
                                currentPosition === 3 ? '3rd Place' : 
                                `${currentPosition}th Place`
            ties.push({
              position: currentPosition,
              shooters,
              description: `${positionName} - ${shooters.length} shooters tied at ${score} points`
            })
          }
        }
        currentPosition += shooters.length
      })

    return ties
  }

  const detectedTies = detectTies()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'in_progress':
        return '▶'
      case 'completed':
        return '✅'
      case 'cancelled':
        return '❌'
      default:
        return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4 transition"
          >
            Back to Tournament
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Shoot-Offs Management
              </h1>
              <p className="text-xl text-gray-600">{tournament.name}</p>
            </div>
            <Link
              href={`/tournaments/${id}/leaderboard`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition"
            >
              View Leaderboard
            </Link>
          </div>
        </div>

        {/* Shoot-Offs Configuration Info */}
        {tournament.enableShootOffs && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">
              Shoot-Off Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Format:</span>
                <span className="ml-2 text-blue-900">
                  {tournament.shootOffFormat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Targets per Round:</span>
                <span className="ml-2 text-blue-900">{tournament.shootOffTargetsPerRound}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Triggers:</span>
                <span className="ml-2 text-blue-900">
                  {tournament.shootOffTriggers 
                    ? JSON.parse(tournament.shootOffTriggers).join(', ').toUpperCase()
                    : 'None'}
                </span>
              </div>
            </div>
            {tournament.shootOffStartStation && (
              <div className="mt-3 text-sm">
                <span className="text-blue-700 font-medium">Start Station:</span>
                <span className="ml-2 text-blue-900">{tournament.shootOffStartStation}</span>
              </div>
            )}
            {tournament.shootOffRequiresPerfect && (
              <div className="mt-3 text-sm text-blue-700 italic">
                * Only triggers for perfect scores
              </div>
            )}
          </div>
        )}

        {/* Tournament Status Notice */}
        {tournament.status !== 'finalizing' && tournament.status !== 'completed' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Tournament Status: {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                </h3>
                <p className="text-yellow-800 mb-3">
                  Shoot-offs are typically managed when the tournament is in <strong>"Finalizing"</strong> status.
                  This ensures all regular scores are entered before resolving ties.
                </p>
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Recommended workflow:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li><strong>Upcoming/Active:</strong> Tournament shooting is happening</li>
                    <li><strong>Finalizing:</strong> All scores entered, now resolving shoot-offs</li>
                    <li><strong>Completed:</strong> Everything done, including shoot-offs</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {tournament.status === 'finalizing' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Ready for Shoot-Offs
                </h3>
                <p className="text-green-800 text-sm">
                  Tournament is in finalizing status. You can create and manage shoot-offs now.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tie Alerts - Show detected ties requiring shoot-offs */}
        {detectedTies.length > 0 && (
          <TieAlert
            ties={detectedTies}
            tournamentId={tournament.id}
            isAdmin={isAdmin}
          />
        )}

        {/* Shoot-Offs List */}
        {tournament.shootOffs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              No Shoot-Offs Yet
            </h3>
            <p className="text-gray-600 mb-6">
              {tournament.enableShootOffs 
                ? 'Shoot-offs will appear here when ties are detected on the leaderboard.'
                : 'Shoot-offs are disabled for this tournament.'}
            </p>
            <Link
              href={`/tournaments/${id}/leaderboard`}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium"
            >
              View Leaderboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {tournament.shootOffs.map((shootOff) => (
              <div
                key={shootOff.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {shootOff.description}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(shootOff.status)}`}>
                          {getStatusIcon(shootOff.status)}
                          {shootOff.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      {shootOff.discipline && (
                        <p className="text-sm text-gray-600">
                          Discipline: {shootOff.discipline.displayName}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/tournaments/${id}/shoot-offs/${shootOff.id}`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition"
                    >
                      Manage
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Participants</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {shootOff.participants.length}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Rounds</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {shootOff.rounds.length}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Format</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {shootOff.format.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Position</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {shootOff.position === 1 ? '🥇' : shootOff.position === 2 ? '🥈' : shootOff.position === 3 ? '🥉' : `#${shootOff.position}`}
                      </div>
                    </div>
                  </div>

                  {/* Participants */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Participants:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {shootOff.participants.map((participant) => (
                        <div
                          key={participant.id}
                          className={`border rounded-lg p-3 ${
                            participant.eliminated 
                              ? 'bg-gray-50 border-gray-300 opacity-60' 
                              : participant.id === shootOff.winnerId
                              ? 'bg-green-50 border-green-300'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {participant.shooter.user.name}
                                {participant.id === shootOff.winnerId && ' 🏆'}
                              </div>
                              <div className="text-xs text-gray-600">
                                {participant.shooter.team?.name || 'Independent'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Tied at: {participant.tiedScore} pts
                              </div>
                            </div>
                            {participant.finalPlace && (
                              <div className="text-2xl">
                                {participant.finalPlace === 1 ? '🥇' : 
                                 participant.finalPlace === 2 ? '🥈' : 
                                 participant.finalPlace === 3 ? '🥉' : 
                                 `#${participant.finalPlace}`}
                              </div>
                            )}
                          </div>
                          {participant.eliminated && (
                            <div className="text-xs text-red-600 mt-2 font-medium">
                              Eliminated
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Winner */}
                  {shootOff.winner && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">🏆</div>
                        <div>
                          <div className="text-sm text-green-700 font-medium">Winner</div>
                          <div className="text-lg font-bold text-green-900">
                            {shootOff.winner.user.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

