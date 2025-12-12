import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'
import ShootOffManager from './ShootOffManager'
import { ClayTargetIcon } from '@/components/ClayTargetIcon'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
    shootOffId: string
  }>
}

export default async function ShootOffDetailPage({ params }: PageProps) {
  const { id: tournamentId, shootOffId } = await params
  
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Shoot-Off Management" />
  }

  // Get current user
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  // Get tournament
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId }
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
              href={`/tournaments/${tournamentId}`}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Tournament
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get shoot-off with all related data
  const shootOff = await prisma.shootOff.findUnique({
    where: { id: shootOffId },
    include: {
      tournament: true,
      discipline: true,
      participants: {
        include: {
          athlete: {
            include: {
              user: true,
              team: true
            }
          },
          scores: {
            include: {
              round: true
            },
            orderBy: {
              round: {
                roundNumber: 'asc'
              }
            }
          }
        },
        orderBy: {
          eliminated: 'asc'
        }
      },
      rounds: {
        include: {
          scores: {
            include: {
              participant: {
                include: {
                  athlete: {
                    include: {
                      user: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          roundNumber: 'asc'
        }
      },
      winner: {
        include: {
          user: true
        }
      }
    }
  })

  if (!shootOff) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/tournaments/${tournamentId}/shoot-offs`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4 transition"
          >
            ← Back to All Shoot-Offs
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <ClayTargetIcon className="w-10 h-10 text-orange-600" />
                {shootOff.description}
              </h1>
              <p className="text-xl text-gray-600">{tournament.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/tournaments/${tournamentId}/leaderboard`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>

        {/* Shoot-Off Manager Component */}
        <ShootOffManager 
          shootOff={shootOff} 
          tournament={tournament}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}

