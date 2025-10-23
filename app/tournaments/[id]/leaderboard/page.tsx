import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Leaderboard from './Leaderboard'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { id } = await params

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
          shooter: {
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
                  shooter: {
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
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="inline-flex items-center text-white hover:text-indigo-200 mb-4 transition"
          >
            ← Back to Tournament
          </Link>
          <h1 className="text-5xl font-bold text-white mb-2">
            🏆 Live Leaderboard
          </h1>
          <p className="text-2xl text-indigo-200">{tournament.name}</p>
        </div>

        <Leaderboard tournament={tournament} />
      </div>
    </div>
  )
}

