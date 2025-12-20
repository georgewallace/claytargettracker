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

      // Refresh page after successful import to update leaderboard
      if (data.success > 0) {
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import scores')
    } finally {
      setLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  return (
    <div>
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

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Import Complete!
              </h4>
              <div className="space-y-1 text-sm">
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
            {(result.updated.length > 0 || result.errors.length > 0) && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            )}
          </div>

          {showDetails && (
            <div className="mt-4 space-y-3">
              {result.updated.length > 0 && (
                <div>
                  <p className="font-medium text-green-800 mb-1">
                    Updated ({result.updated.length}):
                  </p>
                  <ul className="list-disc list-inside text-xs text-green-700 max-h-40 overflow-y-auto bg-white/50 p-2 rounded">
                    {result.updated.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <p className="font-medium text-orange-800 mb-1">
                    ⚠ Errors ({result.errors.length}):
                  </p>
                  <ul className="list-disc list-inside text-xs text-orange-700 max-h-40 overflow-y-auto bg-white/50 p-2 rounded">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result.success > 0 && (
            <p className="mt-3 text-sm text-green-600 italic">
              Refreshing leaderboard in 3 seconds...
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-red-800">Import Failed</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
