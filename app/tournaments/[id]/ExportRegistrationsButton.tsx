'use client'

import { useState } from 'react'
import { arrayToCsv, sanitizeFilename } from '@/lib/csvUtils'

interface User {
  name: string
  email: string
}

interface Team {
  name: string
}

interface athlete {
  user: User
  team: Team | null
  grade: string | null
  division: string | null
  gender: string | null
}

interface Discipline {
  displayName: string
}

interface RegistrationDiscipline {
  discipline: Discipline
}

interface Registration {
  athlete: athlete
  disciplines: RegistrationDiscipline[]
  createdAt: Date
  status: string
}

interface ExportRegistrationsButtonProps {
  registrations: Registration[]
  tournamentName: string
}

// Field configuration for CSV export - easy to extend by adding new entries
const CSV_FIELDS = [
  {
    header: 'Name',
    getValue: (reg: Registration) => reg.athlete.user.name
  },
  {
    header: 'Email',
    getValue: (reg: Registration) => reg.athlete.user.email
  },
  {
    header: 'Team',
    getValue: (reg: Registration) => reg.athlete.team?.name || 'No Team'
  },
  {
    header: 'Grade',
    getValue: (reg: Registration) => reg.athlete.grade || 'N/A'
  },
  {
    header: 'Division',
    getValue: (reg: Registration) => reg.athlete.division || 'N/A'
  },
  {
    header: 'Gender',
    getValue: (reg: Registration) => reg.athlete.gender || 'N/A'
  },
  {
    header: 'Disciplines',
    getValue: (reg: Registration) =>
      reg.disciplines.map(d => d.discipline.displayName).join(', ')
  },
  {
    header: 'Registration Date',
    getValue: (reg: Registration) => {
      const date = new Date(reg.createdAt)
      // Format as YYYY-MM-DD HH:mm:ss
      return date.toISOString().replace('T', ' ').substring(0, 19)
    }
  },
  {
    header: 'Status',
    getValue: (reg: Registration) => reg.status
  }
]

export default function ExportRegistrationsButton({
  registrations,
  tournamentName
}: ExportRegistrationsButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = () => {
    setLoading(true)

    try {
      // Generate CSV content
      const csvContent = arrayToCsv(registrations, CSV_FIELDS)

      // Create filename with current date
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const sanitizedName = sanitizeFilename(tournamentName)
      const filename = `${sanitizedName}-registrations-${today}.csv`

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting registrations:', error)
      alert('Failed to export registrations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-teal-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition font-medium text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Exporting...' : 'Export Registrations'}
    </button>
  )
}
