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

interface athlete {
  id: string
  name: string
  email: string
  grade: string | null
  division: string | null
  shoots: Shoot[]
  stats: DisciplineStat[]
}

interface TeamHistoryViewerProps {
  teamName: string
  athletes: athlete[]
}

export default function TeamHistoryViewer({ teamName, athletes }: TeamHistoryViewerProps) {
  const [selectedathleteId, setSelectedathleteId] = useState<string>('all')
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('all') // 30, 90, 180, all

  // Get filtered athlete(s)
  const filteredathletes = useMemo(() => {
    if (selectedathleteId === 'all') return athletes
    return athletes.filter(s => s.id === selectedathleteId)
  }, [selectedathleteId, athletes])

  // Get all unique disciplines
  const allDisciplines = useMemo(() => {
    const disciplineMap = new Map()
    athletes.forEach(athlete => {
      athlete.stats.forEach(stat => {
        if (!disciplineMap.has(stat.discipline.id)) {
          disciplineMap.set(stat.discipline.id, stat.discipline)
        }
      })
    })
    return Array.from(disciplineMap.values())
  }, [athletes])

  // Prepare chart data with averages - restructured to have unique dates
  const chartData = useMemo(() => {
    const dataByDiscipline: Record<string, any[]> = {}
    
    // Apply time filter
    const now = new Date()
    const cutoffDate = timeRange === 'all' ? null : 
      new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000)

    // Collect all athlete data points grouped by date (for filtered view)
    const shootsByDateAndDiscipline: Record<string, Record<string, any[]>> = {}
    
    // Collect ALL athlete data points grouped by date (for team average)
    const allShootsByDateAndDiscipline: Record<string, Record<string, any[]>> = {}

    // Process filtered athletes for display
    filteredathletes.forEach(athlete => {
      athlete.stats.forEach(stat => {
        if (selectedDiscipline !== 'all' && stat.discipline.id !== selectedDiscipline) return

        if (!shootsByDateAndDiscipline[stat.discipline.id]) {
          shootsByDateAndDiscipline[stat.discipline.id] = {}
        }

        stat.shoots.forEach(shoot => {
          const shootDate = new Date(shoot.date)
          
          // Apply time filter
          if (cutoffDate && shootDate < cutoffDate) return

          const dateKey = format(shootDate, 'MMM d, yyyy')
          
          if (!shootsByDateAndDiscipline[stat.discipline.id][dateKey]) {
            shootsByDateAndDiscipline[stat.discipline.id][dateKey] = []
          }

          shootsByDateAndDiscipline[stat.discipline.id][dateKey].push({
            athleteId: athlete.id,
            athleteName: athlete.name,
            percentage: shoot.percentage,
            tournamentName: shoot.tournamentName,
            score: shoot.score,
            dateObj: shootDate
          })
        })
      })
    })

    // Process ALL athletes for team average calculation
    athletes.forEach(athlete => {
      athlete.stats.forEach(stat => {
        if (selectedDiscipline !== 'all' && stat.discipline.id !== selectedDiscipline) return

        if (!allShootsByDateAndDiscipline[stat.discipline.id]) {
          allShootsByDateAndDiscipline[stat.discipline.id] = {}
        }

        stat.shoots.forEach(shoot => {
          const shootDate = new Date(shoot.date)
          
          // Apply time filter
          if (cutoffDate && shootDate < cutoffDate) return

          const dateKey = format(shootDate, 'MMM d, yyyy')
          
          if (!allShootsByDateAndDiscipline[stat.discipline.id][dateKey]) {
            allShootsByDateAndDiscipline[stat.discipline.id][dateKey] = []
          }

          allShootsByDateAndDiscipline[stat.discipline.id][dateKey].push({
            athleteId: athlete.id,
            athleteName: athlete.name,
            percentage: shoot.percentage,
            tournamentName: shoot.tournamentName,
            score: shoot.score,
            dateObj: shootDate
          })
        })
      })
    })

    // Convert to chart format with unique dates
    Object.keys(shootsByDateAndDiscipline).forEach(disciplineId => {
      const dates = Object.keys(shootsByDateAndDiscipline[disciplineId]).sort((a, b) => {
        const dateA = shootsByDateAndDiscipline[disciplineId][a][0].dateObj
        const dateB = shootsByDateAndDiscipline[disciplineId][b][0].dateObj
        return dateA.getTime() - dateB.getTime()
      })

      dataByDiscipline[disciplineId] = dates.map(dateKey => {
        const shootsOnDate = shootsByDateAndDiscipline[disciplineId][dateKey]
        
        // Calculate team average for this date using ALL athletes, not just filtered ones
        const allShootsOnDate = allShootsByDateAndDiscipline[disciplineId]?.[dateKey] || []
        const totalPercentage = allShootsOnDate.reduce((sum, s) => sum + s.percentage, 0)
        const teamAverage = allShootsOnDate.length > 0 ? totalPercentage / allShootsOnDate.length : 0

        // Create data point with all athletes' scores as properties
        const dataPoint: any = {
          date: dateKey,
          dateObj: shootsOnDate[0].dateObj,
          teamAverage,
          tournamentName: shootsOnDate[0].tournamentName
        }

        // Add each athlete's percentage as a separate property
        shootsOnDate.forEach(shoot => {
          dataPoint[`athlete_${shoot.athleteId}`] = shoot.percentage
          dataPoint[`athleteName_${shoot.athleteId}`] = shoot.athleteName
          dataPoint[`score_${shoot.athleteId}`] = shoot.score
        })

        return dataPoint
      })
    })

    return dataByDiscipline
  }, [filteredathletes, athletes, selectedDiscipline, timeRange])

  // Calculate overall team statistics
  const teamStats = useMemo(() => {
    let totalShoots = 0
    let totalathletesWithHistory = 0

    filteredathletes.forEach(athlete => {
      if (athlete.shoots.length > 0) {
        totalathletesWithHistory++
        totalShoots += athlete.shoots.length
      }
    })

    return {
      totalathletes: filteredathletes.length,
      totalathletesWithHistory,
      totalShoots,
      avgShootsPerathlete: totalathletesWithHistory > 0 
        ? (totalShoots / totalathletesWithHistory).toFixed(1)
        : '0'
    }
  }, [filteredathletes])

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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Team History</h1>
        <p className="text-gray-600 mb-4">{teamName} - Performance Analytics</p>
        
        {/* Team Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="text-sm text-indigo-600 font-medium">Total athletes</div>
            <div className="text-2xl font-bold text-indigo-900">{teamStats.totalathletes}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">With History</div>
            <div className="text-2xl font-bold text-green-900">{teamStats.totalathletesWithHistory}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total Shoots</div>
            <div className="text-2xl font-bold text-blue-900">{teamStats.totalShoots}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Avg per athlete</div>
            <div className="text-2xl font-bold text-purple-900">{teamStats.avgShootsPerathlete}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Athlete Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              athlete
            </label>
            <select
              value={selectedathleteId}
              onChange={(e) => setSelectedathleteId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All athletes</option>
              {athletes.map(athlete => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name} {athlete.shoots.length > 0 ? `(${athlete.shoots.length} shoots)` : '(no history)'}
                </option>
              ))}
            </select>
          </div>

          {/* Discipline Filter */}
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

        // Get unique athletes in this data by checking athlete_ properties
        const athleteIds = new Set<string>()
        data.forEach(point => {
          Object.keys(point).forEach(key => {
            if (key.startsWith('athlete_')) {
              athleteIds.add(key.replace('athlete_', ''))
            }
          })
        })
        const athletesInChart = Array.from(athleteIds)
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

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
                        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg max-w-xs">
                          <p className="text-sm font-semibold text-gray-900">{data.date}</p>
                          <p className="text-xs text-gray-600 mb-2">{data.tournamentName}</p>
                          {payload.filter(p => p.dataKey.startsWith('athlete_')).map((entry: any) => {
                            const athleteId = entry.dataKey.replace('athlete_', '')
                            const athleteName = data[`athleteName_${athleteId}`]
                            const score = data[`score_${athleteId}`]
                            return (
                              <div key={athleteId} className="mt-1">
                                <span style={{ color: entry.color }} className="font-medium">
                                  {athleteName}:
                                </span>
                                <span className="ml-2 font-bold">{entry.value.toFixed(1)}%</span>
                                <span className="ml-1 text-xs text-gray-500">({score})</span>
                              </div>
                            )
                          })}
                          {data.teamAverage && (
                            <p className="text-sm text-orange-600 mt-2 font-medium border-t pt-1">
                              Team Avg: {data.teamAverage.toFixed(1)}%
                            </p>
                          )}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                {athletesInChart.map((athleteId, index) => {
                  const athlete = filteredathletes.find(s => s.id === athleteId)
                  
                  return (
                    <Line
                      key={athleteId}
                      type="monotone"
                      dataKey={`athlete_${athleteId}`}
                      name={athlete?.name || 'Unknown'}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  )
                })}
                {/* Team Average Line */}
                <Line
                  type="monotone"
                  dataKey="teamAverage"
                  name="Team Average"
                  stroke="#f97316"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })}

      {/* Athlete Statistics */}
      {filteredathletes.map(athlete => (
        <div key={athlete.id} className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{athlete.name}</h2>
              <p className="text-sm text-gray-600">{athlete.email}</p>
              {(athlete.grade || athlete.division) && (
                <p className="text-sm text-gray-600 mt-1">
                  {athlete.grade && <span>Grade: {athlete.grade}</span>}
                  {athlete.grade && athlete.division && <span> • </span>}
                  {athlete.division && <span className="font-medium text-indigo-600">{athlete.division}</span>}
                </p>
              )}
            </div>
            <Link
              href={`/athletes/${athlete.id}`}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              View Profile →
            </Link>
          </div>

          {athlete.stats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No shooting history yet.</p>
          ) : (
            <>
              {/* Discipline Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {athlete.stats
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
                          <span className="font-semibold text-gray-900">{stat.totalShoots}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Score:</span>
                          <span className="font-semibold text-gray-900">{stat.totalTargets} / {stat.totalPossible}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Average:</span>
                          <span className="text-xl font-bold text-indigo-600">{stat.average.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Recent Shoots Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Shoots</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tournament</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discipline</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {athlete.shoots
                        .filter(shoot => selectedDiscipline === 'all' || shoot.discipline.id === selectedDiscipline)
                        .slice()
                        .reverse()
                        .slice(0, 10)
                        .map(shoot => (
                          <tr key={shoot.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {format(new Date(shoot.date), 'PP')}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Link 
                                href={`/tournaments/${shoot.tournamentId}`}
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                {shoot.tournament.name}
                              </Link>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {shoot.discipline.displayName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {shoot.totalTargets} / {shoot.totalPossible}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
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
      ))}

      {filteredathletes.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No athletes found matching your filters.</p>
        </div>
      )}
    </div>
  )
}


