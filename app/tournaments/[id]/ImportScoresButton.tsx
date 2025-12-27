'use client'

import { useState } from 'react'

interface ImportScoresButtonProps {
  tournamentId: string
}

interface ImportResult {
  success: number
  updated: string[]
  errors: string[]
  skipped: number
}

export default function ImportScoresButton({ tournamentId }: ImportScoresButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/tournaments/${tournamentId}/import-scores`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Import failed')
      }

      const data = await response.json()
      setResult(data)
      setShowModal(true)

      // Refresh page after successful import to update leaderboard
      if (data.success > 0) {
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import scores')
      setShowModal(true)
    } finally {
      setLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  return (
    <>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        disabled={loading}
        className="hidden"
        id="score-import-file"
      />
      <label
        htmlFor="score-import-file"
        className={`inline-flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-sm sm:text-base whitespace-nowrap cursor-pointer ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {loading ? 'Importing...' : '📊 Import Scores'}
      </label>

      {/* Modal */}
      {showModal && (result || error) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {result ? 'Import Results' : 'Import Failed'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {result && (
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-bold text-green-800 text-lg mb-3">Import Complete!</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-green-700">
                          ✓ {result.success} athletes processed
                        </p>
                        <p className="text-green-700">
                          ✓ {result.updated.length} score records imported
                        </p>
                        {result.skipped > 0 && (
                          <p className="text-gray-600">
                            ⊘ {result.skipped} rows skipped (no shooter ID)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {(result.updated.length > 0 || result.errors.length > 0) && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-3"
                      >
                        {showDetails ? 'Hide' : 'Show'} Details
                      </button>

                      {showDetails && (
                        <div className="space-y-4 mt-3">
                          {result.updated.length > 0 && (
                            <div>
                              <p className="font-medium text-green-800 mb-2">
                                Updated ({result.updated.length}):
                              </p>
                              <ul className="list-disc list-inside text-xs text-green-700 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded border border-green-200">
                                {result.updated.map((msg, idx) => (
                                  <li key={idx} className="mb-1">{msg}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {result.errors.length > 0 && (
                            <div>
                              <p className="font-medium text-orange-800 mb-2">
                                ⚠ Errors ({result.errors.length}):
                              </p>
                              <ul className="list-disc list-inside text-xs text-orange-700 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded border border-orange-200">
                                {result.errors.map((err, idx) => (
                                  <li key={idx} className="mb-1">{err}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {result.success > 0 && (
                    <p className="mt-4 text-sm text-green-600 italic bg-green-50 p-3 rounded">
                      Refreshing leaderboard in 3 seconds...
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-800 text-lg">Import Failed</p>
                    <p className="text-sm text-red-700 mt-2">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
