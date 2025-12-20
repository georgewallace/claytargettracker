'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { getDateRange, generateTimeSlots, getTimeOptions, getDurationOptions, type TimeSlotConfig } from '@/lib/timeSlotUtils'

interface Discipline {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface Tournament {
  id: string
  startDate: Date
  endDate: Date
  disciplines: Array<{
    id: string
    disciplineId: string
    discipline: Discipline
  }>
}

interface GenerateTimeSlotsModalProps {
  tournament: Tournament
  onClose: () => void
  onSuccess: () => void
}

// Helper to get default squad capacity based on discipline
const getDefaultSquadCapacity = (disciplineName: string): number => {
  switch (disciplineName) {
    case 'trap':
      return 5
    case 'skeet':
    case 'sporting_clays':
      return 3
    default:
      return 5
  }
}

export default function GenerateTimeSlotsModal({ tournament, onClose, onSuccess }: GenerateTimeSlotsModalProps) {
  const tournamentDates = getDateRange(new Date(tournament.startDate), new Date(tournament.endDate))
  const timeOptions = getTimeOptions()

  // Get initial discipline name for default squad capacity
  const initialDiscipline = tournament.disciplines[0]?.discipline
  const initialSquadCapacity = initialDiscipline ? getDefaultSquadCapacity(initialDiscipline.name) : 5

  const [formData, setFormData] = useState({
    disciplineId: tournament.disciplines[0]?.disciplineId || '',
    date: format(tournamentDates[0], 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '17:00',
    slotDuration: 120, // minutes
    squadCapacity: initialSquadCapacity,
    fieldNumbers: '1',
    stationNumbers: '1'
  })

  const [generatedSlots, setGeneratedSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get selected discipline to determine field vs station
  const selectedDiscipline = tournament.disciplines.find(d => d.disciplineId === formData.disciplineId)
  const isSportingClays = selectedDiscipline?.discipline.name === 'sporting_clays'
  const isSkeetOrTrap = selectedDiscipline?.discipline.name === 'skeet' || selectedDiscipline?.discipline.name === 'trap'

  // Update squad capacity when discipline changes
  useEffect(() => {
    if (selectedDiscipline) {
      const defaultCapacity = getDefaultSquadCapacity(selectedDiscipline.discipline.name)
      setFormData(prev => ({
        ...prev,
        squadCapacity: defaultCapacity
      }))
    }
  }, [formData.disciplineId, selectedDiscipline])

  // Parse field/station numbers from input string
  // Supports: "1", "1,2,3", "1-3", "1, 2, 3", "1-3, 5, 7-9"
  const parseNumbers = (input: string): number[] => {
    const numbers = new Set<number>()
    const parts = input.split(',').map(s => s.trim())
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Range like "1-3" or "4-7"
        const [start, end] = part.split('-').map(s => parseInt(s.trim()))
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            numbers.add(i)
          }
        }
      } else {
        // Single number
        const num = parseInt(part.trim())
        if (!isNaN(num)) {
          numbers.add(num)
        }
      }
    }
    
    return Array.from(numbers).sort((a, b) => a - b)
  }

  // Generate slots
  const handleGenerate = () => {
    try {
      const allSlots: any[] = []
      
      if (isSkeetOrTrap) {
        // Parse field numbers from input
        const fieldNums = parseNumbers(formData.fieldNumbers)
        
        if (fieldNums.length === 0) {
          setError('Please enter valid field numbers (e.g., "1", "1,2,3", or "1-3")')
          return
        }
        
        // Generate for each field
        for (const fieldNum of fieldNums) {
          const config: TimeSlotConfig = {
            date: new Date(formData.date),
            startTime: formData.startTime,
            endTime: formData.endTime,
            slotDuration: formData.slotDuration,
            squadCapacity: formData.squadCapacity,
            disciplineId: formData.disciplineId,
            fieldNumber: `Field ${fieldNum}`
          }
          const slots = generateTimeSlots(config)
          // Add fieldNum for sorting
          slots.forEach(slot => ((slot as any).fieldNum = fieldNum))
          allSlots.push(...slots)
        }
      } else if (isSportingClays) {
        // Parse station numbers from input
        const stationNums = parseNumbers(formData.stationNumbers)
        
        if (stationNums.length === 0) {
          setError('Please enter valid station numbers (e.g., "1", "1,2,3", or "1-3")')
          return
        }
        
        // Generate for each station
        for (const stationNum of stationNums) {
          const config: TimeSlotConfig = {
            date: new Date(formData.date),
            startTime: formData.startTime,
            endTime: formData.endTime,
            slotDuration: formData.slotDuration,
            squadCapacity: formData.squadCapacity,
            disciplineId: formData.disciplineId,
            stationNumber: `Station ${stationNum}`
          }
          const slots = generateTimeSlots(config)
          // Add stationNum for sorting
          slots.forEach(slot => ((slot as any).stationNum = stationNum))
          allSlots.push(...slots)
        }
      } else {
        // No field/station numbers for 5-Stand
        const config: TimeSlotConfig = {
          date: new Date(formData.date),
          startTime: formData.startTime,
          endTime: formData.endTime,
          slotDuration: formData.slotDuration,
          squadCapacity: formData.squadCapacity,
          disciplineId: formData.disciplineId
        }
        const slots = generateTimeSlots(config)
        allSlots.push(...slots)
      }
      
      // Sort by time first, then by field/station number
      allSlots.sort((a, b) => {
        // Compare times first
        if (a.startTime !== b.startTime) {
          return a.startTime.localeCompare(b.startTime)
        }
        // If same time, compare field/station numbers
        const aNum = (a as any).fieldNum || (a as any).stationNum || 0
        const bNum = (b as any).fieldNum || (b as any).stationNum || 0
        return aNum - bNum
      })
      
      setGeneratedSlots(allSlots)
      setError('')
    } catch (err) {
      setError('Failed to generate slots. Please check your settings.')
      setGeneratedSlots([])
    }
  }

  // Remove a specific slot
  const handleRemoveSlot = (index: number) => {
    setGeneratedSlots(prev => prev.filter((_, i) => i !== index))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['slotDuration', 'squadCapacity'].includes(name) 
        ? parseInt(value) || 1 
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (generatedSlots.length === 0) {
      setError('No time slots to create. Click "Generate Slots" first.')
      setLoading(false)
      return
    }

    try {
      const slotsToCreate = generatedSlots.map(slot => ({
        disciplineId: formData.disciplineId,
        date: formData.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        squadCapacity: formData.squadCapacity,
        fieldNumber: slot.fieldNumber || null,
        stationNumber: slot.stationNumber || null
      }))

      const response = await fetch(`/api/tournaments/${tournament.id}/timeslots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotsToCreate)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create time slots')
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
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Generate Time Slots</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

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

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <select
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {tournamentDates.map((date, index) => (
                <option key={index} value={format(date, 'yyyy-MM-dd')}>
                  {format(date, 'EEEE, MMMM d, yyyy')}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range */}
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
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <select
                id="endTime"
                name="endTime"
                value={formData.endTime}
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
          </div>

          {/* Slot Duration */}
          <div>
            <label htmlFor="slotDuration" className="block text-sm font-medium text-gray-700 mb-2">
              Slot Duration *
            </label>
            <select
              id="slotDuration"
              name="slotDuration"
              value={formData.slotDuration}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {getDurationOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Duration for each individual time slot that will be generated
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

          {/* Field/Station Numbers */}
          {isSkeetOrTrap && (
            <div>
              <label htmlFor="fieldNumbers" className="block text-sm font-medium text-gray-700 mb-2">
                Field Numbers *
              </label>
              <input
                id="fieldNumbers"
                name="fieldNumbers"
                type="text"
                value={formData.fieldNumbers}
                onChange={handleChange}
                required
                placeholder="e.g., 1 or 1,2,3 or 1-3 or 1-3, 5, 7-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: <span className="font-mono">1</span>, <span className="font-mono">1,2,3</span>, 
                <span className="font-mono">1-3</span>, <span className="font-mono">1-3, 5, 7-9</span>
              </p>
            </div>
          )}

          {isSportingClays && (
            <div>
              <label htmlFor="stationNumbers" className="block text-sm font-medium text-gray-700 mb-2">
                Station Numbers *
              </label>
              <input
                id="stationNumbers"
                name="stationNumbers"
                type="text"
                value={formData.stationNumbers}
                onChange={handleChange}
                required
                placeholder="e.g., 1 or 1,2,3 or 1-3 or 1-3, 5, 7-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: <span className="font-mono">1</span>, <span className="font-mono">1,2,3</span>, 
                <span className="font-mono">1-3</span>, <span className="font-mono">1-3, 5, 7-9</span>
              </p>
            </div>
          )}

          {/* Generate Button */}
          <div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Generate Slots
            </button>
          </div>

          {/* Generated Slots */}
          {generatedSlots.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-indigo-900">
                  Generated Slots ({generatedSlots.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setGeneratedSlots([])}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {generatedSlots.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-indigo-200">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900">{slot.startTime} - {slot.endTime}</span>
                      {slot.fieldNumber && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {slot.fieldNumber}
                        </span>
                      )}
                      {slot.stationNumber && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {slot.stationNumber}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
                      title="Remove this slot"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-indigo-700 mt-2">
                Click the × to remove unwanted slots before creating
              </p>
            </div>
          )}

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
              disabled={loading || generatedSlots.length === 0}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Creating...' : `Create ${generatedSlots.length} Slot${generatedSlots.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

