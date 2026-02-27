import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'
import WinnerDeclarationForm from './WinnerDeclarationForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
    shootOffId: string
  }>
}

export default async function DeclareWinnerPage({ params }: PageProps) {
  const { id: tournamentId, shootOffId } = await params
  
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Declare Shoot-Off Winner" />
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
              Only tournament administrators can declare shoot-off winners.
            </p>
            <Link
              href={`/tournaments/${tournamentId}`}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Back to Tournament
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get shoot-off with participants and their scores
  const shootOff = await prisma.shootOff.findUnique({
    where: { id: shootOffId },
    include: {
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
            }
          }
        },
        orderBy: [
          { eliminated: 'asc' },
          { athlete: { user: { name: 'asc' } } }
        ]
      },
      rounds: {
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

  if (shootOff.tournamentId !== tournamentId) {
    notFound()
  }

  if (shootOff.status !== 'in_progress') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {shootOff.status === 'completed' ? 'Winner Already Declared' : 'Cannot Declare Winner'}
            </h1>
            <p className="text-gray-600 mb-6">
              {shootOff.status === 'completed' 
                ? `The winner has already been declared: ${shootOff.winner?.user.name}`
                : `This shoot-off is ${shootOff.status}. Only in-progress shoot-offs can have winners declared.`
              }
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

  const activeParticipants = shootOff.participants.filter(p => !p.eliminated)

  if (activeParticipants.length !== 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Declare Winner Yet</h1>
            <p className="text-gray-600 mb-6">
              {activeParticipants.length === 0 
                ? 'No active participants remaining. Please check the shoot-off status.'
                : `${activeParticipants.length} participants are still active. Continue rounds until only one remains.`
              }
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

  const winner = activeParticipants[0]

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
            🏆 Declare Shoot-Off Winner
          </h1>
          <p className="text-xl text-gray-600">{shootOff.description}</p>
        </div>

        {/* Winner Celebration Preview */}
        <div className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-white mb-2">Winner!</h2>
          <div className="text-4xl font-bold text-white mb-4">
            {winner.athlete.user.name}
          </div>
          {winner.athlete.team && (
            <p className="text-white text-lg mb-2">
              {winner.athlete.team.name}
            </p>
          )}
          <p className="text-white text-sm">
            Congratulations on winning the {shootOff.description}!
          </p>
        </div>

        {/* Winner Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Winner Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Original Score</div>
              <div className="text-2xl font-bold text-gray-900">{Math.floor(winner.tiedScore)} pts</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Shoot-Off Score</div>
              <div className="text-2xl font-bold text-indigo-600">
                {winner.scores.reduce((sum, s) => sum + s.targetsHit, 0)} pts
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Rounds</div>
              <div className="text-2xl font-bold text-gray-900">{winner.scores.length}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Position</div>
              <div className="text-2xl font-bold text-gray-900">
                {shootOff.position === 1 ? '🥇' : shootOff.position === 2 ? '🥈' : shootOff.position === 3 ? '🥉' : `#${shootOff.position}`}
              </div>
            </div>
          </div>
        </div>

        {/* All Participants (Final Standings) */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Final Standings</h2>
          <div className="space-y-3">
            {shootOff.participants.map((participant, idx) => {
              const totalScore = participant.scores.reduce((sum, s) => sum + s.targetsHit, 0)
              const isWinner = participant.id === winner.id
              
              return (
                <div
                  key={participant.id}
                  className={`border-2 rounded-lg p-4 ${
                    isWinner 
                      ? 'bg-green-50 border-green-400' 
                      : participant.eliminated 
                      ? 'bg-gray-50 border-gray-300 opacity-60' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        {isWinner ? '🏆' : participant.eliminated ? '❌' : '✓'}
                      </div>
                      <div>
                        <div className="font-bold text-lg text-gray-900">
                          {participant.athlete.user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {participant.athlete.team?.name || 'Independent'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{totalScore}</div>
                      <div className="text-sm text-gray-500">{participant.scores.length} rounds</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Declaration Form */}
        <WinnerDeclarationForm
          shootOff={shootOff}
          winner={winner}
          tournament={tournament}
        />
      </div>
    </div>
  )
}

