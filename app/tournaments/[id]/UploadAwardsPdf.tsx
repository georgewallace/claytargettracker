'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tournamentId: string
  currentUrl: string | null
}

export default function UploadAwardsPdf({ tournamentId, currentUrl }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/awards-pdf`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
        return
      }

      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!confirm('Remove the awards PDF?')) return

    setError('')
    setDeleting(true)

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/awards-pdf`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Delete failed')
        return
      }

      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Awards PDF</h3>

      {error && (
        <p className="text-red-600 text-sm mb-3">{error}</p>
      )}

      {currentUrl ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-green-700 font-medium">PDF uploaded</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {deleting ? 'Removing...' : 'Remove'}
          </button>
          <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800">
            Replace
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">No PDF uploaded</span>
          <label className="cursor-pointer inline-flex items-center gap-1 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload PDF'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  )
}
