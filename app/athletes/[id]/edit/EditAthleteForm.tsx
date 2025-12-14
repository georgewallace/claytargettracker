'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { gradeOptions, monthOptions, getYearOptions, calculateDivision, divisionOptions } from '@/lib/divisions'

interface Athlete {
  id: string
  birthMonth: number | null
  birthYear: number | null
  gender: string | null
  nscaClass: string | null
  ataClass: string | null
  grade: string | null
  division: string | null
  divisionOverride: string | null
  isActive: boolean
  profilePictureUrl: string | null
  user: {
    name: string
  }
  team: {
    name: string
  } | null
}

interface EditAthleteFormProps {
  athlete: Athlete
}

export default function EditAthleteForm({ athlete }: EditAthleteFormProps) {
  const router = useRouter()
  const yearOptions = getYearOptions()
  
  const [formData, setFormData] = useState({
    birthMonth: athlete.birthMonth?.toString() || '',
    birthYear: athlete.birthYear?.toString() || '',
    nscaClass: athlete.nscaClass || '',
    ataClass: athlete.ataClass || '',
    grade: athlete.grade || '',
    divisionOverride: athlete.divisionOverride || '',
    isActive: athlete.isActive
  })
  
  const [calculatedDivision, setCalculatedDivision] = useState<string | null>(athlete.division)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(athlete.profilePictureUrl)
  const [uploadingPicture, setUploadingPicture] = useState(false)

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
      const response = await fetch(`/api/athletes/${athlete.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update athlete details')
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 5MB')
        return
      }

      setProfilePicture(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const handleUploadPicture = async () => {
    if (!profilePicture) return

    setUploadingPicture(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', profilePicture)

      const response = await fetch(`/api/athletes/${athlete.id}/profile-picture`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload profile picture')
        return
      }

      // Success - refresh the page
      router.refresh()
      setProfilePicture(null)
    } catch (error) {
      setError('An error occurred while uploading. Please try again.')
    } finally {
      setUploadingPicture(false)
    }
  }

  const handleRemovePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return

    setUploadingPicture(true)
    setError('')

    try {
      const response = await fetch(`/api/athletes/${athlete.id}/profile-picture`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to remove profile picture')
        return
      }

      // Success - clear preview and refresh
      setProfilePicturePreview(null)
      setProfilePicture(null)
      router.refresh()
    } catch (error) {
      setError('An error occurred while removing the picture. Please try again.')
    } finally {
      setUploadingPicture(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Profile Picture */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-900 mb-4">
          Profile Picture
        </label>
        
        <div className="flex items-start gap-6">
          {/* Preview */}
          <div className="flex-shrink-0">
            {profilePicturePreview ? (
              <div className="relative">
                <img
                  src={profilePicturePreview}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                />
                {profilePicturePreview === athlete.profilePictureUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePicture}
                    disabled={uploadingPicture}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition disabled:opacity-50"
                    title="Remove picture"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1">
            <div className="space-y-3">
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-600
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100
                    file:cursor-pointer cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-2">
                  JPEG, PNG, GIF, or WebP. Max 5MB.
                </p>
              </div>

              {profilePicture && (
                <button
                  type="button"
                  onClick={handleUploadPicture}
                  disabled={uploadingPicture}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {uploadingPicture ? 'Uploading...' : 'Upload Picture'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gender (Read-only for coaches) */}
      {athlete.gender && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Gender</div>
              <div className="text-xs text-gray-600 mt-1">Only the athlete can change this</div>
            </div>
            <div className="text-lg font-semibold text-gray-700">{athlete.gender}</div>
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

      {/* Division Override */}
      <div>
        <label htmlFor="divisionOverride" className="block text-sm font-medium text-gray-700 mb-2">
          Division Override (Optional)
        </label>
        <select
          id="divisionOverride"
          name="divisionOverride"
          value={formData.divisionOverride}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Use Auto-calculated Division</option>
          {divisionOptions.map(division => (
            <option key={division.value} value={division.value}>
              {division.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Manually override the auto-calculated division. Leave empty to use the auto-calculated value.
          {formData.divisionOverride && (
            <span className="text-orange-600 font-medium ml-1">
              (Using override: {formData.divisionOverride})
            </span>
          )}
        </p>
      </div>

      {/* Active Status */}
      <div className={`border rounded-lg p-4 ${formData.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-300'}`}>
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="isActive" className="text-sm font-medium text-gray-900">
              Athlete Status
            </label>
            <p className="text-xs text-gray-600 mt-1">
              {formData.isActive
                ? 'Active athletes can compete and be assigned to squads'
                : 'Inactive athletes are hidden from squad assignments and new registrations'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isActive ? 'bg-green-600' : 'bg-gray-400'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="mt-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            formData.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {formData.isActive ? '● Active' : '○ Inactive'}
          </span>
        </div>
      </div>

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
          <li>• <span className="font-medium">Varsity:</span> 10th – 12th grade</li>
          <li>• <span className="font-medium">Collegiate:</span> Post-high school</li>
          <li className="text-xs text-gray-500 italic mt-2">• <span className="font-medium">Open/Unassigned:</span> For squadding purposes only</li>
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

