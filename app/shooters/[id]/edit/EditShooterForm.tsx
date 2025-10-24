'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { gradeOptions, monthOptions, getYearOptions, calculateDivision } from '@/lib/divisions'

interface Shooter {
  id: string
  birthMonth: number | null
  birthYear: number | null
  gender: string | null
  nscaClass: string | null
  ataClass: string | null
  grade: string | null
  division: string | null
  user: {
    name: string
  }
  team: {
    name: string
  } | null
}

interface EditShooterFormProps {
  shooter: Shooter
}

export default function EditShooterForm({ shooter }: EditShooterFormProps) {
  const router = useRouter()
  const yearOptions = getYearOptions()
  
  const [formData, setFormData] = useState({
    birthMonth: shooter.birthMonth?.toString() || '',
    birthYear: shooter.birthYear?.toString() || '',
    nscaClass: shooter.nscaClass || '',
    ataClass: shooter.ataClass || '',
    grade: shooter.grade || ''
  })
  
  const [calculatedDivision, setCalculatedDivision] = useState<string | null>(shooter.division)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Recalculate division when grade changes
  useEffect(() => {
    const division = calculateDivision(formData.grade)
    setCalculatedDivision(division)
  }, [formData.grade])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/shooters/${shooter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update shooter details')
        return
      }

      router.push('/teams/my-team')
      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Gender (Read-only for coaches) */}
      {shooter.gender && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Gender</div>
              <div className="text-xs text-gray-600 mt-1">Only the shooter can change this</div>
            </div>
            <div className="text-lg font-semibold text-gray-700">{shooter.gender}</div>
          </div>
        </div>
      )}

      {/* Birth Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Date of Birth
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="birthMonth" className="block text-xs text-gray-600 mb-1">
              Month
            </label>
            <select
              id="birthMonth"
              name="birthMonth"
              value={formData.birthMonth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Month</option>
              {monthOptions.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="birthYear" className="block text-xs text-gray-600 mb-1">
              Year
            </label>
            <select
              id="birthYear"
              name="birthYear"
              value={formData.birthYear}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Year</option>
              {yearOptions.map(year => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grade */}
      <div>
        <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
          Grade in School
        </label>
        <select
          id="grade"
          name="grade"
          value={formData.grade}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select Grade</option>
          {gradeOptions.map(grade => (
            <option key={grade.value} value={grade.value}>
              {grade.label}
            </option>
          ))}
        </select>
      </div>

      {/* Division (Auto-calculated, shown but not editable) */}
      {calculatedDivision && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-indigo-900">Division (Auto-calculated)</div>
              <div className="text-xs text-indigo-700 mt-1">Based on grade in school</div>
            </div>
            <div className="text-lg font-bold text-indigo-600">{calculatedDivision}</div>
          </div>
        </div>
      )}

      {/* NSCA Class */}
      <div>
        <label htmlFor="nscaClass" className="block text-sm font-medium text-gray-700 mb-2">
          NSCA Class
        </label>
        <input
          id="nscaClass"
          name="nscaClass"
          type="text"
          value={formData.nscaClass}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., A, B, C, D, E"
        />
        <p className="text-xs text-gray-500 mt-1">NSCA (National Sporting Clays Association) classification</p>
      </div>

      {/* ATA Class */}
      <div>
        <label htmlFor="ataClass" className="block text-sm font-medium text-gray-700 mb-2">
          ATA Class
        </label>
        <input
          id="ataClass"
          name="ataClass"
          type="text"
          value={formData.ataClass}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., AA, A, B, C, D"
        />
        <p className="text-xs text-gray-500 mt-1">ATA (Amateur Trapshooting Association) classification</p>
      </div>

      {/* Division Explanation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-900 mb-2">Division Categories:</div>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• <span className="font-medium">Novice:</span> 6th grade and below</li>
          <li>• <span className="font-medium">Intermediate:</span> 7th – 8th grade</li>
          <li>• <span className="font-medium">Junior Varsity:</span> 9th grade</li>
          <li>• <span className="font-medium">Senior:</span> 10th – 12th grade</li>
          <li>• <span className="font-medium">College-Trade School:</span> Post-high school</li>
        </ul>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

