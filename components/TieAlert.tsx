'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface athletescore {
  athleteId: string
  athleteName: string
  teamName: string | null
  totalScore: number
}

interface Tie {
  position: number
  athletes: athletescore[]
  description: string
}

interface TieAlertProps {
  ties: Tie[]
  tournamentId: string
  isAdmin: boolean
}

export default function TieAlert({ ties, tournamentId, isAdmin }: TieAlertProps) {
  const router = useRouter()
  const [creating, setCreating] = useState<number | null>(null)
  const [error, setError] = useState('')

  if (ties.length === 0) {
    return null
  }

  const handleInitiateShootOff = async (tie: Tie) => {
    setError('')
    setCreating(tie.position)

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/shoot-offs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: tie.position,
          athleteIds: tie.athletes.map(s => s.athleteId)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create shoot-off')
        return
      }

      // Refresh the page to show the new shoot-off
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setCreating(null)
    }
  }

  return (
    <div className="mb-8 space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {ties.map((tie) => (
        <div
          key={tie.position}
          className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  🏆 Shoot-Off Required
                </h3>
                <p className="text-yellow-800 font-medium mb-3">
                  {tie.description}
                </p>
                <div className="bg-white rounded-md p-3 space-y-2">
                  {tie.athletes.map((athlete, idx) => (
                    <div key={athlete.athleteId} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-700">{idx + 1}.</span>
                        <span className="text-gray-900">{athlete.athleteName}</span>
                        {athlete.teamName && (
                          <span className="text-gray-500">({athlete.teamName})</span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900">{athlete.totalScore} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => handleInitiateShootOff(tie)}
                disabled={creating === tie.position}
                className="ml-4 flex-shrink-0 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating === tie.position ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Initiate Shoot-Off
                  </>
                )}
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="mt-3 text-sm text-yellow-700 italic">
              Tournament admin will initiate the shoot-off
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

