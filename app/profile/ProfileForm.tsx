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
  shooter: Shooter
}

const GRADES = ['6', '7', '8', '9', '10', '11', '12', 'College']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const NSCA_CLASSES = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA', 'Master']
const ATA_CLASSES = ['A', 'AA', 'AAA']
const NSSA_CLASSES = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA', 'Master']

export default function ProfileForm({ shooter }: ProfileFormProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    gender: shooter.gender || '',
    birthMonth: shooter.birthMonth || '',
    birthYear: shooter.birthYear || '',
    grade: shooter.grade || '',
    nscaClass: shooter.nscaClass || '',
    ataClass: shooter.ataClass || '',
    nssaClass: shooter.nssaClass || '',
    ataNumber: shooter.ataNumber || '',
    nscaNumber: shooter.nscaNumber || '',
    nssaNumber: shooter.nssaNumber || ''
  })
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shooter Profile Information</h2>
      
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
            <option value="Male">Male</option>
            <option value="Female">Female</option>
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
            onChange={(e) => handleChange('grade', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Grade</option>
            {GRADES.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        {/* Birth Month */}
        <div>
          <label htmlFor="birthMonth" className="block text-sm font-medium text-gray-700 mb-2">
            Birth Month
          </label>
          <select
            id="birthMonth"
            value={formData.birthMonth}
            onChange={(e) => handleChange('birthMonth', e.target.value ? parseInt(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Month</option>
            {MONTHS.map((month, idx) => (
              <option key={month} value={idx + 1}>{month}</option>
            ))}
          </select>
        </div>

        {/* Birth Year */}
        <div>
          <label htmlFor="birthYear" className="block text-sm font-medium text-gray-700 mb-2">
            Birth Year
          </label>
          <select
            id="birthYear"
            value={formData.birthYear}
            onChange={(e) => handleChange('birthYear', e.target.value ? parseInt(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Year</option>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
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
      {shooter.division && (
        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-indigo-900">Current Division</h4>
              <p className="text-lg font-bold text-indigo-700 mt-1">{shooter.division}</p>
            </div>
            <div className="text-xs text-indigo-600">
              Auto-calculated based on grade
            </div>
          </div>
        </div>
      )}

      {/* Team Display */}
      {shooter.team && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Team</h4>
              <p className="text-lg font-semibold text-gray-900 mt-1">{shooter.team.name}</p>
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
