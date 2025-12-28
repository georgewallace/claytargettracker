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
  // Leaderboard Configuration
  leaderboardTabInterval: number | null
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
  disciplinePlacements: Record<string, {
    concurrentPlace?: number
    classPlace?: number
    teamPlace?: number
    individualRank?: number
    teamRank?: number
    teamScore?: number
  }>
  totalScore: number
  disciplineCount: number
  lastUpdated: Date | null
  haaIndividualPlace?: number
  haaConcurrent?: string
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
  division: string | null
  disciplineId: string
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
  const [singleColumnMode, setSingleColumnMode] = useState(false)

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

    // Use configured interval or default to 15 seconds
    const tabInterval = tournament.leaderboardTabInterval || 15000

    const interval = setInterval(() => {
      setActiveView(current => {
        const currentIndex = views.indexOf(current)
        const nextIndex = (currentIndex + 1) % views.length
        return views[nextIndex]
      })
    }, tabInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, tournament.leaderboardTabInterval])

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
          disciplinePlacements: {},
          totalScore: 0,
          disciplineCount: 0,
          lastUpdated: null,
          haaIndividualPlace: shoot.haaIndividualPlace || undefined,
          haaConcurrent: shoot.haaConcurrent || undefined
        }
      }

      const disciplineTotal = shoot.scores.reduce((sum: number, score: any) => sum + score.targets, 0)
      athletescores[key].disciplineScores[shoot.disciplineId] = disciplineTotal

      // Store placement data for this discipline
      athletescores[key].disciplinePlacements[shoot.disciplineId] = {
        concurrentPlace: shoot.concurrentPlace || undefined,
        classPlace: shoot.classPlace || undefined,
        teamPlace: shoot.teamPlace || undefined,
        individualRank: shoot.individualRank || undefined,
        teamRank: shoot.teamRank || undefined,
        teamScore: shoot.teamScore || undefined
      }

      athletescores[key].totalScore += disciplineTotal
      athletescores[key].disciplineCount++

      // Use HAA data from any shoot (they should all be the same)
      if (shoot.haaIndividualPlace) {
        athletescores[key].haaIndividualPlace = shoot.haaIndividualPlace
      }
      if (shoot.haaConcurrent) {
        athletescores[key].haaConcurrent = shoot.haaConcurrent
      }

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
      const disciplineId = timeSlot.disciplineId

      timeSlot.squads.forEach((squad: any) => {
        let squadTotal = 0
        let membersWithScores = 0
        const divisions: Record<string, number> = {}
        const memberNames: string[] = []

        squad.members.forEach((member: any) => {
          const athletescore = athletescores[member.athleteId]
          if (athletescore) {
            // Only add the score for THIS discipline, not total score across all disciplines
            const disciplineScore = athletescore.disciplineScores[disciplineId] || 0
            if (disciplineScore > 0) {
              squadTotal += disciplineScore
              membersWithScores++
            }

            // Add athlete name to members list
            memberNames.push(athletescore.athleteName)

            // Track division counts for fallback calculation
            if (athletescore.division) {
              divisions[athletescore.division] = (divisions[athletescore.division] || 0) + 1
            }
          }
        })

        // Use squad's assigned division, fall back to most common member division if not set
        let squadDivision: string | null = squad.division || null

        // Fallback: If squad doesn't have division set, calculate from members
        if (!squadDivision) {
          let maxCount = 0
          Object.entries(divisions).forEach(([div, count]) => {
            if (count > maxCount) {
              maxCount = count
              squadDivision = div
            }
          })
        }

        const isComplete = membersWithScores === squad.members.length && squad.members.length > 0

        scores.push({
          squadId: squad.id,
          squadName: squad.name,
          teamName: null, // Team name not available in optimized query
          teamLogoUrl: null,
          totalScore: squadTotal,
          memberCount: squad.members.length,
          members: memberNames,
          isComplete,
          completionPercentage: squad.members.length > 0 ? Math.round((membersWithScores / squad.members.length) * 100) : 0,
          division: squadDivision,
          disciplineId: disciplineId
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

        // Always separate by gender - use configured place limits from Tournament Setup
        hoaResults[disciplineId] = {
          combined: [],
          male: [...athletesWithThisDiscipline]
            .filter(s => s.gender === 'M')
            .sort((a, b) => (b.disciplineScores[disciplineId] || 0) - (a.disciplineScores[disciplineId] || 0))
            .slice(0, tournament.hoaMenPlaces || 2),
          female: [...athletesWithThisDiscipline]
            .filter(s => s.gender === 'F')
            .sort((a, b) => (b.disciplineScores[disciplineId] || 0) - (a.disciplineScores[disciplineId] || 0))
            .slice(0, tournament.hoaLadyPlaces || 2)
        }
      })
    }

    return hoaResults
  }, [allathletes, tournament.enableHOA, tournament.disciplines, tournament.hoaMenPlaces, tournament.hoaLadyPlaces])

  // MEMOIZED: HAA (High All-Around) - All disciplines combined
  // PERFORMANCE: Only recalculates when athlete scores or config changes
  const { haaathletes, haaMaleathletes, haaFemaleathletes, haaWinnerIds } = useMemo(() => {
    let haaathletes: athletescore[] = []
    let haaMaleathletes: athletescore[] = []
    let haaFemaleathletes: athletescore[] = []

    if (tournament.enableHAA) {
      // Overall HAA - only show athletes with haaIndividualPlace set and no gender designation
      haaathletes = [...allathletes]
        .filter(s => {
          if (!s.haaIndividualPlace) return false
          // Check if haaConcurrent is gender-neutral (no "Men's", "Male", "Lady's", "Ladies", "Female", "Women")
          const concurrent = (s.haaConcurrent || '').toLowerCase()
          const isGenderSpecific = concurrent.includes("men") ||
                                   concurrent.includes("male") ||
                                   concurrent.includes("lady") ||
                                   concurrent.includes("ladies") ||
                                   concurrent.includes("female") ||
                                   concurrent.includes("women")
          return !isGenderSpecific
        })
        .sort((a, b) => (a.haaIndividualPlace || 999) - (b.haaIndividualPlace || 999))
        .slice(0, tournament.haaOverallPlaces || 2)

      // Get Overall HAA winner IDs to exclude from gender-specific categories
      const overallHAAWinnerIds = new Set(haaathletes.map(s => s.athleteId))

      // HAA for males - only show athletes with haaIndividualPlace and gender-specific designation
      haaMaleathletes = [...allathletes]
        .filter(s => {
          if (!s.haaIndividualPlace || overallHAAWinnerIds.has(s.athleteId)) return false
          const concurrent = (s.haaConcurrent || '').toLowerCase()
          return concurrent.includes("men") || concurrent.includes("male")
        })
        .sort((a, b) => (a.haaIndividualPlace || 999) - (b.haaIndividualPlace || 999))
        .slice(0, tournament.haaMenPlaces || 2)

      // HAA for females - only show athletes with haaIndividualPlace and gender-specific designation
      haaFemaleathletes = [...allathletes]
        .filter(s => {
          if (!s.haaIndividualPlace || overallHAAWinnerIds.has(s.athleteId)) return false
          const concurrent = (s.haaConcurrent || '').toLowerCase()
          return concurrent.includes("lady") || concurrent.includes("ladies") ||
                 concurrent.includes("female") || concurrent.includes("women")
        })
        .sort((a, b) => (a.haaIndividualPlace || 999) - (b.haaIndividualPlace || 999))
        .slice(0, tournament.haaLadyPlaces || 2)
    }

    // Collect all HAA winners for exclusion from division leaderboards
    const haaWinnerIds = new Set([
      ...haaathletes.map(s => s.athleteId),
      ...haaMaleathletes.map(s => s.athleteId),
      ...haaFemaleathletes.map(s => s.athleteId)
    ])

    return { haaathletes, haaMaleathletes, haaFemaleathletes, haaWinnerIds }
  }, [allathletes, tournament.enableHAA, tournament.haaOverallPlaces, tournament.haaMenPlaces, tournament.haaLadyPlaces])


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
  // Sort from highest to youngest: college, varsity, junior varsity, intermediate, novice
  const divisionOrder = ['college', 'varsity', 'junior varsity', 'intermediate', 'novice']
  const divisions = Array.from(
    new Set(allathletes.map(s => s.division).filter((d): d is string => Boolean(d)))
  ).sort((a, b) => {
    const aIndex = divisionOrder.indexOf(a.toLowerCase())
    const bIndex = divisionOrder.indexOf(b.toLowerCase())
    // If both divisions are in the order list, sort by their position
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    // If only a is in the list, it comes first
    if (aIndex !== -1) return -1
    // If only b is in the list, it comes first
    if (bIndex !== -1) return 1
    // Otherwise, sort alphabetically
    return a.localeCompare(b)
  })
  
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
        
        {/* Display and Fullscreen Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSingleColumnMode(!singleColumnMode)}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              singleColumnMode
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
            title={singleColumnMode ? 'Switch to Grid Layout' : 'Switch to Wrap Layout'}
          >
            {singleColumnMode ? '📊' : '📦'} {singleColumnMode ? 'Grid' : 'Wrap'}
          </button>
          <div className="w-px h-6 bg-gray-300"></div>
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

              <div className={singleColumnMode ? 'flex flex-wrap gap-2' : 'grid grid-cols-1 lg:grid-cols-3 gap-2'}>
                {/* HAA Overall */}
                {haaathletes.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-white p-2 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900">Overall</h3>
                      <p className="text-gray-600 text-xs">
                        {haaathletes.length} athlete{haaathletes.length !== 1 ? 's' : ''}
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
                          {haaathletes.map((athlete, idx) => {
                            return (
                              <tr key={athlete.athleteId} className={`transition ${idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                                <td className="px-2 py-1 text-gray-600">
                                  {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                </td>
                                <td className="px-2 py-1 font-medium text-gray-900 text-xs">
                                  <div className="flex flex-col">
                                    <div className="font-bold truncate">{athlete.athleteName}</div>
                                    <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                                  </div>
                                </td>
                                <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                  {Math.floor(athlete.totalScore)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* HAA Male */}
                {haaMaleathletes.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-white p-2 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900">Male</h3>
                      <p className="text-gray-600 text-xs">
                        {haaMaleathletes.length} athlete{haaMaleathletes.length !== 1 ? 's' : ''}
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
                          {haaMaleathletes.map((athlete, idx) => {
                            return (
                              <tr key={athlete.athleteId} className={`transition ${idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                                <td className="px-2 py-1 text-gray-600">
                                  {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                </td>
                                <td className="px-2 py-1 font-medium text-gray-900 text-xs">
                                  <div className="flex flex-col">
                                    <div className="font-bold truncate">{athlete.athleteName}</div>
                                    <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                                  </div>
                                </td>
                                <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                  {Math.floor(athlete.totalScore)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* HAA Female */}
                {haaFemaleathletes.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-white p-2 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900">Female</h3>
                      <p className="text-gray-600 text-xs">
                        {haaFemaleathletes.length} athlete{haaFemaleathletes.length !== 1 ? 's' : ''}
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
                          {haaFemaleathletes.map((athlete, idx) => {
                            return (
                              <tr key={athlete.athleteId} className={`transition ${idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                                <td className="px-2 py-1 text-gray-600">
                                  {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                </td>
                                <td className="px-2 py-1 font-medium text-gray-900 text-xs">
                                  <div className="flex flex-col">
                                    <div className="font-bold truncate">{athlete.athleteName}</div>
                                    <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                                  </div>
                                </td>
                                <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                  {Math.floor(athlete.totalScore)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
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

                const hasResults = hoaResults.male.length > 0 || hoaResults.female.length > 0

                if (!hasResults) return null

                return (
                  <div key={disciplineId} className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                    <div className="mb-3">
                      <h2 className="text-lg font-bold text-gray-900">👑 HOA - {disciplineName}</h2>
                      <p className="text-gray-600 text-xs">High Over All for this discipline</p>
                    </div>

                    <div className={singleColumnMode ? 'flex flex-wrap gap-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-2'}>
                      {/* HOA Male */}
                      {hoaResults.male.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-white p-2 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-900">Male</h3>
                            <p className="text-gray-600 text-xs">
                              {hoaResults.male.length} athlete{hoaResults.male.length !== 1 ? 's' : ''}
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
                                {hoaResults.male.map((athlete, idx) => (
                                  <tr key={athlete.athleteId} className={`transition ${idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                                    <td className="px-2 py-1 text-gray-600">
                                      {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                    </td>
                                    <td className="px-2 py-1 font-medium text-gray-900 text-xs">
                                      <div className="flex flex-col">
                                        <div className="font-bold truncate">{athlete.athleteName}</div>
                                        <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                                      </div>
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                      {Math.floor(athlete.disciplineScores[disciplineId])}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* HOA Female */}
                      {hoaResults.female.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-white p-2 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-900">Female</h3>
                            <p className="text-gray-600 text-xs">
                              {hoaResults.female.length} athlete{hoaResults.female.length !== 1 ? 's' : ''}
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
                                {hoaResults.female.map((athlete, idx) => (
                                  <tr key={athlete.athleteId} className={`transition ${idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                                    <td className="px-2 py-1 text-gray-600">
                                      {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                    </td>
                                    <td className="px-2 py-1 font-medium text-gray-900 text-xs">
                                      <div className="flex flex-col">
                                        <div className="font-bold truncate">{athlete.athleteName}</div>
                                        <div className="text-xs text-gray-600 truncate">{athlete.teamName || 'Independent'}</div>
                                      </div>
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                      {Math.floor(athlete.disciplineScores[disciplineId])}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
        <div className={singleColumnMode ? 'flex gap-3' : 'space-y-3'}>
          {tournament.disciplines.map((td: any) => {
            const disciplineId = td.disciplineId
            const discipline = td.discipline
            const disciplineDivisions = athletesByDisciplineAndDivision[disciplineId]

            if (!disciplineDivisions || Object.keys(disciplineDivisions).length === 0) {
              return null
            }

            return (
              <div key={disciplineId} className={`bg-white border border-gray-200 rounded-lg shadow-sm p-3 ${singleColumnMode ? 'flex-1 min-w-0' : ''}`}>
                {/* Discipline Header */}
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{discipline.displayName}</h2>
                  <p className="text-gray-600 text-xs">
                    {Object.keys(disciplineDivisions).length} division{Object.keys(disciplineDivisions).length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Division Tables Grid - More columns to fit on one screen */}
                <div className={singleColumnMode ? 'flex flex-col gap-2' : 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'}>
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
        <div className={singleColumnMode ? 'flex gap-3' : 'space-y-3'}>
          {tournament.disciplines.map((td: any) => {
            const disciplineId = td.disciplineId
            const discipline = td.discipline

            // Get squads for this discipline
            const disciplineSquads = squadScores.filter(s => s.disciplineId === disciplineId)

            if (disciplineSquads.length === 0) return null

            // Group squads by division
            const squadsByDivision: Record<string, SquadScore[]> = {}
            disciplineSquads.forEach(squad => {
              const division = squad.division || 'Mixed'
              if (!squadsByDivision[division]) {
                squadsByDivision[division] = []
              }
              squadsByDivision[division].push(squad)
            })

            // Sort divisions from highest to youngest
            const divisionOrder = ['college', 'varsity', 'junior varsity', 'intermediate', 'novice']
            const sortedDivisions = Object.keys(squadsByDivision).sort((a, b) => {
              const aIndex = divisionOrder.indexOf(a.toLowerCase())
              const bIndex = divisionOrder.indexOf(b.toLowerCase())
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
              if (aIndex !== -1) return -1
              if (bIndex !== -1) return 1
              return a.localeCompare(b)
            })

            return (
              <div key={disciplineId} className={`bg-white border border-gray-200 rounded-lg shadow-sm p-3 ${singleColumnMode ? 'flex-1 min-w-0' : ''}`}>
                {/* Discipline Header */}
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-gray-900">👥 {discipline.displayName} - Squad Standings</h2>
                  <p className="text-gray-600 text-xs">
                    {sortedDivisions.length} division{sortedDivisions.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Squad Tables Grid */}
                <div className={singleColumnMode ? 'flex flex-col gap-2' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2'}>
                  {sortedDivisions.map(division => {
                    const divisionSquads = squadsByDivision[division]
                      .sort((a, b) => b.totalScore - a.totalScore)

                    return (
                      <div key={`${disciplineId}-${division}`} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-white p-2 border-b border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900">{division}</h3>
                          <p className="text-gray-600 text-xs">
                            {divisionSquads.length} squad{divisionSquads.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600 w-8">#</th>
                                <th className="px-2 py-1 text-left text-xs font-semibold text-gray-600">Squad</th>
                                <th className="px-2 py-1 text-center text-xs font-semibold text-gray-600">Ath</th>
                                <th className="px-2 py-1 text-right text-xs font-semibold text-gray-600 bg-white">Pts</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {divisionSquads.map((squad, idx) => (
                                <tr
                                  key={squad.squadId}
                                  className={`transition ${
                                    idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                                  } ${!squad.isComplete ? 'border-l-2 border-l-yellow-400' : ''}`}
                                >
                                  <td className="px-2 py-1 text-gray-600">
                                    {idx < 3 ? getMedal(idx) : `${idx + 1}`}
                                  </td>
                                  <td className="px-2 py-1 font-medium text-gray-900 text-xs">
                                    <div className="flex flex-col">
                                      <div className="font-bold">
                                        {squad.squadName}
                                        {!squad.isComplete && (
                                          <span className="ml-1 text-yellow-600 text-xs" title={`${squad.completionPercentage}% complete`}>
                                            ⚠
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-0.5">
                                        {squad.members.join(', ')}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 text-xs text-gray-600 text-center">
                                    {squad.memberCount}
                                  </td>
                                  <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                    {Math.floor(squad.totalScore)}
                                  </td>
                                </tr>
                              ))}
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
        </div>
      )}

      {/* Classes View - Compact Grid */}
      {activeView === 'classes' && (
        <div className={singleColumnMode ? 'flex gap-3' : 'space-y-3'}>
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
              <div key={disciplineId} className={`bg-white border border-gray-200 rounded-lg shadow-sm p-3 ${singleColumnMode ? 'flex-1 min-w-0' : ''}`}>
                {/* Discipline Header */}
                <div className="mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{disciplineName} - Class Rankings</h2>
                  <p className="text-gray-600 text-xs">
                    {sortedClasses.length} class{sortedClasses.length !== 1 ? 'es' : ''}
                  </p>
                </div>

                {/* Class Tables Grid */}
                <div className={singleColumnMode ? 'flex flex-col gap-2' : 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'}>
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
                                      {Math.floor(score)}
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

