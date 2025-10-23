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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  
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
  
  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

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

  // Get unique divisions (filter out null/undefined)
  const divisions = Array.from(
    new Set(allShooters.map(s => s.division).filter((d): d is string => Boolean(d)))
  ).sort()
  
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
    <div className="space-y-4" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
      {/* Controls Bar */}
      <div className="bg-gradient-to-r from-orange-900/50 to-amber-900/50 backdrop-blur rounded-lg p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Auto-refresh */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-white text-sm font-medium">
              {autoRefresh ? 'Auto 30s' : 'Paused'}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="px-3 py-1.5 bg-orange-700/40 hover:bg-orange-700/60 text-white rounded text-sm transition font-medium"
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          {isTournamentComplete && (
            <button
              onClick={() => setActiveView('podium')}
              className={`px-3 py-1.5 rounded text-sm transition font-medium ${
                activeView === 'podium'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-orange-900/30 text-white hover:bg-orange-800/40'
              }`}
            >
              🏆 Podium
            </button>
          )}
          <button
            onClick={() => setActiveView('divisions')}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              activeView === 'divisions'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-orange-900/30 text-white hover:bg-orange-800/40'
            }`}
          >
            📊 Divisions
          </button>
          <button
            onClick={() => setActiveView('squads')}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              activeView === 'squads'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-orange-900/30 text-white hover:bg-orange-800/40'
            }`}
          >
            👥 Squads
          </button>
        </div>
        
        {/* Zoom and Fullscreen Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="px-2 py-1.5 bg-orange-700/40 hover:bg-orange-700/60 text-white rounded text-sm transition font-bold"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-white text-sm font-medium min-w-[3rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            className="px-2 py-1.5 bg-orange-700/40 hover:bg-orange-700/60 text-white rounded text-sm transition font-bold"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 bg-orange-700/40 hover:bg-orange-700/60 text-white rounded text-sm transition font-medium ml-2"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⊗' : '⛶'} {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Podium View */}
      {activeView === 'podium' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* HOA - High Over All */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-lg shadow-xl p-4">
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            👑 HOA - High Over All
          </h2>
          <p className="text-white/90 text-xs mb-4">All Disciplines Combined</p>
          
          {hoaShooters.length > 0 ? (
            <div className="space-y-2">
              {hoaShooters.map((shooter, idx) => (
                <div
                  key={shooter.shooterId}
                  className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{getMedal(idx)}</span>
                    <div>
                      <div className="text-lg font-bold text-white">
                        {shooter.shooterName}
                      </div>
                      <div className="text-xs text-white/80">
                        {shooter.teamName || 'Independent'} • {shooter.division || 'No Division'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {shooter.totalScore}
                    </div>
                    <div className="text-xs text-white/80">
                      {shooter.disciplineCount} disc{shooter.disciplineCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/70 text-sm">
              No scores recorded yet
            </div>
          )}
        </div>

        {/* HAA - High All-Around */}
        <div className="bg-gradient-to-br from-amber-700 to-orange-900 rounded-lg shadow-xl p-4">
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            🎯 HAA - High All-Around
          </h2>
          <p className="text-white/90 text-xs mb-4">Core Disciplines (Trap, Skeet, Sporting Clays)</p>
          
          {haaShooters.length > 0 ? (
            <div className="space-y-2">
              {haaShooters.map((shooter, idx) => (
                <div
                  key={shooter.shooterId}
                  className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{getMedal(idx)}</span>
                    <div>
                      <div className="text-lg font-bold text-white">
                        {shooter.shooterName}
                      </div>
                      <div className="text-xs text-white/80">
                        {shooter.teamName || 'Independent'} • {shooter.division || 'No Division'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {shooter.haaTotal}
                    </div>
                    <div className="text-xs text-white/80">
                      {shooter.haaDisciplineCount} core
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/70 text-sm">
              Need 2+ core disciplines
            </div>
          )}
        </div>

        {/* Top 3 Overall */}
        <div className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-lg shadow-xl p-4">
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            🏅 Top 3 Individuals
          </h2>
          <p className="text-white/90 text-xs mb-4">Overall Tournament Leaders</p>
          
          {top3Overall.length > 0 ? (
            <div className="space-y-2">
              {top3Overall.map((shooter, idx) => (
                <div
                  key={shooter.shooterId}
                  className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{getMedal(idx)}</span>
                    <div>
                      <div className="text-lg font-bold text-white">
                        {shooter.shooterName}
                      </div>
                      <div className="text-xs text-white/80">
                        {shooter.teamName || 'Independent'} • {shooter.division || 'No Division'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {shooter.totalScore}
                    </div>
                    <div className="text-xs text-white/80">
                      {shooter.disciplineCount} disc{shooter.disciplineCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/70 text-sm">
              No scores recorded yet
            </div>
          )}
        </div>

        {/* Top 3 Squads */}
        <div className="bg-gradient-to-br from-green-800 to-green-950 rounded-lg shadow-xl p-4">
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            👥 Top 3 Squads
          </h2>
          <p className="text-white/90 text-xs mb-4">Combined Squad Scores</p>
          
          {top3Squads.length > 0 ? (
            <div className="space-y-2">
              {top3Squads.map((squad, idx) => (
                <div
                  key={squad.squadId}
                  className={`bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between ${!squad.isComplete ? 'border border-yellow-400/50' : ''}`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-3xl">{getMedal(idx)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-white truncate">
                          {squad.squadName}
                        </div>
                        {!squad.isComplete && (
                          <span className="px-1.5 py-0.5 bg-yellow-400/20 text-yellow-200 text-xs font-semibold rounded">
                            {squad.completionPercentage}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/80 truncate">
                        {squad.teamName || 'Mixed'} • {squad.memberCount} shooters
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-2xl font-bold text-white">
                      {squad.totalScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/70 text-sm">
              No squads with scores yet
            </div>
          )}
        </div>
        </div>
      )}

      {/* Divisions View - Compact Grid */}
      {activeView === 'divisions' && (
        <div className="space-y-3">
          {tournament.disciplines.map(td => {
            const disciplineId = td.disciplineId
            const discipline = td.discipline
            const disciplineDivisions = shootersByDisciplineAndDivision[disciplineId]
            
            if (!disciplineDivisions || Object.keys(disciplineDivisions).length === 0) {
              return null
            }
            
            return (
              <div key={disciplineId} className="space-y-2">
                {/* Discipline Header */}
                <div className="bg-gradient-to-r from-orange-800 to-amber-900 rounded-lg p-2">
                  <h2 className="text-xl font-bold text-white">{discipline.displayName}</h2>
                  <p className="text-white/90 text-xs">
                    {Object.keys(disciplineDivisions).length} division{Object.keys(disciplineDivisions).length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {/* Division Tables Grid - More columns to fit on one screen */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {Object.entries(disciplineDivisions).map(([division, shooters]) => (
                    <div key={`${disciplineId}-${division}`} className="bg-stone-900/40 backdrop-blur rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-stone-800 to-stone-900 p-2 border-b border-orange-400/20">
                        <h3 className="text-sm font-bold text-white">{division}</h3>
                        <p className="text-white/70 text-xs">
                          {shooters.length} shooter{shooters.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-black/20">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-semibold text-white/70 w-8">#</th>
                              <th className="px-2 py-1 text-left text-xs font-semibold text-white/70">Name</th>
                              <th className="px-2 py-1 text-right text-xs font-semibold text-white/70 bg-orange-900/20">Pts</th>
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
                                  title={shooter.teamName || 'Independent'}
                                >
                                  <td className="px-2 py-1 text-white/60">
                                    {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                  </td>
                                  <td className="px-2 py-1 font-medium text-white text-xs truncate max-w-[120px]" title={shooter.shooterName}>
                                    {shooter.shooterName}
                                    {isRecent && <span className="ml-1 text-green-400">✨</span>}
                                  </td>
                                  <td className="px-2 py-1 text-right font-bold text-white bg-orange-900/10">
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
            <div className="bg-stone-900/40 backdrop-blur rounded-lg p-8 text-center">
              <p className="text-white/70 text-sm">No scores recorded yet</p>
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

