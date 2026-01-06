'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { gradeOptions } from '@/lib/divisions'

interface athlete {
  id: string
  gender: string | null
  birthDay: number | null
  birthMonth: number | null
  birthYear: number | null
  grade: string | null
  division: string | null
  nscaClass: string | null
  ataClass: string | null
  nssaClass: string | null
  ataNumber: string | null
  nscaNumber: string | null
  nssaNumber: string | null
  user: {
    name: string
  }
  team?: {
    name: string
  } | null
}

interface ProfileFormProps {
  athlete: athlete
}

const NSCA_CLASSES = ['D', 'C', 'B', 'A', 'AA', 'Master']
const ATA_CLASSES = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA']
const NSSA_CLASSES = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA']

export default function ProfileForm({ athlete }: ProfileFormProps) {
  const router = useRouter()

  // Convert birth fields to date string (YYYY-MM-DD) for date input
  const getBirthDateString = () => {
    if (athlete.birthYear && athlete.birthMonth && athlete.birthDay) {
      const year = athlete.birthYear
      const month = String(athlete.birthMonth).padStart(2, '0')
      const day = String(athlete.birthDay).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return ''
  }

  const [formData, setFormData] = useState({
    gender: athlete.gender || '',
    birthDate: getBirthDateString(),
    grade: athlete.grade || '',
    nscaClass: athlete.nscaClass || '',
    ataClass: athlete.ataClass || '',
    nssaClass: athlete.nssaClass || '',
    ataNumber: athlete.ataNumber || '',
    nscaNumber: athlete.nscaNumber || '',
    nssaNumber: athlete.nssaNumber || ''
  })

  const [firstYearCompetition, setFirstYearCompetition] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Parse birth date into day, month, year
      let birthDay = null, birthMonth = null, birthYear = null
      if (formData.birthDate) {
        const [year, month, day] = formData.birthDate.split('-')
        birthYear = parseInt(year)
        birthMonth = parseInt(month)
        birthDay = parseInt(day)
      }

      const submitData = {
        ...formData,
        birthDay,
        birthMonth,
        birthYear,
        firstYearCompetition
      }

      const response = await fetch(`/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully!')
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i - 10)

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Athlete profile information</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Required for tournament HOA calculations
          </p>
        </div>

        {/* Grade */}
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
            Grade/Level
          </label>
          <select
            id="grade"
            value={formData.grade}
            onChange={(e) => {
              handleChange('grade', e.target.value)
              // Reset first year competition when grade changes
              setFirstYearCompetition(null)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Grade</option>
            {gradeOptions.map(grade => (
              <option key={grade.value} value={grade.value}>{grade.label}</option>
            ))}
          </select>
        </div>

        {/* First Year Competition - Only show for 10th-12th grade */}
        {['10', '11', '12'].includes(formData.grade) && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is this your first year competing in high school? *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="firstYear"
                  required
                  checked={firstYearCompetition === true}
                  onChange={() => setFirstYearCompetition(true)}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-gray-900 font-medium">Yes</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="firstYear"
                  required
                  checked={firstYearCompetition === false}
                  onChange={() => setFirstYearCompetition(false)}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-gray-900 font-medium">No</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This determines your division (Junior Varsity for first year, Varsity otherwise)
            </p>
          </div>
        )}

        {/* Birth Date */}
        <div className="md:col-span-2">
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Date of birth cannot be changed after account creation
          </p>
        </div>

        {/* Organization Classifications */}
        <div className="md:col-span-2 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shooting Classifications</h3>
        </div>

        {/* NSCA Class */}
        <div>
          <label htmlFor="nscaClass" className="block text-sm font-medium text-gray-700 mb-2">
            NSCA Classification
          </label>
          <select
            id="nscaClass"
            value={formData.nscaClass}
            onChange={(e) => handleChange('nscaClass', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Class</option>
            {NSCA_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* NSCA Number */}
        <div>
          <label htmlFor="nscaNumber" className="block text-sm font-medium text-gray-700 mb-2">
            NSCA Membership Number
          </label>
          <input
            type="text"
            id="nscaNumber"
            value={formData.nscaNumber}
            onChange={(e) => handleChange('nscaNumber', e.target.value)}
            placeholder="e.g., 123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* ATA Class */}
        <div>
          <label htmlFor="ataClass" className="block text-sm font-medium text-gray-700 mb-2">
            ATA Classification
          </label>
          <select
            id="ataClass"
            value={formData.ataClass}
            onChange={(e) => handleChange('ataClass', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Class</option>
            {ATA_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* ATA Number */}
        <div>
          <label htmlFor="ataNumber" className="block text-sm font-medium text-gray-700 mb-2">
            ATA Membership Number
          </label>
          <input
            type="text"
            id="ataNumber"
            value={formData.ataNumber}
            onChange={(e) => handleChange('ataNumber', e.target.value)}
            placeholder="e.g., 123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* NSSA Class */}
        <div>
          <label htmlFor="nssaClass" className="block text-sm font-medium text-gray-700 mb-2">
            NSSA Classification
          </label>
          <select
            id="nssaClass"
            value={formData.nssaClass}
            onChange={(e) => handleChange('nssaClass', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Class</option>
            {NSSA_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* NSSA Number */}
        <div>
          <label htmlFor="nssaNumber" className="block text-sm font-medium text-gray-700 mb-2">
            NSSA Membership Number
          </label>
          <input
            type="text"
            id="nssaNumber"
            value={formData.nssaNumber}
            onChange={(e) => handleChange('nssaNumber', e.target.value)}
            placeholder="e.g., 123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Division Display */}
      {athlete.division && (
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-indigo-900">Current Division</h4>
              <p className="text-lg font-bold text-indigo-700 mt-1">{athlete.division}</p>
            </div>
            <div className="text-xs text-indigo-600">
              Auto-calculated based on grade
            </div>
          </div>
        </div>
      )}

      {/* Team Display */}
      {athlete.team && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Team</h4>
              <p className="text-lg font-semibold text-gray-900 mt-1">{athlete.team.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading || !formData.gender}
          className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        * Required fields must be completed
      </p>
    </form>
  )
}
