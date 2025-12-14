'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TimeSlotSelector from './TimeSlotSelector'

interface Discipline {
  id: string
  displayName: string
}

interface RegisterButtonProps {
  tournamentId: string
  athleteId: string
  tournamentDisciplines: Discipline[]
}

type RegistrationStep = 'disciplines' | 'timeslots'

export default function RegisterButton({ tournamentId, athleteId, tournamentDisciplines }: RegisterButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<RegistrationStep>('disciplines')
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(
    tournamentDisciplines.map(d => d.id) // Default: all disciplines
  )
  const [timeSlotSelections, setTimeSlotSelections] = useState<{[disciplineId: string]: string[]}>({})
  const [checkingTeamStatus, setCheckingTeamStatus] = useState(false)
  const [teamNotRegistered, setTeamNotRegistered] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false) // New: Track registration status optimistically

  const checkTeamRegistration = async () => {
    setCheckingTeamStatus(true)
    setError('')
    setTeamNotRegistered(false)

    try {
      // Check team registration status by fetching available time slots for first discipline
      // This endpoint returns teamRegistrationStatus
      const firstDisciplineId = tournamentDisciplines[0]?.id
      if (!firstDisciplineId) {
        setError('No disciplines available')
        setCheckingTeamStatus(false)
        return false
      }

      const response = await fetch(
        `/api/tournaments/${tournamentId}/available-time-slots?disciplineId=${firstDisciplineId}&athleteId=${athleteId}`
      )
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to check team status')
        setCheckingTeamStatus(false)
        return false
      }

      const { teamRegistrationStatus } = data

      // Block if athlete has team but team not registered
      if (teamRegistrationStatus.hasTeam && !teamRegistrationStatus.isTeamRegistered) {
        setTeamNotRegistered(true)
        setError(`Your team "${teamRegistrationStatus.teamName}" has not registered for this tournament yet. Please reach out to your coach.`)
        setCheckingTeamStatus(false)
        return false
      }

      setCheckingTeamStatus(false)
      return true
    } catch (error) {
      setError('An error occurred while checking team status')
      setCheckingTeamStatus(false)
      return false
    }
  }

  const handleOpenModal = async () => {
    // Check team registration before opening modal
    const canRegister = await checkTeamRegistration()
    if (canRegister) {
      setShowModal(true)
    }
  }

  const handleRegister = async () => {
    if (selectedDisciplines.length === 0) {
      setError('Please select at least one discipline')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Prepare time slot preferences (only include disciplines with selections)
      const timeSlotPreferences: {[disciplineId: string]: string[]} = {}
      for (const disciplineId of selectedDisciplines) {
        if (timeSlotSelections[disciplineId] && timeSlotSelections[disciplineId].length > 0) {
          timeSlotPreferences[disciplineId] = timeSlotSelections[disciplineId]
        }
      }

      // OPTIMISTIC UPDATE: Show registered state immediately
      setIsRegistered(true)
      setShowModal(false)
      setStep('disciplines')
      setTimeSlotSelections({})

      // Background sync with server
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          athleteId,
          disciplineIds: selectedDisciplines,
          timeSlotPreferences: Object.keys(timeSlotPreferences).length > 0 ? timeSlotPreferences : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // ROLLBACK: Reset registration state on error
        setIsRegistered(false)
        setError(data.error || 'Failed to register')
        setShowModal(true) // Reopen modal to show error
        return
      }

      // Success - registration confirmed on server
      // Trigger a soft refresh to update server data (doesn't reload whole page)
      router.refresh()
    } catch (error) {
      // ROLLBACK: Reset registration state on error
      setIsRegistered(false)
      setError('An error occurred. Please try again.')
      setShowModal(true) // Reopen modal to show error
    } finally {
      setLoading(false)
    }
  }

  const toggleDiscipline = (disciplineId: string) => {
    setSelectedDisciplines(prev => {
      const newSelected = prev.includes(disciplineId)
        ? prev.filter(id => id !== disciplineId)
        : [...prev, disciplineId]

      // Clear time slot selections for deselected disciplines
      if (!newSelected.includes(disciplineId) && timeSlotSelections[disciplineId]) {
        setTimeSlotSelections(prevSelections => {
          const newSelections = { ...prevSelections }
          delete newSelections[disciplineId]
          return newSelections
        })
      }

      return newSelected
    })
  }

  const handleNext = () => {
    if (selectedDisciplines.length === 0) {
      setError('Please select at least one discipline')
      return
    }
    setError('')
    setStep('timeslots')
  }

  const handleBack = () => {
    setError('')
    setStep('disciplines')
  }

  const handleRegisterWithoutTimes = async () => {
    setTimeSlotSelections({})
    await handleRegister()
  }

  const handleSkipAllTimes = async () => {
    setTimeSlotSelections({})
    await handleRegister()
  }

  const handleTimeSlotChange = (disciplineId: string, timeSlotIds: string[]) => {
    setTimeSlotSelections(prev => ({
      ...prev,
      [disciplineId]: timeSlotIds
    }))
  }

  return (
    <>
      <div>
        {/* Show registered state after successful registration */}
        {isRegistered ? (
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-md font-medium">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Registered!
          </div>
        ) : (
          <button
            onClick={handleOpenModal}
            disabled={checkingTeamStatus}
            className="bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingTeamStatus ? 'Checking...' : 'Register'}
          </button>
        )}

        {/* Team Not Registered Error */}
        {teamNotRegistered && error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* Step 1: Discipline Selection */}
            {step === 'disciplines' && (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Register for Tournament
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
                    onClick={handleRegisterWithoutTimes}
                    disabled={loading || selectedDisciplines.length === 0}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Registering...' : 'Register Without Time Preferences'}
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={selectedDisciplines.length === 0}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setStep('disciplines')
                      setError('')
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Time Slot Selection */}
            {step === 'timeslots' && (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Select Time Slot Preferences (Optional)
                </h3>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <p className="text-gray-600 mb-6">
                  Select your preferred time slots for each discipline. You can skip this step if you prefer.
                </p>

                <div className="space-y-8 mb-6">
                  {selectedDisciplines.map(disciplineId => {
                    const discipline = tournamentDisciplines.find(d => d.id === disciplineId)
                    if (!discipline) return null

                    return (
                      <TimeSlotSelector
                        key={disciplineId}
                        disciplineId={disciplineId}
                        disciplineName={discipline.displayName}
                        tournamentId={tournamentId}
                        athleteId={athleteId}
                        selectedTimeSlots={timeSlotSelections[disciplineId] || []}
                        onSelectionChange={(timeSlotIds) => handleTimeSlotChange(disciplineId, timeSlotIds)}
                      />
                    )
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSkipAllTimes}
                    disabled={loading}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Registering...' : 'Skip All Times'}
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
