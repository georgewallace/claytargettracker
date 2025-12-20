'use client'

import { useState } from 'react'

interface BulkImportButtonProps {
  type: 'athletes' | 'coaches'
}

interface ImportResult {
  success: number
  skipped: number
  created: string[]
  errors: string[]
}

export default function BulkImportButton({ type }: BulkImportButtonProps) {
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
      formData.append('type', type)

      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Import failed')
      }

      const data = await response.json()
      setResult(data)

      // Refresh page after successful import
      if (data.success > 0) {
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import users')
    } finally {
      setLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const label = type === 'athletes' ? 'Athletes' : 'Coaches'

  return (
    <div>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        disabled={loading}
        className="hidden"
        id={`bulk-import-${type}`}
      />
      <label
        htmlFor={`bulk-import-${type}`}
        className={`inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-medium text-sm cursor-pointer ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {loading ? `Importing ${label}...` : `Bulk Import ${label}`}
      </label>

      {/* Expected Format Guide */}
      <div className="mt-2 text-xs text-gray-600">
        <details className="cursor-pointer">
          <summary className="font-medium hover:text-gray-900">Expected Excel Format</summary>
          <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
            {type === 'athletes' ? (
              <div className="space-y-1">
                <p className="font-medium">Required columns:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>First Name</li>
                  <li>Last Name</li>
                </ul>
                <p className="font-medium mt-2">Optional columns:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Email</li>
                  <li>Team</li>
                  <li>Grade (6, 7, 8, 9, 10, 11, 12, College)</li>
                  <li>Gender (male, female)</li>
                  <li>NSCA Class</li>
                  <li>ATA Class</li>
                  <li>NSSA Class</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Note: If no email provided, a placeholder will be created (name@placeholder.local)
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">Required columns:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>First Name</li>
                  <li>Last Name</li>
                  <li>Team</li>
                </ul>
                <p className="font-medium mt-2">Optional columns:</p>
                <ul className="list-disc list-inside ml-2">
                  <li>Email</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Note: If no email provided, a placeholder will be created (name@placeholder.local)
                </p>
              </div>
            )}
          </div>
        </details>
      </div>

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
                  ✓ {result.success} {label.toLowerCase()} imported
                </p>
                {result.created.length > 0 && (
                  <p className="text-green-700">
                    ✓ {result.created.length} new entries created
                  </p>
                )}
                {result.skipped > 0 && (
                  <p className="text-gray-600">
                    ⊘ {result.skipped} rows skipped (already exist or invalid)
                  </p>
                )}
              </div>
            </div>
            {(result.created.length > 0 || result.errors.length > 0) && (
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
              {result.created.length > 0 && (
                <div>
                  <p className="font-medium text-green-800 mb-1">
                    Created ({result.created.length}):
                  </p>
                  <ul className="list-disc list-inside text-xs text-green-700 max-h-40 overflow-y-auto bg-white/50 p-2 rounded">
                    {result.created.map((name, idx) => (
                      <li key={idx}>{name}</li>
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
              Refreshing page in 3 seconds...
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
