'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Shooter {
  id: string
  gender: string | null
  birthMonth: number | null
  birthYear: number | null
  grade: string | null
  division: string | null
  nscaClass: string | null
  ataClass: string | null
  user: {
    name: string
  }
}

interface ProfileFormProps {
  shooter: Shooter
}

export default function ProfileForm({ shooter }: ProfileFormProps) {
  const router = useRouter()
  
  const [gender, setGender] = useState(shooter.gender || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`/api/profile/gender`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update gender')
        return
      }

      setSuccess('Gender updated successfully!')
      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Gender Selection */}
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
          Gender
        </label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Used for tournament High Over All (HOA) award calculations
        </p>
      </div>

      {/* Display other profile info (read-only) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="text-sm font-medium text-gray-900 mb-2">Shooter Information</div>
        
        {shooter.division && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Division:</span>
            <span className="font-medium text-gray-900">{shooter.division}</span>
          </div>
        )}
        
        {shooter.grade && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Grade:</span>
            <span className="font-medium text-gray-900">{shooter.grade}</span>
          </div>
        )}
        
        {shooter.nscaClass && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">NSCA Class:</span>
            <span className="font-medium text-gray-900">{shooter.nscaClass}</span>
          </div>
        )}
        
        {shooter.ataClass && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">ATA Class:</span>
            <span className="font-medium text-gray-900">{shooter.ataClass}</span>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
          Your coach can update other details like grade, birth date, and classifications.
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading || !gender}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? 'Saving...' : 'Save Gender'}
        </button>
      </div>
    </form>
  )
}

