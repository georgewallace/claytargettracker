'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { sanitizeFilename } from '@/lib/csvUtils'

interface ExportComprehensiveButtonProps {
  tournamentId: string
  tournamentName: string
}

export default function ExportComprehensiveButton({
  tournamentId,
  tournamentName
}: ExportComprehensiveButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setLoading(true)
    setError('')

    try {
      // Fetch comprehensive tournament data
      const response = await fetch(`/api/tournaments/${tournamentId}/export-comprehensive`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch export data')
      }

      const data = await response.json()

      // Create workbook with 3 sheets
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Teams List
      const teamsData = data.teams.map((team: any) => ({
        'Team Name': team.name,
        'Affiliation': team.affiliation || 'N/A',
        'Total Athletes': team.athleteCount,
        'Registered Athletes': team.registeredCount,
        'Team Type': team.isIndividualTeam ? 'Individual Competitors' : 'Team'
      }))
      const teamsSheet = XLSX.utils.json_to_sheet(teamsData)
      XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Teams')

      // Sheet 2: Participants List
      const participantsData = data.participants.map((p: any) => ({
        'Name': p.athleteName,
        'Email': p.email,
        'Team': p.teamName,
        'Gender': p.gender || 'N/A',
        'Birth Date': p.birthDate || 'N/A',
        'Grade': p.grade || 'N/A',
        'Division': p.division || 'N/A',
        'NSCA Class': p.nscaClass || 'N/A',
        'ATA Class': p.ataClass || 'N/A',
        'Disciplines': p.disciplines,
        'Registration Date': p.registrationDate,
        'Status': p.isActive ? 'Active' : 'Inactive'
      }))
      const participantsSheet = XLSX.utils.json_to_sheet(participantsData)
      XLSX.utils.book_append_sheet(workbook, participantsSheet, 'Participants')

      // Sheet 3: Squad Assignments
      const squadData = data.squads.map((s: any) => ({
        'Squad Name': s.squadName,
        'Discipline': s.discipline,
        'Date': s.date,
        'Start Time': s.startTime,
        'End Time': s.endTime,
        'Field/Station': s.location || 'N/A',
        'Athlete Name': s.athleteName,
        'Team': s.teamName,
        'Division': s.division || 'N/A',
        'Position': s.position
      }))
      const squadSheet = XLSX.utils.json_to_sheet(squadData)
      XLSX.utils.book_append_sheet(workbook, squadSheet, 'Squad Assignments')

      // Generate filename
      const today = new Date().toISOString().split('T')[0]
      const sanitizedName = sanitizeFilename(tournamentName)
      const filename = `${sanitizedName}-comprehensive-${today}.xlsx`

      // Download file
      XLSX.writeFile(workbook, filename)
    } catch (err: any) {
      console.error('Export error:', err)
      setError(err.message || 'Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-medium text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Exporting...' : 'Export All (Excel)'}
      </button>
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}
