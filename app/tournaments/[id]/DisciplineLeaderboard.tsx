'use client'

import { useState } from 'react'

interface Discipline {
  id: string
  displayName: string
}

interface LeaderboardEntry {
  shooter: {
    user: {
      name: string
    }
    team: {
      name: string
    } | null
  }
  discipline: Discipline
  totalTargets: number
  totalPossible: number
  stations: Array<{
    station: number
    targets: number
    totalTargets: number
  }>
}

interface DisciplineLeaderboardProps {
  disciplines: Discipline[]
  shooterScores: Record<string, LeaderboardEntry>
}

export default function DisciplineLeaderboard({ disciplines, shooterScores }: DisciplineLeaderboardProps) {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | 'all'>(
    disciplines.length > 0 ? disciplines[0].id : 'all'
  )

  // Filter and sort leaderboard data by discipline
  const getLeaderboardData = () => {
    const entries = Object.values(shooterScores)
    
    const filtered = selectedDiscipline === 'all'
      ? entries
      : entries.filter(entry => entry.discipline.id === selectedDiscipline)
    
    return filtered.sort((a, b) => b.totalTargets - a.totalTargets)
  }

  const leaderboardData = getLeaderboardData()

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Leaderboard</h2>
      
      {/* Discipline Tabs */}
      {disciplines.length > 1 && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8 overflow-x-auto">
            <button
              onClick={() => setSelectedDiscipline('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                selectedDiscipline === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Disciplines
            </button>
            {disciplines.map(discipline => (
              <button
                key={discipline.id}
                onClick={() => setSelectedDiscipline(discipline.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  selectedDiscipline === discipline.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {discipline.displayName}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Leaderboard Table */}
      {leaderboardData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No scores recorded yet for this {selectedDiscipline === 'all' ? 'tournament' : 'discipline'}.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shooter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                {selectedDiscipline === 'all' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discipline
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboardData.map((entry, index) => {
                const percentage = (entry.totalTargets / entry.totalPossible * 100).toFixed(1)
                return (
                  <tr key={`${entry.shooter.user.name}-${entry.discipline.id}`} className={index < 3 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          {index > 2 && `${index + 1}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.shooter.user.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {entry.shooter.team?.name || 'Independent'}
                      </div>
                    </td>
                    {selectedDiscipline === 'all' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {entry.discipline.displayName}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {entry.totalTargets} / {entry.totalPossible}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {percentage}%
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

