'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WinnerDeclarationFormProps {
  shootOff: any
  winner: any
  tournament: any
}

export default function WinnerDeclarationForm({ shootOff, winner, tournament }: WinnerDeclarationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!confirmed) {
      setError('Please confirm the winner by checking the box')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `/api/tournaments/${tournament.id}/shoot-offs/${shootOff.id}/declare-winner`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            winnerId: winner.id
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to declare winner')
        return
      }

      // Redirect to shoot-off detail page
      router.push(`/tournaments/${tournament.id}/shoot-offs/${shootOff.id}`)
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/tournaments/${tournament.id}/shoot-offs/${shootOff.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Winner Declaration</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 mr-3 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <div>
            <span className="text-gray-900 font-medium">
              I confirm that <strong>{winner.athlete.user.name}</strong> is the winner of this shoot-off
            </span>
            <p className="text-sm text-gray-600 mt-1">
              This action will mark the shoot-off as completed and update the tournament leaderboard.
              This cannot be undone.
            </p>
          </div>
        </label>
      </div>

      {/* What Happens Next */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">What happens when you declare the winner:</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span><strong>{winner.athlete.user.name}</strong> will be marked as the winner</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>The shoot-off status will change to "Completed"</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Final placements will be assigned to all participants</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>The tournament leaderboard will be updated (future phase)</span>
          </li>
        </ul>
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
          disabled={loading || !confirmed}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Declaring Winner...
            </>
          ) : (
            '🏆 Declare Winner'
          )}
        </button>
      </div>

      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Once a winner is declared, the shoot-off cannot be reopened.
          Make sure all scores are correct before proceeding.
        </p>
      </div>
    </form>
  )
}

