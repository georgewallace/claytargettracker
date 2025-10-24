'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

interface Shoot {
  id: string
  date: Date
  tournamentId: string
  totalTargets: number
  totalPossible: number
  percentage: number
  tournament: {
    name: string
  }
  discipline: {
    id: string
    displayName: string
  }
}

interface DisciplineStat {
  discipline: {
    id: string
    displayName: string
  }
  shoots: Array<{
    date: Date
    percentage: number
    score: string
    tournamentName: string
  }>
  totalShoots: number
  totalTargets: number
  totalPossible: number
  average: number
  trend: 'improving' | 'declining' | 'stable'
}

interface Shooter {
  id: string
  name: string
  email: string
  grade: string | null
  division: string | null
  team: {
    id: string
    name: string
    coaches: Array<{
      user: {
        name: string
      }
    }>
  } | null
  shoots: Shoot[]
  stats: DisciplineStat[]
}

interface ShooterProfileViewProps {
  shooter: Shooter
  divisionAverages: Record<string, Record<string, number>>
  canEdit: boolean
  isOwnProfile: boolean
}

export default function ShooterProfileView({ shooter, divisionAverages, canEdit, isOwnProfile }: ShooterProfileViewProps) {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('all')

  // Get all unique disciplines
  const allDisciplines = useMemo(() => {
    const disciplineMap = new Map()
    shooter.stats.forEach(stat => {
      if (!disciplineMap.has(stat.discipline.id)) {
        disciplineMap.set(stat.discipline.id, stat.discipline)
      }
    })
    return Array.from(disciplineMap.values())
  }, [shooter.stats])

  // Prepare chart data with time filter
  const chartData = useMemo(() => {
    const dataByDiscipline: Record<string, any[]> = {}

    // Apply time filter
    const now = new Date()
    const cutoffDate = timeRange === 'all' ? null : 
      new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000)

    shooter.stats.forEach(stat => {
      if (selectedDiscipline !== 'all' && stat.discipline.id !== selectedDiscipline) return

      if (!dataByDiscipline[stat.discipline.id]) {
        dataByDiscipline[stat.discipline.id] = []
      }

      stat.shoots.forEach(shoot => {
        const shootDate = new Date(shoot.date)
        
        // Apply time filter
        if (cutoffDate && shootDate < cutoffDate) return

        // Find the matching shoot in the shooter's actual shoots to get tournamentId
        const actualShoot = shooter.shoots.find(s => 
          format(new Date(s.date), 'MMM d, yyyy') === format(shootDate, 'MMM d, yyyy') &&
          s.discipline.id === stat.discipline.id
        )
        
        const divisionAvg = actualShoot && divisionAverages[actualShoot.tournamentId] 
          ? divisionAverages[actualShoot.tournamentId][stat.discipline.id]
          : undefined

        dataByDiscipline[stat.discipline.id].push({
          date: format(shootDate, 'MMM d, yyyy'),
          dateObj: shootDate,
          percentage: shoot.percentage,
          tournamentName: shoot.tournamentName,
          score: shoot.score,
          divisionAverage: divisionAvg
        })
      })
    })

    // Sort each discipline's data by date and reverse to show oldest to newest
    Object.keys(dataByDiscipline).forEach(disciplineId => {
      dataByDiscipline[disciplineId].sort((a, b) => 
        a.dateObj.getTime() - b.dateObj.getTime()
      )
    })

    return dataByDiscipline
  }, [shooter.stats, shooter.shoots, divisionAverages, selectedDiscipline, timeRange])

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-600 bg-green-50'
    if (trend === 'declining') return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '↗'
    if (trend === 'declining') return '↘'
    return '→'
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{shooter.name}</h1>
            <p className="text-gray-600">{shooter.email}</p>
            {shooter.team && (
              <p className="text-gray-600 mt-2">
                Team: <Link href={`/teams`} className="text-indigo-600 hover:text-indigo-700 font-medium">{shooter.team.name}</Link>
                {shooter.team.coaches.length > 0 && (
                  <span className="text-gray-500 text-sm ml-2">
                    • Coach: {shooter.team.coaches.map(c => c.user.name).join(', ')}
                  </span>
                )}
              </p>
            )}
          </div>
          {canEdit && (
            <Link
              href={`/shooters/${shooter.id}/edit`}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition text-sm font-medium"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {/* Shooter Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="text-sm text-indigo-600 font-medium">Grade</div>
            <div className="text-2xl font-bold text-indigo-900">{shooter.grade || 'Not Set'}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Division</div>
            <div className="text-2xl font-bold text-purple-900">{shooter.division || 'Not Set'}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total Shoots</div>
            <div className="text-2xl font-bold text-blue-900">{shooter.shoots.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Disciplines</div>
            <div className="text-2xl font-bold text-green-900">{shooter.stats.length}</div>
          </div>
        </div>
      </div>

      {shooter.shoots.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No shooting history yet.</p>
          <Link 
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Browse Tournaments →
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Discipline Filter */}
              {allDisciplines.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discipline
                  </label>
                  <select
                    value={selectedDiscipline}
                    onChange={(e) => setSelectedDiscipline(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Disciplines</option>
                    {allDisciplines.map(discipline => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Time</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 3 Months</option>
                  <option value="180">Last 6 Months</option>
                </select>
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          {Object.entries(chartData).map(([disciplineId, data]) => {
            if (data.length === 0) return null
            
            const discipline = allDisciplines.find(d => d.id === disciplineId)
            if (!discipline) return null

            return (
              <div key={disciplineId} className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {discipline.displayName} - Performance Trend
                </h2>
                
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
                              <p className="text-sm text-gray-600">{data.date}</p>
                              <p className="text-sm text-gray-600">{data.tournamentName}</p>
                              <p className="text-lg font-bold text-indigo-600">{data.percentage.toFixed(1)}%</p>
                              <p className="text-sm text-gray-500">{data.score}</p>
                              {data.divisionAverage && shooter.division && (
                                <p className="text-sm text-orange-600 mt-2 font-medium">
                                  {shooter.division} Avg: {data.divisionAverage.toFixed(1)}%
                                </p>
                              )}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      name={`${shooter.name}'s Score`}
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                    {/* Division Average Line */}
                    {shooter.division && (
                      <Line
                        type="monotone"
                        dataKey="divisionAverage"
                        name={`${shooter.division} Average`}
                        stroke="#f97316"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          })}

          {/* Discipline Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Statistics by Discipline</h2>
            
            {shooter.stats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No statistics available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shooter.stats
                  .filter(stat => selectedDiscipline === 'all' || stat.discipline.id === selectedDiscipline)
                  .map(stat => (
                    <div key={stat.discipline.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {stat.discipline.displayName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(stat.trend)}`}>
                          {getTrendIcon(stat.trend)} {stat.trend}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shoots:</span>
                          <span className="font-medium">{stat.totalShoots}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Score:</span>
                          <span className="font-medium">{stat.totalTargets} / {stat.totalPossible}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average:</span>
                          <span className="text-xl font-bold text-indigo-600">{stat.average.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Recent Shoots Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Shooting History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tournament</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discipline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shooter.shoots
                    .filter(shoot => selectedDiscipline === 'all' || shoot.discipline.id === selectedDiscipline)
                    .map(shoot => (
                      <tr key={shoot.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(shoot.date), 'PP')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link 
                            href={`/tournaments/${shoot.tournamentId}`}
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            {shoot.tournament.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {shoot.discipline.displayName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {shoot.totalTargets} / {shoot.totalPossible}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            shoot.percentage >= 90 ? 'bg-green-100 text-green-800' :
                            shoot.percentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {shoot.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

