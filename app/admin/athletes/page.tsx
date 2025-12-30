'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { divisionOptions, gradeOptions } from '@/lib/divisions'

interface Athlete {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  team: {
    id: string
    name: string
  } | null
  division: string | null
  divisionOverride: string | null
  calculatedDivision: string | null
  birthMonth: number | null
  birthDay: number | null
  birthYear: number | null
  grade: string | null
  isActive: boolean
}

export default function ManageAthletesPage() {
  const router = useRouter()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('')
  const [teams, setTeams] = useState<Array<{id: string, name: string}>>([])
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state for editing
  const [editedDivisionOverride, setEditedDivisionOverride] = useState<string>('')
  const [editedGrade, setEditedGrade] = useState<string>('')
  const [editedBirthMonth, setEditedBirthMonth] = useState<string>('')
  const [editedBirthDay, setEditedBirthDay] = useState<string>('')
  const [editedBirthYear, setEditedBirthYear] = useState<string>('')

  useEffect(() => {
    fetchAthletes()
    fetchTeams()
  }, [])

  useEffect(() => {
    filterAthletes()
  }, [athletes, searchTerm, teamFilter, divisionFilter])

  const fetchAthletes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/athletes')
      if (!response.ok) throw new Error('Failed to fetch athletes')
      const data = await response.json()
      setAthletes(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load athletes')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (!response.ok) throw new Error('Failed to fetch teams')
      const data = await response.json()
      setTeams(data || [])
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    }
  }

  const filterAthletes = () => {
    let filtered = [...athletes]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Team filter
    if (teamFilter) {
      if (teamFilter === 'unaffiliated') {
        filtered = filtered.filter(a => !a.team)
      } else {
        filtered = filtered.filter(a => a.team?.id === teamFilter)
      }
    }

    // Division filter
    if (divisionFilter) {
      filtered = filtered.filter(a => {
        const effectiveDivision = a.divisionOverride || a.calculatedDivision
        return effectiveDivision === divisionFilter
      })
    }

    setFilteredAthletes(filtered)
  }

  const handleEditClick = (athlete: Athlete) => {
    setEditingAthlete(athlete)
    setEditedDivisionOverride(athlete.divisionOverride || '')
    setEditedGrade(athlete.grade || '')
    setEditedBirthMonth(athlete.birthMonth?.toString() || '')
    setEditedBirthDay(athlete.birthDay?.toString() || '')
    setEditedBirthYear(athlete.birthYear?.toString() || '')
    setShowEditModal(true)
    setError('')
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditingAthlete(null)
    setEditedDivisionOverride('')
    setEditedGrade('')
    setEditedBirthMonth('')
    setEditedBirthDay('')
    setEditedBirthYear('')
    setError('')
  }

  const handleSaveEdit = async () => {
    if (!editingAthlete) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/athletes/${editingAthlete.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisionOverride: editedDivisionOverride || null,
          grade: editedGrade || null,
          birthMonth: editedBirthMonth ? parseInt(editedBirthMonth) : null,
          birthDay: editedBirthDay ? parseInt(editedBirthDay) : null,
          birthYear: editedBirthYear ? parseInt(editedBirthYear) : null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update athlete')
      }

      await fetchAthletes()
      handleCancelEdit()
    } catch (err: any) {
      setError(err.message || 'Failed to update athlete')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Athletes</h1>
              <p className="mt-2 text-sm text-gray-600">
                Edit athlete information including division overrides and age data
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
                <option value="unaffiliated">Unaffiliated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Division
              </label>
              <select
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Divisions</option>
                {divisionOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Athletes List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredAthletes.length}</span> of <span className="font-medium">{athletes.length}</span> athletes
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {filteredAthletes.map((athlete) => {
              const effectiveDivision = athlete.divisionOverride || athlete.calculatedDivision
              return (
                <li key={athlete.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {athlete.user.name}
                        </h3>
                        {!athlete.isActive && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Email:</span> {athlete.user.email}
                        </p>
                        <p>
                          <span className="font-medium">Team:</span> {athlete.team?.name || 'Unaffiliated'}
                        </p>
                        <div className="flex items-center gap-4">
                          <p>
                            <span className="font-medium">Division:</span>{' '}
                            {effectiveDivision || 'Not set'}
                            {athlete.divisionOverride && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                Override
                              </span>
                            )}
                          </p>
                          <p>
                            <span className="font-medium">Grade:</span> {athlete.grade || 'Not set'}
                          </p>
                          {athlete.birthYear && (
                            <p>
                              <span className="font-medium">Birth Date:</span>{' '}
                              {athlete.birthMonth && athlete.birthDay
                                ? `${athlete.birthMonth}/${athlete.birthDay}/${athlete.birthYear}`
                                : athlete.birthYear
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditClick(athlete)}
                      className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Edit Modal */}
        {showEditModal && editingAthlete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Edit Athlete: {editingAthlete.user.name}
                  </h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 transition"
                    disabled={saving}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Division Override */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Division Override
                    </label>
                    <select
                      value={editedDivisionOverride}
                      onChange={(e) => setEditedDivisionOverride(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={saving}
                    >
                      <option value="">Use Calculated Division</option>
                      {divisionOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Current calculated division: {editingAthlete.calculatedDivision || 'Not calculated'}
                    </p>
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade
                    </label>
                    <select
                      value={editedGrade}
                      onChange={(e) => setEditedGrade(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={saving}
                    >
                      <option value="">Select grade...</option>
                      {gradeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Birth Date
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Month</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={editedBirthMonth}
                          onChange={(e) => setEditedBirthMonth(e.target.value)}
                          placeholder="MM"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Day</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editedBirthDay}
                          onChange={(e) => setEditedBirthDay(e.target.value)}
                          placeholder="DD"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Year</label>
                        <input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          value={editedBirthYear}
                          onChange={(e) => setEditedBirthYear(e.target.value)}
                          placeholder="YYYY"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
