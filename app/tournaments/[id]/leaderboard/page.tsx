import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Leaderboard from './Leaderboard'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'
import { getCurrentUser } from '@/lib/auth'

// Force dynamic rendering (real-time leaderboard data)
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// For static export (demo mode)
export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return [
      { id: 'demo-tournament-1' },
      { id: 'demo-tournament-2' },
      { id: 'demo-tournament-3' },
    ]
  }
  return []
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { id } = await params
  
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Tournament Leaderboard" />
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      disciplines: {
        include: {
          discipline: true
        }
      },
      shoots: {
        include: {
          athlete: {
            include: {
              user: true,
              team: true
            }
          },
          discipline: true,
          scores: true
        }
      },
      timeSlots: {
        include: {
          discipline: true,
          squads: {
            include: {
              members: {
                include: {
                  athlete: {
                    include: {
                      user: true,
                      team: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      shootOffs: {
        include: {
          participants: {
            include: {
              athlete: {
                include: {
                  user: true
                }
              }
            }
          },
          winner: {
            include: {
              user: true
            }
          }
        }
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  // Check if leaderboard is enabled for this tournament
  if (!tournament.enableLeaderboard) {
    notFound()
  }

  // Get current user for admin check
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-5xl font-bold text-white flex items-center gap-4">
              🏆 Live Leaderboard
              <Link
                href={`/tournaments/${tournament.id}`}
                className="text-base font-normal text-white hover:text-indigo-200 transition"
              >
                ← Back to Tournament
              </Link>
            </h1>
            <p className="text-sm text-indigo-300">
              Last updated: {new Date(tournament.updatedAt).toLocaleString()}
            </p>
          </div>
          <p className="text-2xl text-indigo-200">{tournament.name}</p>
        </div>

        <Leaderboard 
          tournament={tournament} 
          isAdmin={user?.role === 'admin' || tournament.createdById === user?.id}
        />
      </div>
    </div>
  )
}

