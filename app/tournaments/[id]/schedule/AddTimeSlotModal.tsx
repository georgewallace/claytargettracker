'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { getTimeOptions, getDurationOptions, calculateEndTime, formatDuration } from '@/lib/timeSlotUtils'

interface Discipline {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface Tournament {
  id: string
  disciplines: Array<{
    id: string
    disciplineId: string
    discipline: Discipline
  }>
}

interface AddTimeSlotModalProps {
  tournament: Tournament
  date: Date
  onClose: () => void
  onSuccess: () => void
}

export default function AddTimeSlotModal({ tournament, date, onClose, onSuccess }: AddTimeSlotModalProps) {
  const timeOptions = getTimeOptions()
  const durationOptions = getDurationOptions()

  const [formData, setFormData] = useState({
    disciplineId: tournament.disciplines[0]?.disciplineId || '',
    startTime: '08:00',
    duration: 120, // Default 2 hours
    squadCapacity: 5,
    fieldNumber: '',
    stationNumber: '',
    notes: ''
  })

  // Calculate end time whenever start time or duration changes
  const endTime = calculateEndTime(formData.startTime, formData.duration)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get selected discipline
  const selectedDiscipline = tournament.disciplines.find(d => d.disciplineId === formData.disciplineId)
  const isSportingClays = selectedDiscipline?.discipline.name === 'sporting_clays'
  const isSkeetOrTrap = selectedDiscipline?.discipline.name === 'skeet' || selectedDiscipline?.discipline.name === 'trap'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'squadCapacity' || name === 'duration' ? parseInt(value) || 1 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const slotData = {
        disciplineId: formData.disciplineId,
        date: format(date, 'yyyy-MM-dd'),
        startTime: formData.startTime,
        endTime: endTime,
        squadCapacity: formData.squadCapacity,
        fieldNumber: isSkeetOrTrap && formData.fieldNumber ? formData.fieldNumber : null,
        stationNumber: isSportingClays && formData.stationNumber ? formData.stationNumber : null,
        notes: formData.notes || null
      }

      const response = await fetch(`/api/tournaments/${tournament.id}/timeslots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create time slot')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Time Slot</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Date Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm font-medium text-gray-700">Date</p>
            <p className="text-gray-900">{format(date, 'EEEE, MMMM d, yyyy')}</p>
          </div>

          {/* Discipline */}
          <div>
            <label htmlFor="disciplineId" className="block text-sm font-medium text-gray-700 mb-2">
              Discipline *
            </label>
            <select
              id="disciplineId"
              name="disciplineId"
              value={formData.disciplineId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {tournament.disciplines.map(td => (
                <option key={td.disciplineId} value={td.disciplineId}>
                  {td.discipline.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Time Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <select
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculated End Time Display */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
            <p className="text-sm font-medium text-indigo-900">
              Calculated End Time: <span className="text-lg font-bold">{endTime}</span>
            </p>
            <p className="text-xs text-indigo-700 mt-1">
              {formData.startTime} + {formatDuration(formData.duration)} = {endTime}
            </p>
          </div>

          {/* Squad Capacity */}
          <div>
            <label htmlFor="squadCapacity" className="block text-sm font-medium text-gray-700 mb-2">
              Squad Capacity (athletes per squad) *
            </label>
            <input
              id="squadCapacity"
              name="squadCapacity"
              type="number"
              min="1"
              max="10"
              value={formData.squadCapacity}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Field Number (Skeet/Trap) */}
          {isSkeetOrTrap && (
            <div>
              <label htmlFor="fieldNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Field Number (optional)
              </label>
              <input
                id="fieldNumber"
                name="fieldNumber"
                type="text"
                value={formData.fieldNumber}
                onChange={handleChange}
                placeholder="e.g., Field 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Station Number (Sporting Clays) */}
          {isSportingClays && (
            <div>
              <label htmlFor="stationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Station Number (optional)
              </label>
              <input
                id="stationNumber"
                name="stationNumber"
                type="text"
                value={formData.stationNumber}
                onChange={handleChange}
                placeholder="e.g., Station 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any additional information..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Adding...' : 'Add Time Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

