'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { affiliationOptions } from '@/lib/divisions'

interface CreateTeamFormProps {
  onSuccess?: () => void
}

export default function CreateTeamForm({ onSuccess }: CreateTeamFormProps = {}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [headCoach, setHeadCoach] = useState('')
  const [headCoachEmail, setHeadCoachEmail] = useState('')
  const [headCoachPhone, setHeadCoachPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          affiliation: affiliation || null,
          headCoach: headCoach || null,
          headCoachEmail: headCoachEmail || null,
          headCoachPhone: headCoachPhone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create team')
        return
      }

      setName('')
      setAffiliation('')
      setHeadCoach('')
      setHeadCoachEmail('')
      setHeadCoachPhone('')
      setAddress('')
      setCity('')
      setState('')
      setZip('')
      router.refresh()

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="teamName" className="block text-xs font-medium text-gray-700 mb-1">
            Team Name
          </label>
          <input
            id="teamName"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter team name..."
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="affiliation" className="block text-xs font-medium text-gray-700 mb-1">
            Affiliation (Optional)
          </label>
          <select
            id="affiliation"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select...</option>
            {affiliationOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700 mb-1">Head Coach (Optional)</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="headCoach" className="block text-xs font-medium text-gray-600 mb-1">
            Name
          </label>
          <input
            id="headCoach"
            type="text"
            value={headCoach}
            onChange={(e) => setHeadCoach(e.target.value)}
            placeholder="John Smith"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="headCoachEmail" className="block text-xs font-medium text-gray-600 mb-1">
            Email
          </label>
          <input
            id="headCoachEmail"
            type="email"
            value={headCoachEmail}
            onChange={(e) => setHeadCoachEmail(e.target.value)}
            placeholder="coach@email.com"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="headCoachPhone" className="block text-xs font-medium text-gray-600 mb-1">
            Phone
          </label>
          <input
            id="headCoachPhone"
            type="tel"
            value={headCoachPhone}
            onChange={(e) => setHeadCoachPhone(e.target.value)}
            placeholder="555-123-4567"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700 mb-1">Address (Optional)</h3>
      </div>

      <div>
        <label htmlFor="address" className="block text-xs font-medium text-gray-600 mb-1">
          Street
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St"
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-6 gap-2">
        <div className="col-span-3">
          <label htmlFor="city" className="block text-xs font-medium text-gray-600 mb-1">
            City
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Springfield"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="state" className="block text-xs font-medium text-gray-600 mb-1">
            State
          </label>
          <input
            id="state"
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase())}
            placeholder="IL"
            maxLength={2}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="zip" className="block text-xs font-medium text-gray-600 mb-1">
            ZIP
          </label>
          <input
            id="zip"
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="62701"
            maxLength={10}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white px-4 py-1.5 text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Creating...' : 'Create Team'}
        </button>
      </div>
    </form>
  )
}

