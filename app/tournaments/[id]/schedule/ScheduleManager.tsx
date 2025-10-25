'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { getDateRange, formatDateForDisplay } from '@/lib/timeSlotUtils'
import GenerateTimeSlotsModal from './GenerateTimeSlotsModal'
import AddTimeSlotModal from './AddTimeSlotModal'
import TimeSlotCard from './TimeSlotCard'

interface Discipline {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface Squad {
  id: string
  name: string
  capacity: number
  notes: string | null
}

interface TimeSlot {
  id: string
  tournamentId: string
  disciplineId: string
  date: Date
  startTime: string
  endTime: string
  squadCapacity: number
  fieldNumber: string | null
  stationNumber: string | null
  notes: string | null
  discipline: Discipline
  squads: Squad[]
}

interface Tournament {
  id: string
  name: string
  location: string
  startDate: Date
  endDate: Date
  status: string
  disciplines: Array<{
    id: string
    disciplineId: string
    discipline: Discipline
  }>
  timeSlots: TimeSlot[]
}

interface ScheduleManagerProps {
  tournament: Tournament
}

export default function ScheduleManager({ tournament }: ScheduleManagerProps) {
  const router = useRouter()
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('all')

  // Format date without timezone shifts - extract YYYY-MM-DD and create date at noon UTC
  const parseDateSafe = (date: Date) => {
    const dateStr = new Date(date).toISOString().split('T')[0]
    return new Date(`${dateStr}T12:00:00.000Z`)
  }

  // Get date range for the tournament
  const tournamentDates = getDateRange(parseDateSafe(tournament.startDate), parseDateSafe(tournament.endDate))
  const [activeDay, setActiveDay] = useState(tournamentDates[0])

  // Filter time slots
  const filteredTimeSlots = tournament.timeSlots.filter(slot => {
    // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
    const slotDateStr = new Date(slot.date).toISOString().split('T')[0]
    const activeDateStr = format(activeDay, 'yyyy-MM-dd')
    
    const dateMatch = slotDateStr === activeDateStr
    const disciplineMatch = selectedDisciplineFilter === 'all' || slot.disciplineId === selectedDisciplineFilter
    
    return dateMatch && disciplineMatch
  })

  // Group time slots by discipline
  const slotsByDiscipline = filteredTimeSlots.reduce((acc, slot) => {
    const disciplineName = slot.discipline.displayName
    if (!acc[disciplineName]) {
      acc[disciplineName] = []
    }
    acc[disciplineName].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  const handleGenerateClick = () => {
    setShowGenerateModal(true)
  }

  const handleAddClick = () => {
    setSelectedDate(activeDay)
    setShowAddModal(true)
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-gray-600 mt-1">Schedule Management</p>
          </div>
          <Link
            href={`/tournaments/${tournament.id}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Back to Tournament
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tournament Dates</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(parseDateSafe(tournament.startDate), 'PPP')} - {format(parseDateSafe(tournament.endDate), 'PPP')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateClick}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Generate Time Slots
              </button>
              <button
                onClick={handleAddClick}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                + Add Time Slot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tournamentDates.map((date, index) => {
              const isActive = format(date, 'yyyy-MM-dd') === format(activeDay, 'yyyy-MM-dd')
              const daySlots = tournament.timeSlots.filter(
                slot => new Date(slot.date).toISOString().split('T')[0] === format(date, 'yyyy-MM-dd')
              )
              
              return (
                <button
                  key={index}
                  onClick={() => setActiveDay(date)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div>{formatDateForDisplay(date)}</div>
                    <div className="text-xs mt-1">
                      {daySlots.length} {daySlots.length === 1 ? 'slot' : 'slots'}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Discipline Filter */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Discipline:</label>
            <select
              value={selectedDisciplineFilter}
              onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Disciplines</option>
              {tournament.disciplines.map(td => (
                <option key={td.disciplineId} value={td.disciplineId}>
                  {td.discipline.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-8">
        {Object.keys(slotsByDiscipline).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">
              No time slots for {formatDateForDisplay(activeDay)}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Get started by generating time slots or adding them manually
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleGenerateClick}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Generate Time Slots
              </button>
              <button
                onClick={handleAddClick}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                + Add Manually
              </button>
            </div>
          </div>
        ) : (
          Object.entries(slotsByDiscipline).map(([disciplineName, slots]) => (
            <div key={disciplineName} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{disciplineName}</h3>
              <div className="space-y-4">
                {slots.map(slot => (
                  <TimeSlotCard key={slot.id} timeSlot={slot} onUpdate={() => router.refresh()} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showGenerateModal && (
        <GenerateTimeSlotsModal
          tournament={tournament}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            // Force a full page reload to ensure data is refreshed
            window.location.reload()
          }}
        />
      )}

      {showAddModal && selectedDate && (
        <AddTimeSlotModal
          tournament={tournament}
          date={selectedDate}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            // Force a full page reload to ensure data is refreshed
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

