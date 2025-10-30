'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TeamLogo from '@/components/TeamLogo'

interface TeamLogoUploadProps {
  team: {
    id: string
    name: string
    logoUrl?: string | null
  }
}

export default function TeamLogoUpload({ team }: TeamLogoUploadProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(team.logoUrl || null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload an image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/teams/${team.id}/logo`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload logo')
      }

      // Refresh to show new logo
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
      setPreview(team.logoUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove the team logo?')) return

    setUploading(true)
    setError('')

    try {
      const response = await fetch(`/api/teams/${team.id}/logo`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove logo')
      }

      setPreview(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Logo</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex items-start gap-6">
        {/* Logo Preview */}
        <div className="flex-shrink-0">
          <TeamLogo 
            logoUrl={preview} 
            teamName={team.name} 
            size="xl"
          />
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <div className="space-y-4">
            <div>
              <label htmlFor="logo-upload" className="cursor-pointer">
                <span className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium">
                  {preview ? 'Change Logo' : 'Upload Logo'}
                </span>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </div>

            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium disabled:opacity-50"
              >
                Remove Logo
              </button>
            )}

            {uploading && (
              <div className="text-sm text-gray-600">
                Uploading...
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>• Maximum file size: 5MB</p>
              <p>• Accepted formats: JPEG, PNG, GIF, WebP</p>
              <p>• Recommended: Square image, at least 200x200px</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

