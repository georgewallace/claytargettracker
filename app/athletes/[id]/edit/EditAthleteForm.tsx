'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { gradeOptions, calculateDivision, divisionOptions } from '@/lib/divisions'

interface Athlete {
  id: string
  birthDay: number | null
  birthMonth: number | null
  birthYear: number | null
  gender: string | null
  nscaClass: string | null
  ataClass: string | null
  nssaClass: string | null
  ataNumber: string | null
  nscaNumber: string | null
  nssaNumber: string | null
  grade: string | null
  division: string | null
  divisionOverride: string | null
  isActive: boolean
  profilePictureUrl: string | null
  user: { name: string }
  team: { name: string } | null
}

interface EditAthleteFormProps {
  athlete: Athlete
}

const NSCA_CLASSES = ['D', 'C', 'B', 'A', 'AA', 'Master']
const ATA_CLASSES = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA']
const NSSA_CLASSES = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA']

export default function EditAthleteForm({ athlete }: EditAthleteFormProps) {
  const router = useRouter()

  const getBirthDateString = () => {
    if (athlete.birthYear && athlete.birthMonth && athlete.birthDay) {
      return `${athlete.birthYear}-${String(athlete.birthMonth).padStart(2, '0')}-${String(athlete.birthDay).padStart(2, '0')}`
    }
    return ''
  }

  const [formData, setFormData] = useState({
    birthDate: getBirthDateString(),
    gender: athlete.gender || '',
    grade: athlete.grade || '',
    divisionOverride: athlete.divisionOverride || '',
    isActive: athlete.isActive,
    nscaClass: athlete.nscaClass || '',
    ataClass: athlete.ataClass || '',
    nssaClass: athlete.nssaClass || '',
    ataNumber: athlete.ataNumber || '',
    nscaNumber: athlete.nscaNumber || '',
    nssaNumber: athlete.nssaNumber || '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(athlete.profilePictureUrl)
  const [uploadingPicture, setUploadingPicture] = useState(false)

  const calculatedDivision = calculateDivision(formData.grade)
  const effectiveDivision = formData.divisionOverride || calculatedDivision

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let birthDay = null, birthMonth = null, birthYear = null
      if (formData.birthDate) {
        const [year, month, day] = formData.birthDate.split('-')
        birthYear = parseInt(year)
        birthMonth = parseInt(month)
        birthDay = parseInt(day)
      }

      const response = await fetch(`/api/athletes/${athlete.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, birthDay, birthMonth, birthYear })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update athlete details')
        return
      }

      router.push('/teams/my-team')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB')
      return
    }

    setProfilePicture(file)
    const reader = new FileReader()
    reader.onloadend = () => setProfilePicturePreview(reader.result as string)
    reader.readAsDataURL(file)
    setError('')
  }

  const handleUploadPicture = async () => {
    if (!profilePicture) return
    setUploadingPicture(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', profilePicture)
      const response = await fetch(`/api/athletes/${athlete.id}/profile-picture`, { method: 'POST', body: fd })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Failed to upload profile picture'); return }
      router.refresh()
      setProfilePicture(null)
    } catch {
      setError('An error occurred while uploading. Please try again.')
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleRemovePicture = async () => {
    if (!confirm('Remove this profile picture?')) return
    setUploadingPicture(true)
    setError('')
    try {
      const response = await fetch(`/api/athletes/${athlete.id}/profile-picture`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) { setError(data.error || 'Failed to remove profile picture'); return }
      setProfilePicturePreview(null)
      setProfilePicture(null)
      router.refresh()
    } catch {
      setError('An error occurred while removing the picture. Please try again.')
    } finally {
      setUploadingPicture(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Profile Picture */}
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          {profilePicturePreview ? (
            <div className="relative">
              <img src={profilePicturePreview} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
              {profilePicturePreview === athlete.profilePictureUrl && (
                <button type="button" onClick={handleRemovePicture} disabled={uploadingPicture}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition disabled:opacity-50" title="Remove">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              {profilePicturePreview ? 'Change photo' : 'Upload photo'}
            </span>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleFileChange} className="sr-only" />
          </label>
          {profilePicture && (
            <button type="button" onClick={handleUploadPicture} disabled={uploadingPicture}
              className="text-sm px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition">
              {uploadingPicture ? 'Uploading…' : 'Save photo'}
            </button>
          )}
          <p className="text-xs text-gray-400">JPEG, PNG, GIF or WebP · 5MB max</p>
        </div>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select id="gender" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="">Select gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input id="birthDate" type="date" value={formData.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Grade / Level</label>
          <select id="grade" value={formData.grade} onChange={(e) => handleChange('grade', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="">Select grade</option>
            {gradeOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        <div>
          <div className="block text-sm font-medium text-gray-700 mb-1">Division</div>
          <div className="flex items-center h-[38px] px-3 border border-gray-200 bg-gray-50 rounded-md">
            <span className="text-sm font-semibold text-indigo-700">
              {effectiveDivision || <span className="text-gray-400 font-normal">Set by grade</span>}
            </span>
            {formData.divisionOverride && <span className="ml-2 text-xs text-orange-500">(override)</span>}
          </div>
        </div>
      </div>

      {/* Division Override */}
      <div>
        <label htmlFor="divisionOverride" className="block text-sm font-medium text-gray-700 mb-1">
          Division Override
          <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>
        </label>
        <select id="divisionOverride" value={formData.divisionOverride} onChange={(e) => handleChange('divisionOverride', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
          <option value="">Use auto-calculated division</option>
          {divisionOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Active status */}
      <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
        <div>
          <span className="text-sm font-medium text-gray-700">Active</span>
          <p className="text-xs text-gray-500 mt-0.5">
            {formData.isActive ? 'Can compete and be assigned to squads' : 'Hidden from squad assignments and registrations'}
          </p>
        </div>
        <button type="button" onClick={() => handleChange('isActive', !formData.isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-600' : 'bg-gray-300'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Classifications */}
      <div className="pt-1">
        <p className="text-sm font-medium text-gray-700 mb-3">Shooting Classifications</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nscaClass" className="block text-xs font-medium text-gray-600 mb-1">NSCA Class</label>
            <select id="nscaClass" value={formData.nscaClass} onChange={(e) => handleChange('nscaClass', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Select</option>
              {NSCA_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nscaNumber" className="block text-xs font-medium text-gray-600 mb-1">NSCA Number</label>
            <input id="nscaNumber" type="text" value={formData.nscaNumber} onChange={(e) => handleChange('nscaNumber', e.target.value)}
              placeholder="e.g., 123456" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label htmlFor="ataClass" className="block text-xs font-medium text-gray-600 mb-1">ATA Class</label>
            <select id="ataClass" value={formData.ataClass} onChange={(e) => handleChange('ataClass', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Select</option>
              {ATA_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ataNumber" className="block text-xs font-medium text-gray-600 mb-1">ATA Number</label>
            <input id="ataNumber" type="text" value={formData.ataNumber} onChange={(e) => handleChange('ataNumber', e.target.value)}
              placeholder="e.g., 123456" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label htmlFor="nssaClass" className="block text-xs font-medium text-gray-600 mb-1">NSSA Class</label>
            <select id="nssaClass" value={formData.nssaClass} onChange={(e) => handleChange('nssaClass', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Select</option>
              {NSSA_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nssaNumber" className="block text-xs font-medium text-gray-600 mb-1">NSSA Number</label>
            <input id="nssaNumber" type="text" value={formData.nssaNumber} onChange={(e) => handleChange('nssaNumber', e.target.value)}
              placeholder="e.g., 123456" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition text-sm">
          Cancel
        </button>
      </div>
    </form>
  )
}
