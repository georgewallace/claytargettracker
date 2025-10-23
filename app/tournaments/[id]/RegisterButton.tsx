'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Discipline {
  id: string
  displayName: string
}

interface RegisterButtonProps {
  tournamentId: string
  shooterId: string
  tournamentDisciplines: Discipline[]
}

export default function RegisterButton({ tournamentId, shooterId, tournamentDisciplines }: RegisterButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    tournamentDisciplines.map(d => d.id) // Default: all disciplines
  )

  const handleRegister = async () => {
    if (selectedDisciplines.length === 0) {
      setError('Please select at least one discipline')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tournamentId, 
          shooterId,
          disciplineIds: selectedDisciplines
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to register')
        return
      }

      setShowModal(false)
      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleDiscipline = (disciplineId: string) => {
    setSelectedDisciplines(prev =>
      prev.includes(disciplineId)
        ? prev.filter(id => id !== disciplineId)
        : [...prev, disciplineId]
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
      >
        Register for Tournament
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Select Disciplines
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <p className="text-gray-600 mb-4">
              Choose which disciplines you want to compete in:
            </p>

            <div className="space-y-3 mb-6">
              {tournamentDisciplines.map(discipline => (
                <label
                  key={discipline.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    selectedDisciplines.includes(discipline.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDisciplines.includes(discipline.id)}
                    onChange={() => toggleDiscipline(discipline.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-3 font-medium text-gray-900">
                    {discipline.displayName}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRegister}
                disabled={loading || selectedDisciplines.length === 0}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setError('')
                }}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
