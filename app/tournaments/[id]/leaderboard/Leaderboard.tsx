'use client'

import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import ShootOffResults from '@/components/ShootOffResults'

interface Tournament {
  id: string
  name: string
  status: string
  createdById: string
  disciplines: any[]
  shoots: any[]
  timeSlots: any[]
  shootOffs: any[]
  // HAA/HOA Configuration
  enableHOA: boolean
  enableHAA: boolean
  hoaSeparateGender: boolean
  haaCoreDisciplines: string | null
  hoaExcludesHAA: boolean
  haaExcludesDivision: boolean
  // Shoot-Off Configuration
  enableShootOffs: boolean
  shootOffTriggers: string | null
  shootOffFormat: string
  shootOffTargetsPerRound: number
  shootOffStartStation: string | null
  shootOffRequiresPerfect: boolean
}

interface athletescore {
  athleteId: string
  athleteName: string
  teamName: string | null
  teamLogoUrl: string | null
  division: string | null
  gender: string | null
  nscaClass: string | null
  ataClass: string | null
  nssaClass: string | null
  disciplineScores: Record<string, number>
  totalScore: number
  disciplineCount: number
  lastUpdated: Date | null // Track when scores were last updated
}

interface SquadScore {
  squadId: string
  squadName: string
  teamName: string | null
  teamLogoUrl: string | null
  totalScore: number
  memberCount: number
  members: string[]
  isComplete: boolean
  completionPercentage: number
}

interface LeaderboardProps {
  tournament: Tournament  // Initial server-rendered data
  isAdmin?: boolean
}

export default function Leaderboard({ tournament: initialTournament, isAdmin = false }: LeaderboardProps) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [expandedathlete, setExpandedathlete] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)

  // Fetch leaderboard data with React Query
  // PERFORMANCE: Uses 1-minute cache + stale-while-revalidate
  const { data: tournament = initialTournament, isLoading } = useQuery({
    queryKey: ['leaderboard', initialTournament.id],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${initialTournament.id}/leaderboard`)
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data')
      }
      return response.json()
    },
    initialData: initialTournament,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: autoRefresh ? 30 * 1000 : false, // Auto-refresh every 30s if enabled
    refetchOnWindowFocus: false
  })

  // Determine initial view based on tournament status
  const isTournamentComplete = tournament.status === 'completed'
  const [activeView, setActiveView] = useState<'podium' | 'divisions' | 'squads' | 'classes' | 'teams'>(
    isTournamentComplete ? 'podium' : 'divisions'
  )

  // Auto-cycle through views
  useEffect(() => {
    if (!autoRefresh) return

    const views: ('podium' | 'divisions' | 'squads' | 'classes' | 'teams')[] =
      isTournamentComplete
        ? ['podium', 'divisions', 'classes', 'teams', 'squads']
        : ['divisions', 'classes', 'teams', 'squads']

    const interval = setInterval(() => {
      setActiveView(current => {
        const currentIndex = views.indexOf(current)
        const nextIndex = (currentIndex + 1) % views.length
        return views[nextIndex]
      })
    }, 15000) // Cycle every 15 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, isTournamentComplete])

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

  // MEMOIZED: Calculate individual scores from shoots
  // PERFORMANCE: Only recalculates when shoots data changes
  const allathletes = useMemo(() => {
    const athletescores: Record<string, athletescore> = {}

    tournament.shoots.forEach((shoot: any) => {
      const key = shoot.athleteId
      if (!athletescores[key]) {
        athletescores[key] = {
          athleteId: shoot.athleteId,
          athleteName: shoot.athlete.user.name,
          teamName: shoot.athlete.team?.name || null,
          teamLogoUrl: shoot.athlete.team?.logoUrl || null,
          division: shoot.athlete.division || null,
          gender: shoot.athlete.gender || null,
          nscaClass: shoot.athlete.nscaClass || null,
          ataClass: shoot.athlete.ataClass || null,
          nssaClass: shoot.athlete.nssaClass || null,
          disciplineScores: {},
          totalScore: 0,
          disciplineCount: 0,
          lastUpdated: null
        }
      }

      const disciplineTotal = shoot.scores.reduce((sum: number, score: any) => sum + score.targets, 0)
      athletescores[key].disciplineScores[shoot.disciplineId] = disciplineTotal
      athletescores[key].totalScore += disciplineTotal
      athletescores[key].disciplineCount++

      // Track the most recent update
      const shootUpdated = new Date(shoot.updatedAt)
      if (!athletescores[key].lastUpdated || shootUpdated > athletescores[key].lastUpdated!) {
        athletescores[key].lastUpdated = shootUpdated
      }
    })

    return Object.values(athletescores)
  }, [tournament.shoots])

  // MEMOIZED: Calculate squad scores with completion status
  // PERFORMANCE: Only recalculates when timeSlots or athlete scores change
  const squadScores = useMemo(() => {
    const scores: SquadScore[] = []
    const athletescores = allathletes.reduce((acc, athlete) => {
      acc[athlete.athleteId] = athlete
      return acc
    }, {} as Record<string, athletescore>)

    tournament.timeSlots.forEach((timeSlot: any) => {
      timeSlot.squads.forEach((squad: any) => {
        let squadTotal = 0
        let membersWithScores = 0

        squad.members.forEach((member: any) => {
          const athletescore = athletescores[member.athleteId]
          if (athletescore && athletescore.totalScore > 0) {
            squadTotal += athletescore.totalScore
            membersWithScores++
          }
        })

        const isComplete = membersWithScores === squad.members.length && squad.members.length > 0

        scores.push({
          squadId: squad.id,
          squadName: squad.name,
          teamName: null, // Team name not available in optimized query
          teamLogoUrl: null,
          totalScore: squadTotal,
          memberCount: squad.members.length,
          members: [], // Member names not available in optimized query
          isComplete,
          completionPercentage: squad.members.length > 0 ? Math.round((membersWithScores / squad.members.length) * 100) : 0
        })
      })
    })

    return scores
  }, [tournament.timeSlots, allathletes])

  // MEMOIZED: Top 3 Overall Individuals
  const top3Overall = useMemo(() =>
    [...allathletes]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3),
    [allathletes]
  )

  // MEMOIZED: Top 3 Squads
  const top3Squads = useMemo(() =>
    [...squadScores]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3),
    [squadScores]
  )

  // MEMOIZED: Parse HAA Core Disciplines from tournament config
  const coreDisciplines = useMemo(() => {
    if (tournament.haaCoreDisciplines) {
      try {
        return JSON.parse(tournament.haaCoreDisciplines)
      } catch (e) {
        // Fallback to default if parsing fails
        return tournament.disciplines
          .filter((d: any) => ['trap', 'skeet', 'sporting_clays'].includes(d.discipline.name))
          .map((d: any) => d.disciplineId)
      }
    } else {
      // Default core disciplines
      return tournament.disciplines
        .filter((d: any) => ['trap', 'skeet', 'sporting_clays'].includes(d.discipline.name))
        .map((d: any) => d.disciplineId)
    }
  }, [tournament.haaCoreDisciplines, tournament.disciplines])

  // MEMOIZED: HOA (High Over All) - All disciplines combined
  // PERFORMANCE: Only recalculates when athlete scores or config changes
  const { hoaathletes, hoaMaleathletes, hoaFemaleathletes, hoaWinnerIds } = useMemo(() => {
    let hoaathletes: athletescore[] = []
    let hoaMaleathletes: athletescore[] = []
    let hoaFemaleathletes: athletescore[] = []

    if (tournament.enableHOA) {
      if (tournament.hoaSeparateGender) {
        // Separate HOA for males and females
        hoaMaleathletes = [...allathletes]
          .filter(s => s.disciplineCount > 0 && s.gender === 'male')
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3)

        hoaFemaleathletes = [...allathletes]
          .filter(s => s.disciplineCount > 0 && s.gender === 'female')
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3)
      } else {
        // Combined HOA
        hoaathletes = [...allathletes]
          .filter(s => s.disciplineCount > 0)
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3)
      }
    }

    // Collect all HOA winners for exclusion
    const hoaWinnerIds = new Set([
      ...hoaathletes.map(s => s.athleteId),
      ...hoaMaleathletes.map(s => s.athleteId),
      ...hoaFemaleathletes.map(s => s.athleteId)
    ])

    return { hoaathletes, hoaMaleathletes, hoaFemaleathletes, hoaWinnerIds }
  }, [allathletes, tournament.enableHOA, tournament.hoaSeparateGender])

  // MEMOIZED: HAA (High All-Around) - Specific core disciplines
  // PERFORMANCE: Only recalculates when scores, core disciplines, or config changes
  // PERFORMANCE FIX: Removed hoaWinnerIds from dependencies to avoid circular dependency
  // hoaWinnerIds is a new Set instance on each HOA memoization, causing unnecessary recalculations
  // Instead, depend on the underlying data (allathletes, tournament config) that determines HOA winners
  const { haaathletes, haaMaleathletes, haaFemaleathletes, haaWinnerIds } = useMemo(() => {
    let haaathletes: any[] = []
    let haaMaleathletes: any[] = []
    let haaFemaleathletes: any[] = []

    if (tournament.enableHAA) {
      const calculateHAA = (athletes: athletescore[]) => {
        return athletes
          .map(athlete => {
            const coreDisciplineScores = Object.entries(athlete.disciplineScores)
              .filter(([disciplineId]) => coreDisciplines.includes(disciplineId))

            const haaTotal = coreDisciplineScores.reduce((sum, [, score]) => sum + score, 0)
            const haaDisciplineCount = coreDisciplineScores.length

            return {
              ...athlete,
              haaTotal,
              haaDisciplineCount
            }
          })
          .filter(s => s.haaDisciplineCount >= 2) // Must shoot at least 2 core disciplines
          .filter(s => !tournament.hoaExcludesHAA || !hoaWinnerIds.has(s.athleteId)) // Exclude HOA winners if configured
          .sort((a, b) => b.haaTotal - a.haaTotal)
          .slice(0, 3)
      }

      if (tournament.hoaSeparateGender) {
        // Separate HAA for males and females
        haaMaleathletes = calculateHAA(allathletes.filter(s => s.gender === 'male'))
        haaFemaleathletes = calculateHAA(allathletes.filter(s => s.gender === 'female'))
      } else {
        // Combined HAA
        haaathletes = calculateHAA(allathletes)
      }
    }

    // Collect all HAA winners for exclusion from division leaderboards
    const haaWinnerIds = new Set([
      ...haaathletes.map(s => s.athleteId),
      ...haaMaleathletes.map(s => s.athleteId),
      ...haaFemaleathletes.map(s => s.athleteId)
    ])

    return { haaathletes, haaMaleathletes, haaFemaleathletes, haaWinnerIds }
  }, [allathletes, coreDisciplines, tournament.enableHAA, tournament.enableHOA, tournament.hoaSeparateGender, tournament.hoaExcludesHAA])


  // Get medal emoji
  const getMedal = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return ''
  }

  // Get discipline name by ID
  const getDisciplineName = (disciplineId: string) => {
    const discipline = tournament.disciplines.find((d: any) => d.disciplineId === disciplineId)
    return discipline?.discipline.displayName || 'Unknown'
  }

  // Toggle athlete details
  const toggleathlete = (athleteId: string) => {
    setExpandedathlete(expandedathlete === athleteId ? null : athleteId)
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
    new Set(allathletes.map(s => s.division).filter((d): d is string => Boolean(d)))
  ).sort()
  
  // Group athletes by discipline AND division
  const athletesByDisciplineAndDivision: Record<string, Record<string, athletescore[]>> = {}

  tournament.disciplines.forEach((td: any) => {
    const disciplineId = td.disciplineId
    athletesByDisciplineAndDivision[disciplineId] = {}

    divisions.forEach((division: string) => {
      let athletesInDisciplineAndDivision = allathletes.filter(
        s => s.division === division && s.disciplineScores[disciplineId] !== undefined
      )
      
      // Exclude HAA winners from division leaderboards if configured
      if (tournament.haaExcludesDivision && tournament.enableHAA) {
        athletesInDisciplineAndDivision = athletesInDisciplineAndDivision.filter(
          s => !haaWinnerIds.has(s.athleteId)
        )
      }
      
      athletesInDisciplineAndDivision.sort((a, b) => {
        // Sort by score for this specific discipline
        const aScore = a.disciplineScores[disciplineId] || 0
        const bScore = b.disciplineScores[disciplineId] || 0
        return bScore - aScore
      })
      
      if (athletesInDisciplineAndDivision.length > 0) {
        athletesByDisciplineAndDivision[disciplineId][division] = athletesInDisciplineAndDivision
      }
    })
  })

  return (
    <div className="space-y-4" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
      {/* Controls Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Auto-refresh */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-gray-700 text-sm font-medium">
              {autoRefresh ? 'Auto 30s' : 'Paused'}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition font-medium border border-gray-300"
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2 flex-wrap">
          {isTournamentComplete && (
            <button
              onClick={() => setActiveView('podium')}
              className={`px-2 py-1 rounded text-sm transition font-medium ${
                activeView === 'podium'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              🏆 Podium
            </button>
          )}
          <button
            onClick={() => setActiveView('divisions')}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              activeView === 'divisions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            📊 Divisions
          </button>
          <button
            onClick={() => setActiveView('classes')}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              activeView === 'classes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            🎯 Classes
          </button>
          <button
            onClick={() => setActiveView('teams')}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              activeView === 'teams'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            🏅 Teams
          </button>
          <button
            onClick={() => setActiveView('squads')}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              activeView === 'squads'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            👥 Squads
          </button>
        </div>
        
        {/* Zoom and Fullscreen Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition font-medium border border-gray-300"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-gray-700 text-sm font-medium min-w-[3rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition font-medium border border-gray-300"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition font-medium border border-gray-300"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⊗' : '⛶'} {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Shoot-Off Results - Show completed shoot-offs */}
      {tournament.shootOffs && tournament.shootOffs.length > 0 && (
        <ShootOffResults
          shootOffs={tournament.shootOffs}
          tournamentId={tournament.id}
          isAdmin={isAdmin}
        />
      )}

      {/* Podium View */}
      {activeView === 'podium' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* HOA - High Over All */}
          {tournament.enableHOA && !tournament.hoaSeparateGender && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                👑 HOA - High Over All
              </h2>
              <p className="text-gray-600 text-xs mb-3">All Disciplines Combined</p>
              
              {hoaathletes.length > 0 ? (
                <div className="space-y-2">
                  {hoaathletes.map((athlete, idx) => (
                    <div
                      key={athlete.athleteId}
                      className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{getMedal(idx)}</span>
                        <div>
                          <div className="text-base font-bold text-gray-900">
                            {athlete.athleteName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {athlete.teamName || 'Independent'} • {athlete.division || 'No Division'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {athlete.totalScore}
                        </div>
                        <div className="text-xs text-gray-600">
                          {athlete.disciplineCount} disc{athlete.disciplineCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No scores recorded yet
                </div>
              )}
            </div>
          )}

          {/* HOA - Male */}
          {tournament.enableHOA && tournament.hoaSeparateGender && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                👑 HOA - Male
              </h2>
              <p className="text-gray-600 text-xs mb-3">All Disciplines Combined</p>
              
              {hoaMaleathletes.length > 0 ? (
                <div className="space-y-2">
                  {hoaMaleathletes.map((athlete, idx) => (
                    <div
                      key={athlete.athleteId}
                      className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{getMedal(idx)}</span>
                        <div>
                          <div className="text-base font-bold text-gray-900">
                            {athlete.athleteName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {athlete.teamName || 'Independent'} • {athlete.division || 'No Division'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {athlete.totalScore}
                        </div>
                        <div className="text-xs text-gray-600">
                          {athlete.disciplineCount} disc{athlete.disciplineCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No scores recorded yet
                </div>
              )}
            </div>
          )}

          {/* HOA - Female */}
          {tournament.enableHOA && tournament.hoaSeparateGender && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                👑 HOA - Female
              </h2>
              <p className="text-gray-600 text-xs mb-3">All Disciplines Combined</p>
              
              {hoaFemaleathletes.length > 0 ? (
                <div className="space-y-2">
                  {hoaFemaleathletes.map((athlete, idx) => (
                    <div
                      key={athlete.athleteId}
                      className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{getMedal(idx)}</span>
                        <div>
                          <div className="text-base font-bold text-gray-900">
                            {athlete.athleteName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {athlete.teamName || 'Independent'} • {athlete.division || 'No Division'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {athlete.totalScore}
                        </div>
                        <div className="text-xs text-gray-600">
                          {athlete.disciplineCount} disc{athlete.disciplineCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No scores recorded yet
                </div>
              )}
            </div>
          )}

        {/* HAA - High All-Around */}
        {tournament.enableHAA && !tournament.hoaSeparateGender && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" style={{color: 'white'}}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              HAA - High All-Around
            </h2>
            <p className="text-gray-600 text-xs mb-3">Core Disciplines (Trap, Skeet, Sporting Clays)</p>
            
            {haaathletes.length > 0 ? (
              <div className="space-y-2">
                {haaathletes.map((athlete, idx) => (
                  <div
                    key={athlete.athleteId}
                    className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{getMedal(idx)}</span>
                      <div>
                        <div className="text-base font-bold text-gray-900">
                          {athlete.athleteName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {athlete.teamName || 'Independent'} • {athlete.division || 'No Division'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {athlete.haaTotal}
                      </div>
                      <div className="text-xs text-gray-600">
                        {athlete.haaDisciplineCount} core
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                Need 2+ core disciplines
              </div>
            )}
          </div>
        )}

        {/* HAA - Male */}
        {tournament.enableHAA && tournament.hoaSeparateGender && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" style={{color: 'white'}}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              HAA - Male
            </h2>
            <p className="text-gray-600 text-xs mb-3">Core Disciplines (Trap, Skeet, Sporting Clays)</p>
            
            {haaMaleathletes.length > 0 ? (
              <div className="space-y-2">
                {haaMaleathletes.map((athlete, idx) => (
                  <div
                    key={athlete.athleteId}
                    className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{getMedal(idx)}</span>
                      <div>
                        <div className="text-base font-bold text-gray-900">
                          {athlete.athleteName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {athlete.teamName || 'Independent'} • {athlete.division || 'No Division'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {athlete.haaTotal}
                      </div>
                      <div className="text-xs text-gray-600">
                        {athlete.haaDisciplineCount} core
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                Need 2+ core disciplines
              </div>
            )}
          </div>
        )}

        {/* HAA - Female */}
        {tournament.enableHAA && tournament.hoaSeparateGender && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" style={{color: 'white'}}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              HAA - Female
            </h2>
            <p className="text-gray-600 text-xs mb-3">Core Disciplines (Trap, Skeet, Sporting Clays)</p>
            
            {haaFemaleathletes.length > 0 ? (
              <div className="space-y-2">
                {haaFemaleathletes.map((athlete, idx) => (
                  <div
                    key={athlete.athleteId}
                    className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{getMedal(idx)}</span>
                      <div>
                        <div className="text-base font-bold text-gray-900">
                          {athlete.athleteName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {athlete.teamName || 'Independent'} • {athlete.division || 'No Division'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">
                        {athlete.haaTotal}
                      </div>
                      <div className="text-xs text-gray-600">
                        {athlete.haaDisciplineCount} core
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                Need 2+ core disciplines
              </div>
            )}
          </div>
        )}

        {/* Top 3 Overall */}
        <div className="bg-gradient-to-br from-stone-700 to-stone-900 rounded-lg shadow-xl p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            🏅 Top 3 Individuals
          </h2>
          <p className="text-gray-600 text-xs mb-3">Overall Tournament Leaders</p>
          
          {top3Overall.length > 0 ? (
            <div className="space-y-2">
              {top3Overall.map((athlete, idx) => (
                <div
                  key={athlete.athleteId}
                  className="bg-black/20 backdrop-blur rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{getMedal(idx)}</span>
                    <div>
                      <div className="text-base font-bold text-gray-900">
                        {athlete.athleteName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {athlete.teamName || 'Independent'} • {athlete.division || 'No Division'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {athlete.totalScore}
                    </div>
                    <div className="text-xs text-gray-600">
                      {athlete.disciplineCount} disc{athlete.disciplineCount !== 1 ? 's' : ''}
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
          <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            👥 Top 3 Squads
          </h2>
          <p className="text-gray-600 text-xs mb-3">Combined Squad Scores</p>
          
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
                        <div className="text-base font-bold text-gray-900 truncate">
                          {squad.squadName}
                        </div>
                        {!squad.isComplete && (
                          <span className="px-1.5 py-0.5 bg-yellow-400/20 text-yellow-200 text-xs font-semibold rounded">
                            {squad.completionPercentage}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {squad.teamName || 'Mixed'} • {squad.memberCount} athletes
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-xl font-bold text-gray-900">
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

      {/* Divisions View - Compact Grid with Classes Styling */}
      {activeView === 'divisions' && (
        <div className="space-y-3">
          {tournament.disciplines.map((td: any) => {
            const disciplineId = td.disciplineId
            const discipline = td.discipline
            const disciplineDivisions = athletesByDisciplineAndDivision[disciplineId]

            if (!disciplineDivisions || Object.keys(disciplineDivisions).length === 0) {
              return null
            }

            return (
              <div key={disciplineId} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                {/* Discipline Header */}
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{discipline.displayName}</h2>
                  <p className="text-gray-600 text-xs">
                    {Object.keys(disciplineDivisions).length} division{Object.keys(disciplineDivisions).length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Division Tables Grid - More columns to fit on one screen */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {Object.entries(disciplineDivisions).map(([division, athletes]) => (
                    <div key={`${disciplineId}-${division}`} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-white p-2 border-b border-gray-200">
                        <h3 className="text-sm font-bold text-gray-900">{division}</h3>
                        <p className="text-gray-600 text-xs">
                          {athletes.length} athlete{athletes.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 w-8">#</th>
                              <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600">Name</th>
                              <th className="px-2 py-1 text-right text-xs font-semibold text-gray-600 bg-white">Pts</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {athletes.map((athlete, idx) => {
                              const isRecent = isRecentlyUpdated(athlete.lastUpdated)
                              return (
                                <tr
                                  key={athlete.athleteId}
                                  className={`transition ${
                                    isRecent
                                      ? 'bg-green-50 animate-pulse'
                                      : idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                                  }`}
                                  title={athlete.teamName || 'Independent'}
                                >
                                  <td className="px-2 py-1 text-gray-600">
                                    {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                  </td>
                                  <td className="px-2 py-1 font-medium text-gray-900 text-xs truncate max-w-[120px]" title={athlete.athleteName}>
                                    {athlete.athleteName}
                                    {isRecent && <span className="ml-1 text-green-600">✨</span>}
                                  </td>
                                  <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                    {athlete.disciplineScores[disciplineId]}
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

          {Object.keys(athletesByDisciplineAndDivision).length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500 text-sm">No scores recorded yet</p>
            </div>
          )}
        </div>
      )}

      {/* Squads View - Compact Table */}
      {activeView === 'squads' && (
        <div className="bg-white/10 backdrop-blur rounded-lg shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
            <h2 className="text-xl font-bold text-gray-900">👥 Squad Standings</h2>
            <p className="text-gray-600 text-xs mt-1">Ranked by total squad score</p>
          </div>
          <div className="overflow-x-auto">
            {squadScores.length > 0 ? (
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-12">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Squad</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Team</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Members</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 bg-gray-100">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...squadScores]
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((squad, idx) => (
                      <tr key={squad.squadId} className={`hover:bg-white/5 transition ${!squad.isComplete ? 'bg-yellow-400/5' : ''}`}>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">
                          {squad.squadName}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {squad.teamName || 'Mixed'}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          <div className="max-w-xs truncate" title={squad.members.join(', ')}>
                            {squad.members.join(', ')}
                          </div>
                          <div className="text-gray-400 text-xs mt-0.5">
                            {squad.memberCount} athlete{squad.memberCount !== 1 ? 's' : ''}
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
                        <td className="px-3 py-2 text-right text-sm font-bold text-gray-900 bg-gray-100">
                          {squad.totalScore}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No squads with scores yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classes View - Compact Grid */}
      {activeView === 'classes' && (
        <div className="space-y-3">
          {tournament.disciplines.map((tournamentDiscipline: any) => {
            const disciplineId = tournamentDiscipline.disciplineId
            const disciplineName = tournamentDiscipline.discipline.displayName

            // Get athletes who competed in this discipline
            const disciplineathletes = allathletes.filter(
              athlete => athlete.disciplineScores[disciplineId] !== undefined
            )

            if (disciplineathletes.length === 0) return null

            // Determine which class field to use based on discipline name
            const classField =
              tournamentDiscipline.discipline.name === 'trap' ? 'ataClass' :
              tournamentDiscipline.discipline.name === 'skeet' ? 'nssaClass' :
              'nscaClass' // Default for sporting clays and others

            // Group athletes by class
            const athletesByClass: Record<string, athletescore[]> = {}
            disciplineathletes.forEach(athlete => {
              const athleteClass = athlete[classField] || 'Unclassified'
              if (!athletesByClass[athleteClass]) {
                athletesByClass[athleteClass] = []
              }
              athletesByClass[athleteClass].push(athlete)
            })

            // Sort classes (AA, A, B, C, D, E, then others alphabetically)
            const classOrder = ['AA', 'A', 'B', 'C', 'D', 'E']
            const sortedClasses = Object.keys(athletesByClass).sort((a, b) => {
              const aIndex = classOrder.indexOf(a)
              const bIndex = classOrder.indexOf(b)
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
              if (aIndex !== -1) return -1
              if (bIndex !== -1) return 1
              return a.localeCompare(b)
            })

            return (
              <div key={disciplineId} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                {/* Discipline Header */}
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{disciplineName} - Class Rankings</h2>
                  <p className="text-gray-600 text-xs">
                    {sortedClasses.length} class{sortedClasses.length !== 1 ? 'es' : ''}
                  </p>
                </div>

                {/* Class Tables Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {sortedClasses.map(athleteClass => {
                    const classathletes = athletesByClass[athleteClass]
                      .sort((a, b) => (b.disciplineScores[disciplineId] || 0) - (a.disciplineScores[disciplineId] || 0))

                    return (
                      <div key={athleteClass} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-white p-2 border-b border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900">Class {athleteClass}</h3>
                          <p className="text-gray-600 text-xs">
                            {classathletes.length} athlete{classathletes.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 w-8">#</th>
                                <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600">Name</th>
                                <th className="px-2 py-1 text-right text-xs font-semibold text-gray-600 bg-white">Pts</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {classathletes.map((athlete, idx) => {
                                const isRecent = isRecentlyUpdated(athlete.lastUpdated)
                                const score = athlete.disciplineScores[disciplineId] || 0
                                return (
                                  <tr
                                    key={athlete.athleteId}
                                    className={`transition ${
                                      isRecent
                                        ? 'bg-green-50 animate-pulse'
                                        : idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                                    }`}
                                    title={athlete.teamName || 'Independent'}
                                  >
                                    <td className="px-2 py-1 text-gray-600">
                                      {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                    </td>
                                    <td className="px-2 py-1 font-medium text-gray-900 text-xs truncate max-w-[120px]" title={athlete.athleteName}>
                                      {athlete.athleteName}
                                      {isRecent && <span className="ml-1 text-green-600">✨</span>}
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                      {score}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {tournament.disciplines.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500 text-sm">No disciplines found</p>
            </div>
          )}
        </div>
      )}

      {/* Teams View - Compact Grid */}
      {activeView === 'teams' && (
        <div className="space-y-3">
          {tournament.disciplines.map((tournamentDiscipline: any) => {
            const disciplineId = tournamentDiscipline.disciplineId
            const disciplineName = tournamentDiscipline.discipline.displayName

            // Get athletes who competed in this discipline and have teams
            const disciplineathletes = allathletes.filter(
              athlete => athlete.disciplineScores[disciplineId] !== undefined && athlete.teamName
            )

            if (disciplineathletes.length === 0) return null

            // Group athletes by team
            const athletesByTeam: Record<string, athletescore[]> = {}
            disciplineathletes.forEach(athlete => {
              const teamName = athlete.teamName!
              if (!athletesByTeam[teamName]) {
                athletesByTeam[teamName] = []
              }
              athletesByTeam[teamName].push(athlete)
            })

            // Calculate team scores (top 5 athletes per team)
            const teamScores = Object.entries(athletesByTeam).map(([teamName, teamathletes]) => {
              // Sort athletes by score for this discipline
              const sortedathletes = teamathletes
                .sort((a, b) => (b.disciplineScores[disciplineId] || 0) - (a.disciplineScores[disciplineId] || 0))

              // Take top 5
              const top5athletes = sortedathletes.slice(0, 5)
              const teamTotal = top5athletes.reduce((sum, athlete) => sum + (athlete.disciplineScores[disciplineId] || 0), 0)

              return {
                teamName,
                teamLogoUrl: teamathletes[0].teamLogoUrl,
                top5athletes,
                teamTotal,
                totalathletes: teamathletes.length
              }
            })

            // Sort teams by total score
            teamScores.sort((a, b) => b.teamTotal - a.teamTotal)

            return (
              <div key={disciplineId} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                {/* Discipline Header */}
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{disciplineName} - Team Scoring</h2>
                  <p className="text-gray-600 text-xs">
                    Top 5 athletes per team • {teamScores.length} team{teamScores.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                  {teamScores.map((team, index) => {
                    const isTopThree = index < 3

                    return (
                      <div
                        key={team.teamName}
                        className={`${isTopThree ? 'bg-yellow-50' : 'bg-gray-50'} border border-gray-200 rounded-lg overflow-hidden`}
                      >
                        <div className="bg-white p-2 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {team.teamLogoUrl && (
                                <img src={team.teamLogoUrl} alt={team.teamName} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                  {index < 3 && getMedal(index)} {team.teamName}
                                </h3>
                                <p className="text-gray-600 text-xs">
                                  {team.totalathletes} athlete{team.totalathletes !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-base font-bold text-gray-900">{team.teamTotal}</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <div className="space-y-1">
                            {team.top5athletes.map((athlete, idx) => (
                              <div
                                key={athlete.athleteId}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-gray-900 truncate flex-1 mr-2" title={athlete.athleteName}>
                                  {idx + 1}. {athlete.athleteName}
                                </span>
                                <span className="text-gray-900 font-bold">
                                  {athlete.disciplineScores[disciplineId]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {tournament.disciplines.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500 text-sm">No disciplines found</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-3">📖 Legend & Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-900 text-sm">
          <div>
            <span className="font-semibold text-yellow-600">HOA (High Over All):</span> Combines scores from ALL disciplines and events in the tournament. The athlete with the highest total across every event wins HOA.
          </div>
          <div>
            <span className="font-semibold text-purple-600">HAA (High All-Around):</span> Combines scores from core disciplines only (Trap, Skeet, Sporting Clays). Requires participation in at least 2 core disciplines. HOA winners are excluded from HAA in their division.
          </div>
          <div>
            <span className="font-semibold text-green-600">✨ Recently Updated:</span> Rows with a green background and "✨" badge indicate scores that were entered or updated within the last 2 minutes.
          </div>
        </div>
      </div>
    </div>
  )
}

