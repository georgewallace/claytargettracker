import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'
import ScoreEntryForm from './ScoreEntryForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
    shootOffId: string
    roundId: string
  }>
}

export default async function RoundScoreEntryPage({ params }: PageProps) {
  const { id: tournamentId, shootOffId, roundId } = await params
  
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Shoot-Off Score Entry" />
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
              Only tournament administrators can enter shoot-off scores.
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

  // Get round with shoot-off and participants
  const round = await prisma.shootOffRound.findUnique({
    where: { id: roundId },
    include: {
      shootOff: {
        include: {
          participants: {
            where: {
              eliminated: false
            },
            include: {
              shooter: {
                include: {
                  user: true,
                  team: true
                }
              }
            },
            orderBy: {
              shooter: {
                user: {
                  name: 'asc'
                }
              }
            }
          }
        }
      },
      scores: {
        include: {
          participant: {
            include: {
              shooter: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!round) {
    notFound()
  }

  if (round.shootOff.tournamentId !== tournamentId) {
    notFound()
  }

  if (round.completed) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Round Complete</h1>
            <p className="text-gray-600 mb-6">
              Scores have already been entered for this round.
            </p>
            <Link
              href={`/tournaments/${tournamentId}/shoot-offs/${shootOffId}`}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              ← Back to Shoot-Off
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/tournaments/${tournamentId}/shoot-offs/${shootOffId}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-4 transition"
          >
            ← Back to Shoot-Off
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📝 Enter Scores - Round {round.roundNumber}
          </h1>
          <p className="text-xl text-gray-600">{round.shootOff.description}</p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Instructions</h2>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Enter the number of targets hit by each shooter in this round</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Maximum targets per round: <strong>{tournament.shootOffTargetsPerRound}</strong></span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Format: <strong>{round.shootOff.format.replace('_', ' ')}</strong></span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>After submitting, shooters with the lowest score(s) may be eliminated</span>
            </li>
          </ul>
        </div>

        {/* Score Entry Form */}
        <ScoreEntryForm
          round={round}
          tournament={tournament}
          participants={round.shootOff.participants}
        />
      </div>
    </div>
  )
}

