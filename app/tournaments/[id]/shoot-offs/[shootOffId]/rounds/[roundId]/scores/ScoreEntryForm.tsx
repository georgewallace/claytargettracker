'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScoreEntryFormProps {
  round: any
  tournament: any
  participants: any[]
}

export default function ScoreEntryForm({ round, tournament, participants }: ScoreEntryFormProps) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, number>>(
    participants.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maxTargets = tournament.shootOffTargetsPerRound

  const handleScoreChange = (participantId: string, value: string) => {
    const numValue = parseInt(value) || 0
    const clampedValue = Math.max(0, Math.min(maxTargets, numValue))
    setScores(prev => ({ ...prev, [participantId]: clampedValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all scores are entered
    const allEntered = participants.every(p => scores[p.id] !== undefined && scores[p.id] >= 0)
    if (!allEntered) {
      setError('Please enter scores for all participants')
      return
    }

    // Validate all scores are within range
    const allValid = participants.every(p => scores[p.id] >= 0 && scores[p.id] <= maxTargets)
    if (!allValid) {
      setError(`All scores must be between 0 and ${maxTargets}`)
      return
    }

    setLoading(true)

    try {
      // Submit scores
      const scoresArray = participants.map(p => ({
        participantId: p.id,
        targets: scores[p.id]
      }))

      const response = await fetch(
        `/api/tournaments/${tournament.id}/shoot-offs/${round.shootOffId}/rounds/${round.id}/scores`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scores: scoresArray })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit scores')
        return
      }

      // Redirect back to shoot-off detail
      router.push(`/tournaments/${tournament.id}/shoot-offs/${round.shootOffId}`)
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/tournaments/${tournament.id}/shoot-offs/${round.shootOffId}`)
  }

  // Quick fill buttons
  const handleFillAll = (value: number) => {
    const newScores = participants.reduce((acc, p) => ({ ...acc, [p.id]: value }), {})
    setScores(newScores)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Quick Fill Buttons */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Fill All:</h3>
        <div className="flex flex-wrap gap-2">
          {[0, ...Array.from({ length: maxTargets }, (_, i) => i + 1)].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleFillAll(num)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-medium transition"
            >
              {num} {num === maxTargets ? '(Perfect)' : ''}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Click to fill all scores with the same value, then adjust individually if needed
        </p>
      </div>

      {/* Score Entry Fields */}
      <div className="space-y-4 mb-8">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Athlete Info */}
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-900">
                  {participant.athlete.user.name}
                </div>
                <div className="text-sm text-gray-600">
                  {participant.athlete.team?.name || 'Independent'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Tied Score: {participant.tiedScore} pts
                </div>
              </div>

              {/* Score Input */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <label
                    htmlFor={`score-${participant.id}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Targets Hit
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleScoreChange(participant.id, String(Math.max(0, scores[participant.id] - 1)))}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded font-bold text-gray-700 transition"
                    >
                      −
                    </button>
                    <input
                      id={`score-${participant.id}`}
                      type="number"
                      min="0"
                      max={maxTargets}
                      value={scores[participant.id]}
                      onChange={(e) => handleScoreChange(participant.id, e.target.value)}
                      className="w-20 px-3 py-2 text-center border border-gray-300 rounded-md text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleScoreChange(participant.id, String(Math.min(maxTargets, scores[participant.id] + 1)))}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded font-bold text-gray-700 transition"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    / {maxTargets} max
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            '✓ Submit Scores & Complete Round'
          )}
        </button>
      </div>

      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> After submitting, the round will be marked as complete and athletes with the lowest score(s) may be eliminated based on the shoot-off format.
        </p>
      </div>
    </form>
  )
}

