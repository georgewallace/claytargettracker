'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { gradeOptions, divisionOptions, calculateDivision } from '@/lib/divisions'

interface athlete {
  id: string
  gender: string | null
  birthDay: number | null
  birthMonth: number | null
  birthYear: number | null
  grade: string | null
  division: string | null
  divisionOverride: string | null
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
    divisionOverride: athlete.divisionOverride || '',
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

  const calculatedDivision = calculateDivision(formData.grade)
  const effectiveDivision = formData.divisionOverride || calculatedDivision

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      let birthDay = null, birthMonth = null, birthYear = null
      if (formData.birthDate) {
        const [year, month, day] = formData.birthDate.split('-')
        birthYear = parseInt(year)
        birthMonth = parseInt(month)
        birthDay = parseInt(day)
      }

      const response = await fetch(`/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, birthDay, birthMonth, birthYear, firstYearCompetition })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully!')
      setTimeout(() => router.refresh(), 500)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            required
          >
            <option value="">Select gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>

        {/* Birth Date */}
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth
          </label>
          <input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Grade */}
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
            Grade / Level
          </label>
          <select
            id="grade"
            value={formData.grade}
            onChange={(e) => {
              handleChange('grade', e.target.value)
              setFirstYearCompetition(null)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">Select grade</option>
            {gradeOptions.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        {/* Division display */}
        <div>
          <div className="block text-sm font-medium text-gray-700 mb-1">Division</div>
          <div className="flex items-center h-[38px] px-3 border border-gray-200 bg-gray-50 rounded-md">
            <span className="text-sm font-semibold text-indigo-700">
              {effectiveDivision || <span className="text-gray-400 font-normal">Set by grade</span>}
            </span>
            {formData.divisionOverride && (
              <span className="ml-2 text-xs text-orange-600">(override)</span>
            )}
          </div>
        </div>
      </div>

      {/* First year competition */}
      {['10', '11', '12'].includes(formData.grade) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Is this your first year competing in high school? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="firstYear" required checked={firstYearCompetition === true} onChange={() => setFirstYearCompetition(true)} className="mr-2 h-4 w-4" />
              <span className="text-sm text-gray-900 font-medium">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="firstYear" required checked={firstYearCompetition === false} onChange={() => setFirstYearCompetition(false)} className="mr-2 h-4 w-4" />
              <span className="text-sm text-gray-900 font-medium">No</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">First year = Junior Varsity, otherwise Varsity</p>
        </div>
      )}

      {/* Division Override */}
      <div>
        <label htmlFor="divisionOverride" className="block text-sm font-medium text-gray-700 mb-1">
          Division Override
          <span className="ml-1 text-xs font-normal text-gray-500">(optional — contact your coach before changing)</span>
        </label>
        <select
          id="divisionOverride"
          value={formData.divisionOverride}
          onChange={(e) => handleChange('divisionOverride', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="">Use auto-calculated division</option>
          {divisionOptions.map(d => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Classifications */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Shooting Classifications</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nscaClass" className="block text-xs font-medium text-gray-600 mb-1">NSCA Class</label>
            <select id="nscaClass" value={formData.nscaClass} onChange={(e) => handleChange('nscaClass', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Select</option>
              {NSCA_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nscaNumber" className="block text-xs font-medium text-gray-600 mb-1">NSCA Number</label>
            <input id="nscaNumber" type="text" value={formData.nscaNumber} onChange={(e) => handleChange('nscaNumber', e.target.value)} placeholder="e.g., 123456" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label htmlFor="ataClass" className="block text-xs font-medium text-gray-600 mb-1">ATA Class</label>
            <select id="ataClass" value={formData.ataClass} onChange={(e) => handleChange('ataClass', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Select</option>
              {ATA_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ataNumber" className="block text-xs font-medium text-gray-600 mb-1">ATA Number</label>
            <input id="ataNumber" type="text" value={formData.ataNumber} onChange={(e) => handleChange('ataNumber', e.target.value)} placeholder="e.g., 123456" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label htmlFor="nssaClass" className="block text-xs font-medium text-gray-600 mb-1">NSSA Class</label>
            <select id="nssaClass" value={formData.nssaClass} onChange={(e) => handleChange('nssaClass', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Select</option>
              {NSSA_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nssaNumber" className="block text-xs font-medium text-gray-600 mb-1">NSSA Number</label>
            <input id="nssaNumber" type="text" value={formData.nssaNumber} onChange={(e) => handleChange('nssaNumber', e.target.value)} placeholder="e.g., 123456" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || !formData.gender}
          className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          {loading ? 'Saving…' : 'Save Shooting Profile'}
        </button>
      </div>
    </form>
  )
}
