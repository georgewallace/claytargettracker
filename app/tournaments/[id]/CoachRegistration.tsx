'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface athlete {
  id: string
  user: {
    name: string
    email: string
  }
  team: {
    name: string
  } | null
}

interface Discipline {
  id: string
  displayName: string
}

interface CoachRegistrationProps {
  tournamentId: string
  allathletes: athlete[]
  registeredathleteIds: string[]
  tournamentDisciplines: Discipline[]
  userRole?: 'coach' | 'admin'
  isTeamRegistered?: boolean
}

export default function CoachRegistration({
  tournamentId,
  allathletes,
  registeredathleteIds,
  tournamentDisciplines,
  userRole,
  isTeamRegistered = false
}: CoachRegistrationProps) {
  const router = useRouter()
  const [selectedathleteIds, setSelectedathleteIds] = useState<string[]>([])
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    tournamentDisciplines.map(d => d.id) // Default: all disciplines
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [teamRegistering, setTeamRegistering] = useState(false)

  // Filter out already registered athletes
  const availableathletes = allathletes.filter(
    athlete => !registeredathleteIds.includes(athlete.id)
  )

  // Filter by search term
  const filteredathletes = availableathletes.filter(athlete => 
    athlete.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (athlete.team?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleathlete = (athleteId: string) => {
    setSelectedathleteIds(prev => 
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    )
  }

  const handleSelectAll = () => {
    setSelectedathleteIds(filteredathletes.map(s => s.id))
  }

  const handleDeselectAll = () => {
    setSelectedathleteIds([])
  }

  const toggleDiscipline = (disciplineId: string) => {
    setSelectedDisciplines(prev =>
      prev.includes(disciplineId)
        ? prev.filter(id => id !== disciplineId)
        : [...prev, disciplineId]
    )
  }

  const handleRegisterTeam = async () => {
    setTeamRegistering(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/register-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to register team')
        return
      }

      setSuccess(data.message)
      setTimeout(() => {
        router.refresh()
        setSuccess('')
      }, 3000)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setTeamRegistering(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedathleteIds.length === 0) {
      setError('Please select at least one athlete to mark your team as registered for this tournament')
      return
    }

    if (selectedDisciplines.length === 0) {
      setError('Please select at least one discipline')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/registrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          athleteIds: selectedathleteIds,
          disciplineIds: selectedDisciplines
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to register athletes')
        return
      }

      setSuccess(data.message + ' Other team athletes can now self-register!')
      setSelectedathleteIds([])
      setTimeout(() => {
        router.refresh()
        setSuccess('')
      }, 2000)
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {userRole === 'admin' ? 'Admin Registration' : 'Coach Registration'}
      </h2>
      <p className="text-gray-600 mb-4">
        {userRole === 'admin'
          ? 'Register any athlete for this tournament'
          : 'Register your team and/or individual athletes for this tournament'
        }
      </p>

      {/* Register Team Button - For coaches and admins who coach */}
      {!isTeamRegistered && allathletes.length > 0 && allathletes.some(a => a.team) && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleRegisterTeam}
            disabled={teamRegistering}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {teamRegistering ? 'Registering Team...' : '✓ Register Team (Athletes Can Then Self-Register)'}
          </button>
          <p className="text-sm text-gray-600 mt-2 text-center">
            This marks your team as registered. Athletes can then register themselves without selecting times first.
          </p>
        </div>
      )}

      {/* Team Already Registered Message - For coaches and admins who coach */}
      {isTeamRegistered && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-center font-medium">
            ✓ Your team is registered for this tournament
          </p>
          <p className="text-sm text-green-700 mt-2 text-center">
            Athletes can now self-register for this tournament
          </p>
        </div>
      )}

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">OR register specific athletes below</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Discipline Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Disciplines (athletes will be registered for these)
          </label>
          <div className="flex flex-wrap gap-3">
            {tournamentDisciplines.map(discipline => (
              <label
                key={discipline.id}
                className={`flex items-center px-4 py-2 border rounded-lg cursor-pointer transition ${
                  selectedDisciplines.includes(discipline.id)
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 hover:border-indigo-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDisciplines.includes(discipline.id)}
                  onChange={() => toggleDiscipline(discipline.id)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                />
                <span className="font-medium">{discipline.displayName}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search athletes by name, email, or team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition text-sm"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {/* athletes List */}
        {availableathletes.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {userRole === 'admin'
              ? 'All athletes are already registered for this tournament.'
              : 'No athletes available from your team(s). All your team members are already registered.'
            }
          </div>
        ) : filteredathletes.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No athletes match your search.
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {selectedathleteIds.length} athlete(s) selected
            </div>
            
            <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto mb-6">
              {filteredathletes.map((athlete) => (
                <label
                  key={athlete.id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedathleteIds.includes(athlete.id)}
                    onChange={() => handleToggleathlete(athlete.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">
                      {athlete.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {athlete.user.email}
                    </div>
                    {athlete.team && (
                      <div className="text-sm text-indigo-600 mt-1">
                        Team: {athlete.team.name}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || selectedathleteIds.length === 0}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading 
                ? 'Registering...' 
                : `Register ${selectedathleteIds.length} athlete${selectedathleteIds.length !== 1 ? 's' : ''}`
              }
            </button>
          </>
        )}
      </form>
    </div>
  )
}

