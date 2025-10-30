'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ShootOffManagerProps {
  shootOff: any
  tournament: any
  isAdmin: boolean
}

export default function ShootOffManager({ shootOff, tournament, isAdmin }: ShootOffManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showStartModal, setShowStartModal] = useState(false)

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

  const handleStartShootOff = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setShowStartModal(false)

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/shoot-offs/${shootOff.id}/start`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to start shoot-off')
        return
      }

      setSuccess('Shoot-off started successfully!')
      setTimeout(() => router.refresh(), 1000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRound = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/shoot-offs/${shootOff.id}/rounds`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create round')
        return
      }

      setSuccess(`Round ${data.roundNumber} created!`)
      setTimeout(() => router.refresh(), 1000)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelShootOff = async () => {
    if (!confirm('Cancel this shoot-off? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/shoot-offs/${shootOff.id}/cancel`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to cancel shoot-off')
        return
      }

      setSuccess('Shoot-off cancelled.')
      setTimeout(() => router.push(`/tournaments/${tournament.id}/shoot-offs`), 1500)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const activeParticipants = shootOff.participants.filter((p: any) => !p.eliminated)

  return (
    <div className="space-y-6">
      {/* Start Shoot-Off Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Start Shoot-Off?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to start this shoot-off? Once started, participants will be able to begin shooting and rounds can be created.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowStartModal(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStartShootOff}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Yes, Start Shoot-Off'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shoot-Off Status</h2>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(shootOff.status)}`}>
              {shootOff.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          {isAdmin && (
            <div className="flex gap-3">
              {shootOff.status === 'pending' && (
                <button
                  onClick={() => setShowStartModal(true)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition disabled:opacity-50"
                >
                  ▶ Start Shoot-Off
                </button>
              )}
              
              {(shootOff.status === 'pending' || shootOff.status === 'in_progress') && (
                <button
                  onClick={handleCancelShootOff}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Cancelling...' : '❌ Cancel'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Configuration Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-600 mb-1">Format</div>
            <div className="font-semibold text-gray-900">
              {shootOff.format.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Targets per Round</div>
            <div className="font-semibold text-gray-900">{tournament.shootOffTargetsPerRound}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Position</div>
            <div className="font-semibold text-gray-900">
              {shootOff.position === 1 ? '🥇 1st Place' : 
               shootOff.position === 2 ? '🥈 2nd Place' : 
               shootOff.position === 3 ? '🥉 3rd Place' : 
               `#${shootOff.position}`}
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Participants ({activeParticipants.length} Active / {shootOff.participants.length} Total)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shootOff.participants.map((participant: any) => {
            // Calculate total score across all rounds
            const totalScore = participant.scores.reduce((sum: number, score: any) => sum + score.targetsHit, 0)
            
            return (
              <div
                key={participant.id}
                className={`border-2 rounded-lg p-4 ${
                  participant.eliminated 
                    ? 'bg-gray-50 border-gray-300 opacity-60' 
                    : participant.id === shootOff.winnerId
                    ? 'bg-green-50 border-green-400'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {participant.shooter.user.name}
                      {participant.id === shootOff.winnerId && ' 🏆'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {participant.shooter.team?.name || 'Independent'}
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

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Score:</span>
                    <span className="font-semibold text-gray-900">{participant.tiedScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shoot-Off Score:</span>
                    <span className="font-semibold text-indigo-600">{totalScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rounds Completed:</span>
                    <span className="font-semibold text-gray-900">{participant.scores.length}</span>
                  </div>
                </div>

                {participant.eliminated && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded px-2 py-1 text-xs text-red-700 font-medium text-center">
                    Eliminated
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rounds */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Rounds ({shootOff.rounds.length})
          </h2>
          
          {isAdmin && shootOff.status === 'in_progress' && !shootOff.winnerId && activeParticipants.length > 1 && (
            <button
              onClick={handleCreateRound}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : '+ New Round'}
            </button>
          )}
        </div>

        {shootOff.rounds.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No rounds yet. {shootOff.status === 'in_progress' ? 'Create the first round to begin!' : 'Start the shoot-off to create rounds.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {shootOff.rounds.map((round: any) => (
              <div key={round.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Round {round.roundNumber}
                  </h3>
                  {round.completedAt && (
                    <span className="text-green-600 font-medium text-sm">✓ Completed</span>
                  )}
                </div>

                {/* Scores Table */}
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shooter
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Targets Hit
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {round.scores.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                            No scores entered yet
                          </td>
                        </tr>
                      ) : (
                        round.scores
                          .sort((a: any, b: any) => b.targetsHit - a.targetsHit)
                          .map((score: any, idx: number) => (
                            <tr key={score.id} className={idx === 0 && round.scores.length > 1 ? 'bg-green-50' : ''}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="font-medium text-gray-900">
                                  {score.participant.shooter.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {score.participant.shooter.team?.name || 'Independent'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className="text-2xl font-bold text-gray-900">
                                  {score.targetsHit}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                  / {score.totalTargets}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                {idx === 0 && round.scores.length > 1 && round.completedAt ? (
                                  <span className="text-green-600 font-semibold">Leading</span>
                                ) : idx === round.scores.length - 1 && round.scores.length > 1 && round.completedAt ? (
                                  <span className="text-gray-500">Behind</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Score Entry Link */}
                {isAdmin && !round.completedAt && shootOff.status === 'in_progress' && (
                  <div className="mt-4">
                    <a
                      href={`/tournaments/${tournament.id}/shoot-offs/${shootOff.id}/rounds/${round.id}/scores`}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Enter Scores for Round {round.roundNumber}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Winner Declaration */}
      {shootOff.winnerId && shootOff.winner && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-white mb-2">Winner!</h2>
          <div className="text-4xl font-bold text-white mb-4">
            {shootOff.winner.user.name}
          </div>
          <p className="text-white text-lg">
            Congratulations on winning the {shootOff.description}!
          </p>
        </div>
      )}

      {/* Ready to Declare Winner */}
      {isAdmin && 
       shootOff.status === 'in_progress' && 
       !shootOff.winnerId && 
       activeParticipants.length === 1 && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-900 mb-3">
            Ready to Declare Winner
          </h3>
          <p className="text-yellow-800 mb-4">
            Only one participant remains! You can now declare{' '}
            <strong>{activeParticipants[0].shooter.user.name}</strong> as the winner.
          </p>
          <a
            href={`/tournaments/${tournament.id}/shoot-offs/${shootOff.id}/declare-winner`}
            className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition"
          >
            Declare Winner
          </a>
        </div>
      )}
    </div>
  )
}

