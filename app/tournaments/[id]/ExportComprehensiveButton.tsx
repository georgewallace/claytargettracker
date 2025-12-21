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
      // API now returns data with column names as keys, so just use it directly
      const teamsSheet = XLSX.utils.json_to_sheet(data.teams)
      XLSX.utils.book_append_sheet(workbook, teamsSheet, 'Teams')

      // Sheet 2: Participants List
      // API now returns data with column names as keys, so just use it directly
      const participantsSheet = XLSX.utils.json_to_sheet(data.participants)
      XLSX.utils.book_append_sheet(workbook, participantsSheet, 'Participants')

      // Sheet 3: Squad Assignments
      // API now returns data with column names as keys, so just use it directly
      const squadSheet = XLSX.utils.json_to_sheet(data.squads)
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
