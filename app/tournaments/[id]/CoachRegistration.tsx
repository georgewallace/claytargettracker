'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Shooter {
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
  allShooters: Shooter[]
  registeredShooterIds: string[]
  tournamentDisciplines: Discipline[]
  userRole?: 'coach' | 'admin'
}

export default function CoachRegistration({
  tournamentId,
  allShooters,
  registeredShooterIds,
  tournamentDisciplines,
  userRole
}: CoachRegistrationProps) {
  const router = useRouter()
  const [selectedShooterIds, setSelectedShooterIds] = useState<string[]>([])
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    tournamentDisciplines.map(d => d.id) // Default: all disciplines
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter out already registered shooters
  const availableShooters = allShooters.filter(
    shooter => !registeredShooterIds.includes(shooter.id)
  )

  // Filter by search term
  const filteredShooters = availableShooters.filter(shooter => 
    shooter.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shooter.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shooter.team?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleShooter = (shooterId: string) => {
    setSelectedShooterIds(prev => 
      prev.includes(shooterId)
        ? prev.filter(id => id !== shooterId)
        : [...prev, shooterId]
    )
  }

  const handleSelectAll = () => {
    setSelectedShooterIds(filteredShooters.map(s => s.id))
  }

  const handleDeselectAll = () => {
    setSelectedShooterIds([])
  }

  const toggleDiscipline = (disciplineId: string) => {
    setSelectedDisciplines(prev =>
      prev.includes(disciplineId)
        ? prev.filter(id => id !== disciplineId)
        : [...prev, disciplineId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedShooterIds.length === 0) {
      setError('Please select at least one shooter')
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
          shooterIds: selectedShooterIds,
          disciplineIds: selectedDisciplines
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to register shooters')
        return
      }

      setSuccess(data.message)
      setSelectedShooterIds([])
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
      <p className="text-gray-600 mb-6">
        {userRole === 'admin'
          ? 'Register any shooter for this tournament'
          : 'Register shooters from your team(s) for this tournament'
        }
      </p>

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
            Disciplines (shooters will be registered for these)
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
            placeholder="Search shooters by name, email, or team..."
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

        {/* Shooters List */}
        {availableShooters.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {userRole === 'admin'
              ? 'All shooters are already registered for this tournament.'
              : 'No shooters available from your team(s). All your team members are already registered.'
            }
          </div>
        ) : filteredShooters.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No shooters match your search.
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {selectedShooterIds.length} shooter(s) selected
            </div>
            
            <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto mb-6">
              {filteredShooters.map((shooter) => (
                <label
                  key={shooter.id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedShooterIds.includes(shooter.id)}
                    onChange={() => handleToggleShooter(shooter.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">
                      {shooter.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {shooter.user.email}
                    </div>
                    {shooter.team && (
                      <div className="text-sm text-indigo-600 mt-1">
                        Team: {shooter.team.name}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || selectedShooterIds.length === 0}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading 
                ? 'Registering...' 
                : `Register ${selectedShooterIds.length} Shooter${selectedShooterIds.length !== 1 ? 's' : ''}`
              }
            </button>
          </>
        )}
      </form>
    </div>
  )
}

