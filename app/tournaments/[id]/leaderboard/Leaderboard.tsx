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

  // Determine initial view
  const [activeView, setActiveView] = useState<'divisions' | 'squads' | 'classes' | 'teams' | 'hoa-haa'>('divisions')

  // Auto-cycle through views
  useEffect(() => {
    if (!autoRefresh) return

    const views: ('divisions' | 'squads' | 'classes' | 'teams' | 'hoa-haa')[] =
      ['divisions', 'classes', 'teams', 'hoa-haa', 'squads']

    const interval = setInterval(() => {
      setActiveView(current => {
        const currentIndex = views.indexOf(current)
        const nextIndex = (currentIndex + 1) % views.length
        return views[nextIndex]
      })
    }, 15000) // Cycle every 15 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

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

  // MEMOIZED: HOA (High Over All) - Per discipline (highest in EACH discipline)
  // PERFORMANCE: Only recalculates when athlete scores or config changes
  const hoaByDiscipline = useMemo(() => {
    const hoaResults: Record<string, { combined: athletescore[], male: athletescore[], female: athletescore[] }> = {}

    if (tournament.enableHOA) {
      tournament.disciplines.forEach((td: any) => {
        const disciplineId = td.disciplineId
        const athletesWithThisDiscipline = allathletes.filter(
          athlete => athlete.disciplineScores[disciplineId] !== undefined
        )

        if (tournament.hoaSeparateGender) {
          // Separate by gender
          hoaResults[disciplineId] = {
            combined: [],
            male: [...athletesWithThisDiscipline]
              .filter(s => s.gender === 'male')
              .sort((a, b) => (b.disciplineScores[disciplineId] || 0) - (a.disciplineScores[disciplineId] || 0))
              .slice(0, 3),
            female: [...athletesWithThisDiscipline]
              .filter(s => s.gender === 'female')
              .sort((a, b) => (b.disciplineScores[disciplineId] || 0) - (a.disciplineScores[disciplineId] || 0))
              .slice(0, 3)
          }
        } else {
          // Combined gender
          hoaResults[disciplineId] = {
            combined: [...athletesWithThisDiscipline]
              .sort((a, b) => (b.disciplineScores[disciplineId] || 0) - (a.disciplineScores[disciplineId] || 0))
              .slice(0, 3),
            male: [],
            female: []
          }
        }
      })
    }

    return hoaResults
  }, [allathletes, tournament.enableHOA, tournament.hoaSeparateGender, tournament.disciplines])

  // MEMOIZED: HAA (High All-Around) - All disciplines combined
  // PERFORMANCE: Only recalculates when athlete scores or config changes
  const { haaathletes, haaMaleathletes, haaFemaleathletes, haaWinnerIds } = useMemo(() => {
    let haaathletes: athletescore[] = []
    let haaMaleathletes: athletescore[] = []
    let haaFemaleathletes: athletescore[] = []

    if (tournament.enableHAA) {
      if (tournament.hoaSeparateGender) {
        // Separate HAA for males and females
        haaMaleathletes = [...allathletes]
          .filter(s => s.disciplineCount > 0 && s.gender === 'male')
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3)

        haaFemaleathletes = [...allathletes]
          .filter(s => s.disciplineCount > 0 && s.gender === 'female')
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3)
      } else {
        // Combined HAA
        haaathletes = [...allathletes]
          .filter(s => s.disciplineCount > 0)
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3)
      }
    }

    // Collect all HAA winners for exclusion from division leaderboards
    const haaWinnerIds = new Set([
      ...haaathletes.map(s => s.athleteId),
      ...haaMaleathletes.map(s => s.athleteId),
      ...haaFemaleathletes.map(s => s.athleteId)
    ])

    return { haaathletes, haaMaleathletes, haaFemaleathletes, haaWinnerIds }
  }, [allathletes, tournament.enableHAA, tournament.hoaSeparateGender])


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
            onClick={() => setActiveView('hoa-haa')}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              activeView === 'hoa-haa'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            👑 HOA/HAA
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

      {/* HOA/HAA View */}
      {activeView === 'hoa-haa' && (
        <div className="space-y-3">
          {/* HAA Section - All disciplines combined */}
          {tournament.enableHAA && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-gray-900">🎯 HAA - High All-Around</h2>
                <p className="text-gray-600 text-xs">All Disciplines Combined</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* HAA Combined or Male */}
                {(!tournament.hoaSeparateGender || (tournament.hoaSeparateGender && haaMaleathletes.length > 0)) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      {tournament.hoaSeparateGender ? 'Male' : 'Combined'}
                    </h3>
                    {(tournament.hoaSeparateGender ? haaMaleathletes : haaathletes).length > 0 ? (
                      <div className="space-y-1">
                        {(tournament.hoaSeparateGender ? haaMaleathletes : haaathletes).map((athlete, idx) => (
                          <div
                            key={athlete.athleteId}
                            className={`flex items-center justify-between p-2 rounded ${idx < 3 ? 'bg-yellow-50' : 'bg-white'}`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-lg">{getMedal(idx) || `${idx + 1}`}</span>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-gray-900 truncate">{athlete.athleteName}</div>
                                <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-base font-bold text-gray-900">{athlete.totalScore}</div>
                              <div className="text-xs text-gray-600">{athlete.disciplineCount} disc</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 text-xs">No scores yet</div>
                    )}
                  </div>
                )}

                {/* HAA Female */}
                {tournament.hoaSeparateGender && haaFemaleathletes.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Female</h3>
                    <div className="space-y-1">
                      {haaFemaleathletes.map((athlete, idx) => (
                        <div
                          key={athlete.athleteId}
                          className={`flex items-center justify-between p-2 rounded ${idx < 3 ? 'bg-yellow-50' : 'bg-white'}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg">{getMedal(idx) || `${idx + 1}`}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-gray-900 truncate">{athlete.athleteName}</div>
                              <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="text-base font-bold text-gray-900">{athlete.totalScore}</div>
                            <div className="text-xs text-gray-600">{athlete.disciplineCount} disc</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HOA Section - Per discipline */}
          {tournament.enableHOA && (
            <>
              {tournament.disciplines.map((td: any) => {
                const disciplineId = td.disciplineId
                const disciplineName = td.discipline.displayName
                const hoaResults = hoaByDiscipline[disciplineId]

                if (!hoaResults) return null

                const hasResults = tournament.hoaSeparateGender
                  ? (hoaResults.male.length > 0 || hoaResults.female.length > 0)
                  : hoaResults.combined.length > 0

                if (!hasResults) return null

                return (
                  <div key={disciplineId} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                    <div className="mb-3">
                      <h2 className="text-lg font-bold text-gray-900">👑 HOA - {disciplineName}</h2>
                      <p className="text-gray-600 text-xs">High Over All for this discipline</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* HOA Combined or Male */}
                      {(!tournament.hoaSeparateGender || (tournament.hoaSeparateGender && hoaResults.male.length > 0)) && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                          <h3 className="text-sm font-bold text-gray-900 mb-2">
                            {tournament.hoaSeparateGender ? 'Male' : 'Combined'}
                          </h3>
                          {(tournament.hoaSeparateGender ? hoaResults.male : hoaResults.combined).length > 0 ? (
                            <div className="space-y-1">
                              {(tournament.hoaSeparateGender ? hoaResults.male : hoaResults.combined).map((athlete, idx) => (
                                <div
                                  key={athlete.athleteId}
                                  className={`flex items-center justify-between p-2 rounded ${idx < 3 ? 'bg-yellow-50' : 'bg-white'}`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-lg">{getMedal(idx) || `${idx + 1}`}</span>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-bold text-gray-900 truncate">{athlete.athleteName}</div>
                                      <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                                    </div>
                                  </div>
                                  <div className="text-right ml-2">
                                    <div className="text-base font-bold text-gray-900">{athlete.disciplineScores[disciplineId]}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500 text-xs">No scores yet</div>
                          )}
                        </div>
                      )}

                      {/* HOA Female */}
                      {tournament.hoaSeparateGender && hoaResults.female.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                          <h3 className="text-sm font-bold text-gray-900 mb-2">Female</h3>
                          <div className="space-y-1">
                            {hoaResults.female.map((athlete, idx) => (
                              <div
                                key={athlete.athleteId}
                                className={`flex items-center justify-between p-2 rounded ${idx < 3 ? 'bg-yellow-50' : 'bg-white'}`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-lg">{getMedal(idx) || `${idx + 1}`}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-gray-900 truncate">{athlete.athleteName}</div>
                                    <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                                  </div>
                                </div>
                                <div className="text-right ml-2">
                                  <div className="text-base font-bold text-gray-900">{athlete.disciplineScores[disciplineId]}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
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

      {/* Squads View - Compact Grid */}
      {activeView === 'squads' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-gray-900">👥 Squad Standings</h2>
            <p className="text-gray-600 text-xs">
              Ranked by total squad score • {squadScores.length} squad{squadScores.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            {squadScores.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 w-8">#</th>
                    <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600">Squad</th>
                    <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600">Team</th>
                    <th className="px-2 py-1 text-center text-xs font-semibold text-gray-600">Athletes</th>
                    <th className="px-2 py-1 text-center text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-2 py-1 text-right text-xs font-semibold text-gray-600 bg-white">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...squadScores]
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((squad, idx) => (
                      <tr
                        key={squad.squadId}
                        className={`transition ${
                          idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                        } ${!squad.isComplete ? 'border-l-2 border-l-yellow-400' : ''}`}
                      >
                        <td className="px-2 py-1 text-gray-600">
                          {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                        </td>
                        <td className="px-2 py-1 text-xs font-medium text-gray-900 truncate max-w-[200px]" title={squad.squadName}>
                          {squad.squadName}
                        </td>
                        <td className="px-2 py-1 text-xs text-gray-600 truncate max-w-[120px]" title={squad.teamName || 'Mixed'}>
                          {squad.teamName || 'Mixed'}
                        </td>
                        <td className="px-2 py-1 text-xs text-gray-600 text-center">
                          {squad.memberCount}
                        </td>
                        <td className="px-2 py-1 text-center">
                          {squad.isComplete ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                              {squad.completionPercentage}%
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-right text-xs font-bold text-gray-900 bg-white">
                          {squad.totalScore}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
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

