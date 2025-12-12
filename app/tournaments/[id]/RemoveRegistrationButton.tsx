'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RemoveRegistrationButtonProps {
  registrationId: string
  athleteName: string
  isCompact?: boolean
}

export default function RemoveRegistrationButton({ 
  registrationId, 
  athleteName,
  isCompact = false
}: RemoveRegistrationButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingScores, setCheckingScores] = useState(false)
  const [hasScores, setHasScores] = useState(false)
  const [shootCount, setShootCount] = useState(0)
  const [deleteScores, setDeleteScores] = useState(false)
  const [error, setError] = useState('')

  const handleOpenModal = async () => {
    setShowModal(true)
    setCheckingScores(true)
    setError('')

    try {
      const response = await fetch(`/api/registrations/${registrationId}`)
      const data = await response.json()

      if (response.ok) {
        setHasScores(data.hasScores)
        setShootCount(data.shootCount)
      } else {
        setError('Failed to check for scores')
      }
    } catch (error) {
      setError('An error occurred checking for scores')
    } finally {
      setCheckingScores(false)
    }
  }

  const handleRemove = async () => {
    setLoading(true)
    setError('')

    try {
      const url = `/api/registrations/${registrationId}${deleteScores ? '?deleteScores=true' : ''}`
      const response = await fetch(url, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to remove registration')
        return
      }

      setShowModal(false)
      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={isCompact 
          ? "text-red-600 hover:text-red-700 text-sm font-medium transition"
          : "px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        }
      >
        Remove
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Remove Athlete from Tournament?
            </h3>

            {checkingScores ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Checking for scores...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to remove <span className="font-semibold">{athleteName}</span> from this tournament?
                  </p>

                  {hasScores && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800">
                            Warning: Athlete has scores
                          </h4>
                          <p className="mt-1 text-sm text-red-700">
                            This athlete has entered scores for {shootCount} shoot{shootCount !== 1 ? 's' : ''} in this tournament.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasScores && (
                    <label className="flex items-start cursor-pointer mb-4 p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={deleteScores}
                        onChange={(e) => setDeleteScores(e.target.checked)}
                        className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">
                          Also delete all scores
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          If unchecked, the athlete's scores will remain in the system (orphaned data)
                        </p>
                      </div>
                    </label>
                  )}

                  {!hasScores && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            This athlete has not entered any scores yet. Safe to remove.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRemove}
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    {loading ? 'Removing...' : hasScores && deleteScores ? 'Remove & Delete Scores' : 'Remove'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

