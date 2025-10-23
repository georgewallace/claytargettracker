'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Tournament {
  id: string
  name: string
  status: string
  disciplines: any[]
  shoots: any[]
  timeSlots: any[]
}

interface ShooterScore {
  shooterId: string
  shooterName: string
  teamName: string | null
  division: string | null
  disciplineScores: Record<string, number>
  totalScore: number
  disciplineCount: number
  lastUpdated: Date | null // Track when scores were last updated
}

interface SquadScore {
  squadId: string
  squadName: string
  teamName: string | null
  totalScore: number
  memberCount: number
  members: string[]
  isComplete: boolean
  completionPercentage: number
}

interface LeaderboardProps {
  tournament: Tournament
}

export default function Leaderboard({ tournament }: LeaderboardProps) {
  const router = useRouter()
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expandedShooter, setExpandedShooter] = useState<string | null>(null)
  
  // Determine initial view based on tournament status
  const isTournamentComplete = tournament.status === 'completed'
  const [activeView, setActiveView] = useState<'podium' | 'divisions' | 'squads'>(
    isTournamentComplete ? 'podium' : 'divisions'
  )

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      router.refresh()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, router])

  // Calculate individual scores
  const shooterScores: Record<string, ShooterScore> = {}
  
  tournament.shoots.forEach(shoot => {
    const key = shoot.shooterId
    if (!shooterScores[key]) {
      shooterScores[key] = {
        shooterId: shoot.shooterId,
        shooterName: shoot.shooter.user.name,
        teamName: shoot.shooter.team?.name || null,
        division: shoot.shooter.division || null,
        disciplineScores: {},
        totalScore: 0,
        disciplineCount: 0,
        lastUpdated: null
      }
    }

    const disciplineTotal = shoot.scores.reduce((sum: number, score: any) => sum + score.targets, 0)
    shooterScores[key].disciplineScores[shoot.disciplineId] = disciplineTotal
    shooterScores[key].totalScore += disciplineTotal
    shooterScores[key].disciplineCount++
    
    // Track the most recent update
    const shootUpdated = new Date(shoot.updatedAt)
    if (!shooterScores[key].lastUpdated || shootUpdated > shooterScores[key].lastUpdated!) {
      shooterScores[key].lastUpdated = shootUpdated
    }
  })

  const allShooters = Object.values(shooterScores)

  // Calculate squad scores with completion status
  const squadScores: SquadScore[] = []
  
  tournament.timeSlots.forEach(timeSlot => {
    timeSlot.squads.forEach((squad: any) => {
      let squadTotal = 0
      let membersWithScores = 0
      
      squad.members.forEach((member: any) => {
        const shooterScore = shooterScores[member.shooter.id]
        if (shooterScore && shooterScore.totalScore > 0) {
          squadTotal += shooterScore.totalScore
          membersWithScores++
        }
      })

      const isComplete = membersWithScores === squad.members.length && squad.members.length > 0

      squadScores.push({
        squadId: squad.id,
        squadName: squad.name,
        teamName: squad.members[0]?.shooter.team?.name || null,
        totalScore: squadTotal,
        memberCount: squad.members.length,
        members: squad.members.map((m: any) => m.shooter.user.name),
        isComplete,
        completionPercentage: squad.members.length > 0 ? Math.round((membersWithScores / squad.members.length) * 100) : 0
      })
    })
  })

  // Top 3 Overall Individuals
  const top3Overall = [...allShooters]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3)

  // Top 3 Squads
  const top3Squads = [...squadScores]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3)

  // HOA (High Over All) - All disciplines combined
  const hoaShooters = [...allShooters]
    .filter(s => s.disciplineCount > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3)

  const hoaWinnersByDivision = new Set(
    hoaShooters.filter(s => s.division).map(s => `${s.shooterId}-${s.division}`)
  )

  // HAA (High All-Around) - Specific core disciplines (Trap, Skeet, Sporting Clays)
  // Only includes shooters who have shot in multiple core disciplines
  const coreDisciplines = tournament.disciplines
    .filter(d => ['trap', 'skeet', 'sporting_clays'].includes(d.discipline.name))
    .map(d => d.disciplineId)

  const haaShooters = allShooters
    .map(shooter => {
      const coreDisciplineScores = Object.entries(shooter.disciplineScores)
        .filter(([disciplineId]) => coreDisciplines.includes(disciplineId))
      
      const haaTotal = coreDisciplineScores.reduce((sum, [, score]) => sum + score, 0)
      const haaDisciplineCount = coreDisciplineScores.length

      return {
        ...shooter,
        haaTotal,
        haaDisciplineCount
      }
    })
    .filter(s => s.haaDisciplineCount >= 2) // Must shoot at least 2 core disciplines
    .filter(s => !hoaWinnersByDivision.has(`${s.shooterId}-${s.division}`)) // Exclude HOA winners from HAA in their division
    .sort((a, b) => b.haaTotal - a.haaTotal)
    .slice(0, 3)

  // Get medal emoji
  const getMedal = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return ''
  }

  // Get discipline name by ID
  const getDisciplineName = (disciplineId: string) => {
    const discipline = tournament.disciplines.find(d => d.disciplineId === disciplineId)
    return discipline?.discipline.displayName || 'Unknown'
  }

  // Toggle shooter details
  const toggleShooter = (shooterId: string) => {
    setExpandedShooter(expandedShooter === shooterId ? null : shooterId)
  }

  // Check if a score was recently updated (within last 2 minutes)
  const isRecentlyUpdated = (lastUpdated: Date | null): boolean => {
    if (!lastUpdated) return false
    const now = new Date()
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
    return lastUpdated > twoMinutesAgo
  }

  // Get unique divisions
  const divisions = Array.from(new Set(allShooters.map(s => s.division).filter(Boolean))).sort()
  
  // Group shooters by discipline AND division
  const shootersByDisciplineAndDivision: Record<string, Record<string, ShooterScore[]>> = {}
  
  tournament.disciplines.forEach(td => {
    const disciplineId = td.disciplineId
    shootersByDisciplineAndDivision[disciplineId] = {}
    
    divisions.forEach(division => {
      const shootersInDisciplineAndDivision = allShooters.filter(
        s => s.division === division && s.disciplineScores[disciplineId] !== undefined
      ).sort((a, b) => {
        // Sort by score for this specific discipline
        const aScore = a.disciplineScores[disciplineId] || 0
        const bScore = b.disciplineScores[disciplineId] || 0
        return bScore - aScore
      })
      
      if (shootersInDisciplineAndDivision.length > 0) {
        shootersByDisciplineAndDivision[disciplineId][division] = shootersInDisciplineAndDivision
      }
    })
  })

  return (
    <div className="space-y-8">
      {/* Auto-refresh and View Toggle */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-white font-medium">
              {autoRefresh ? 'Auto-refreshing every 30s' : 'Auto-refresh paused'}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md transition font-medium"
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          {isTournamentComplete && (
            <button
              onClick={() => setActiveView('podium')}
              className={`px-4 py-2 rounded-md transition font-medium ${
                activeView === 'podium'
                  ? 'bg-white text-indigo-900'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🏆 Podium
            </button>
          )}
          <button
            onClick={() => setActiveView('divisions')}
            className={`px-4 py-2 rounded-md transition font-medium ${
              activeView === 'divisions'
                ? 'bg-white text-indigo-900'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            📊 By Division
          </button>
          <button
            onClick={() => setActiveView('squads')}
            className={`px-4 py-2 rounded-md transition font-medium ${
              activeView === 'squads'
                ? 'bg-white text-indigo-900'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            👥 By Squad
          </button>
        </div>
      </div>

      {/* Podium View */}
      {activeView === 'podium' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* HOA - High Over All */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-2xl p-6">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            👑 HOA - High Over All
          </h2>
          <p className="text-white/90 text-sm mb-6">All Disciplines Combined</p>
          
          {hoaShooters.length > 0 ? (
            <div className="space-y-3">
              {hoaShooters.map((shooter, idx) => (
                <div
                  key={shooter.shooterId}
                  className="bg-white/20 backdrop-blur rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getMedal(idx)}</span>
                    <div>
                      <div className="text-xl font-bold text-white">
                        {shooter.shooterName}
                      </div>
                      <div className="text-sm text-white/80">
                        {shooter.teamName || 'Independent'} • {shooter.division || 'No Division'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {shooter.totalScore}
                    </div>
                    <div className="text-xs text-white/80">
                      {shooter.disciplineCount} discipline{shooter.disciplineCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/70">
              No scores recorded yet
            </div>
          )}
        </div>

        {/* HAA - High All-Around */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-2xl p-6">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            🎯 HAA - High All-Around
          </h2>
          <p className="text-white/90 text-sm mb-6">Core Disciplines (Trap, Skeet, Sporting Clays)</p>
          
          {haaShooters.length > 0 ? (
            <div className="space-y-3">
              {haaShooters.map((shooter, idx) => (
                <div
                  key={shooter.shooterId}
                  className="bg-white/20 backdrop-blur rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getMedal(idx)}</span>
                    <div>
                      <div className="text-xl font-bold text-white">
                        {shooter.shooterName}
                      </div>
                      <div className="text-sm text-white/80">
                        {shooter.teamName || 'Independent'} • {shooter.division || 'No Division'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {shooter.haaTotal}
                    </div>
                    <div className="text-xs text-white/80">
                      {shooter.haaDisciplineCount} core discipline{shooter.haaDisciplineCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/70">
              No eligible scores yet (need 2+ core disciplines)
            </div>
          )}
        </div>

        {/* Top 3 Overall */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-2xl p-6">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            🏅 Top 3 Individuals
          </h2>
          <p className="text-white/90 text-sm mb-6">Overall Tournament Leaders</p>
          
          {top3Overall.length > 0 ? (
            <div className="space-y-3">
              {top3Overall.map((shooter, idx) => (
                <div
                  key={shooter.shooterId}
                  className="bg-white/20 backdrop-blur rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getMedal(idx)}</span>
                    <div>
                      <div className="text-xl font-bold text-white">
                        {shooter.shooterName}
                      </div>
                      <div className="text-sm text-white/80">
                        {shooter.teamName || 'Independent'} • {shooter.division || 'No Division'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {shooter.totalScore}
                    </div>
                    <div className="text-xs text-white/80">
                      {shooter.disciplineCount} discipline{shooter.disciplineCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/70">
              No scores recorded yet
            </div>
          )}
        </div>

        {/* Top 3 Squads */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-2xl p-6">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            👥 Top 3 Squads
          </h2>
          <p className="text-white/90 text-sm mb-6">Combined Squad Scores</p>
          
          {top3Squads.length > 0 ? (
            <div className="space-y-3">
              {top3Squads.map((squad, idx) => (
                <div
                  key={squad.squadId}
                  className={`bg-white/20 backdrop-blur rounded-lg p-4 flex items-center justify-between ${!squad.isComplete ? 'border-2 border-yellow-300' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-4xl">{getMedal(idx)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-white">
                          {squad.squadName}
                        </div>
                        {!squad.isComplete && (
                          <span className="px-2 py-0.5 bg-yellow-300/30 text-yellow-100 text-xs font-semibold rounded-full border border-yellow-300">
                            ⚠️ {squad.completionPercentage}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-white/80">
                        {squad.teamName || 'Mixed Team'}
                      </div>
                      <div className="text-xs text-white/70 mt-1">
                        {squad.members.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-3xl font-bold text-white">
                      {squad.totalScore}
                    </div>
                    <div className="text-xs text-white/80">
                      {squad.memberCount} member{squad.memberCount !== 1 ? 's' : ''}
                    </div>
                    {squad.isComplete && (
                      <div className="text-xs text-white/80 mt-1">
                        ✓ Complete
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/70">
              No squads with scores yet
            </div>
          )}
        </div>
        </div>
      )}

      {/* Divisions View - Separate Tables for Each Discipline × Division */}
      {activeView === 'divisions' && (
        <div className="space-y-8">
          {tournament.disciplines.map(td => {
            const disciplineId = td.disciplineId
            const discipline = td.discipline
            const disciplineDivisions = shootersByDisciplineAndDivision[disciplineId]
            
            if (!disciplineDivisions || Object.keys(disciplineDivisions).length === 0) {
              return null
            }
            
            return (
              <div key={disciplineId} className="space-y-4">
                {/* Discipline Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-4">
                  <h2 className="text-3xl font-bold text-white">{discipline.displayName}</h2>
                  <p className="text-white/90 text-sm mt-1">
                    {Object.keys(disciplineDivisions).length} division{Object.keys(disciplineDivisions).length !== 1 ? 's' : ''} competing
                  </p>
                </div>
                
                {/* Division Tables Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(disciplineDivisions).map(([division, shooters]) => (
                    <div key={`${disciplineId}-${division}`} className="bg-white/10 backdrop-blur rounded-lg shadow-2xl overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-3 border-b border-white/10">
                        <h3 className="text-xl font-bold text-white">{division} Division</h3>
                        <p className="text-white/70 text-xs mt-1">
                          {shooters.length} shooter{shooters.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-white/80 w-12">#</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-white/80">Entrant</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-white/80 whitespace-nowrap">Team</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-white/80 bg-white/5">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {shooters.map((shooter, idx) => {
                              const isRecent = isRecentlyUpdated(shooter.lastUpdated)
                              return (
                                <tr 
                                  key={shooter.shooterId} 
                                  className={`transition ${
                                    isRecent 
                                      ? 'bg-green-500/20 animate-pulse' 
                                      : 'hover:bg-white/5'
                                  }`}
                                  title={isRecent ? 'Score updated in the last 2 minutes' : ''}
                                >
                                  <td className="px-3 py-2 text-sm text-white/70">
                                    {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-white whitespace-nowrap">
                                    {shooter.shooterName}
                                    {isRecent && (
                                      <span className="ml-2 text-xs text-green-400">✨ NEW</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-white/70 whitespace-nowrap">
                                    {shooter.teamName || '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right text-sm font-bold text-white bg-white/5">
                                    {shooter.disciplineScores[disciplineId]}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          
          {Object.keys(shootersByDisciplineAndDivision).length === 0 && (
            <div className="bg-white/10 backdrop-blur rounded-lg p-12 text-center">
              <p className="text-white/70">No scores recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* Squads View - Compact Table */}
      {activeView === 'squads' && (
        <div className="bg-white/10 backdrop-blur rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
            <h2 className="text-2xl font-bold text-white">👥 Squad Standings</h2>
            <p className="text-white/90 text-xs mt-1">Ranked by total squad score</p>
          </div>
          <div className="overflow-x-auto">
            {squadScores.length > 0 ? (
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-white/80 w-12">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-white/80">Squad</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-white/80">Team</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-white/80">Members</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-white/80">Status</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-white/80 bg-white/5">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...squadScores]
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((squad, idx) => (
                      <tr key={squad.squadId} className={`hover:bg-white/5 transition ${!squad.isComplete ? 'bg-yellow-400/5' : ''}`}>
                        <td className="px-3 py-2 text-sm text-white/70">
                          {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-white">
                          {squad.squadName}
                        </td>
                        <td className="px-3 py-2 text-xs text-white/70">
                          {squad.teamName || 'Mixed'}
                        </td>
                        <td className="px-3 py-2 text-xs text-white/70">
                          <div className="max-w-xs truncate" title={squad.members.join(', ')}>
                            {squad.members.join(', ')}
                          </div>
                          <div className="text-white/50 text-xs mt-0.5">
                            {squad.memberCount} shooter{squad.memberCount !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {squad.isComplete ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-400/20 text-green-300 border border-green-400/30">
                              ✓ Complete
                            </span>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                                ⚠️ {squad.completionPercentage}%
                              </span>
                              <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-yellow-400 h-full transition-all"
                                  style={{ width: `${squad.completionPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-white bg-white/5">
                          {squad.totalScore}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-white/50">
                No squads with scores yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white/10 backdrop-blur rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">📖 Legend & Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-white/90 text-sm">
          <div>
            <span className="font-semibold text-yellow-300">HOA (High Over All):</span> Combines scores from ALL disciplines and events in the tournament. The shooter with the highest total across every event wins HOA.
          </div>
          <div>
            <span className="font-semibold text-purple-300">HAA (High All-Around):</span> Combines scores from core disciplines only (Trap, Skeet, Sporting Clays). Requires participation in at least 2 core disciplines. HOA winners are excluded from HAA in their division.
          </div>
          <div>
            <span className="font-semibold text-green-300">✨ Recently Updated:</span> Rows with a green background and "✨ NEW" badge indicate scores that were entered or updated within the last 2 minutes.
          </div>
        </div>
      </div>
    </div>
  )
}

