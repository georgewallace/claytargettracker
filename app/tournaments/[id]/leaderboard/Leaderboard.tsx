'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
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
    hoaPlace?: number
    haaIndividualPlace?: number
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
  const [haaAllPage, setHaaAllPage] = useState(0)
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null)

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
  const [activeView, setActiveView] = useState<'divisions' | 'squads' | 'classes' | 'teams' | 'hoa-haa' | 'haa-all'>('divisions')
  const [haaDisciplineIndex, setHaaDisciplineIndex] = useState(0)

  // Use refs to track current values without triggering effect re-runs
  const activeViewRef = useRef(activeView)
  const activeDisciplineRef = useRef(activeDiscipline)
  const haaDisciplineIndexRef = useRef(haaDisciplineIndex)

  // Keep refs in sync with state
  useEffect(() => {
    activeViewRef.current = activeView
  }, [activeView])

  useEffect(() => {
    activeDisciplineRef.current = activeDiscipline
  }, [activeDiscipline])

  useEffect(() => {
    haaDisciplineIndexRef.current = haaDisciplineIndex
  }, [haaDisciplineIndex])

  // Initialize activeDiscipline to first discipline
  useEffect(() => {
    if (!activeDiscipline && tournament.disciplines.length > 0) {
      setActiveDiscipline(tournament.disciplines[0].disciplineId)
    }
  }, [tournament.disciplines, activeDiscipline])

  // Coordinated auto-cycle through views and disciplines
  useEffect(() => {
    if (!autoRefresh) return

    const disciplineIds = tournament.disciplines.map((d: any) => d.disciplineId)
    if (disciplineIds.length === 0) return

    // Use configured interval (in seconds, convert to ms) or default to 15 seconds
    const intervalMs = (tournament.leaderboardTabInterval || 15) * 1000

    const interval = setInterval(() => {
      // Views that cycle through disciplines: divisions, classes, teams, squads
      const disciplineCycleViews: Array<'divisions' | 'squads' | 'classes' | 'teams' | 'hoa-haa' | 'haa-all'> = ['divisions', 'classes', 'teams', 'squads']

      // Get current values from refs
      const currentView = activeViewRef.current
      const currentDiscipline = activeDisciplineRef.current
      const currentHaaDisciplineIndex = haaDisciplineIndexRef.current

      console.log('[Leaderboard Rotation]', { currentView, currentDiscipline, currentHaaDisciplineIndex, intervalMs })

      if (currentView === 'haa-all') {
        // HAA All: cycle through pages, then move to next view
        setHaaAllPage(current => {
          const nextPage = current + 1
          // Calculate total pages from allHAAathletes
          const ITEMS_PER_PAGE = 20
          const totalPages = Math.ceil(tournament.shoots.length / ITEMS_PER_PAGE) || 1

          // If we've cycled through all pages, move to next view
          if (nextPage >= totalPages) {
            setActiveView('divisions')
            setActiveDiscipline(disciplineIds[0])
            return 0
          }
          return nextPage
        })
      } else if (currentView === 'hoa-haa') {
        // HOA/HAA: cycle through disciplines for HAA section
        const nextDisciplineIndex = (currentHaaDisciplineIndex + 1) % disciplineIds.length

        setHaaDisciplineIndex(nextDisciplineIndex)

        if (nextDisciplineIndex === 0) {
          // Completed all disciplines, move to next view
          setActiveView('haa-all')
          setHaaAllPage(0)
        }
      } else if (disciplineCycleViews.includes(currentView)) {
        // For divisions, classes, teams, squads: cycle through all disciplines
        const currentDisciplineIndex = disciplineIds.indexOf(currentDiscipline!)
        const nextDisciplineIndex = (currentDisciplineIndex + 1) % disciplineIds.length

        if (nextDisciplineIndex === 0) {
          // Completed all disciplines for this view, move to next view
          const viewOrder: Array<'divisions' | 'squads' | 'classes' | 'teams' | 'hoa-haa' | 'haa-all'> = ['divisions', 'classes', 'teams', 'squads', 'hoa-haa', 'haa-all']
          const currentViewIndex = viewOrder.indexOf(currentView)
          const nextView = viewOrder[(currentViewIndex + 1) % viewOrder.length]
          setActiveView(nextView)

          if (nextView === 'hoa-haa') {
            setHaaDisciplineIndex(0)
          } else if (nextView === 'haa-all') {
            setHaaAllPage(0)
          }
        }

        setActiveDiscipline(disciplineIds[nextDisciplineIndex])
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [autoRefresh, tournament.disciplines, tournament.leaderboardTabInterval])

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
        hoaPlace: shoot.hoaPlace || undefined,
        haaIndividualPlace: shoot.haaIndividualPlace || undefined,
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
            // SKIP unaffiliated or unassigned athletes from squad scoring
            if (!athletescore.teamName || athletescore.division === 'Unassigned') {
              return
            }

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

        // Parse division from squad name first (format: "Team Name - Division N")
        // e.g., "Unaffiliated - Open 1" → "Open", "Rocky Mountain - Varsity 1" → "Varsity"
        let squadDivision: string | null = null
        const squadNameParts = squad.name.split(' - ')
        if (squadNameParts.length > 1) {
          // Extract division from second part, removing the number
          // "Open 1" → "Open", "Varsity 2" → "Varsity", "Junior Varsity 1" → "Junior Varsity"
          const divisionPart = squadNameParts[1].trim()
          squadDivision = divisionPart.replace(/\s+\d+$/, '').trim()
        }

        // Fallback 1: Use squad's assigned division field
        if (!squadDivision) {
          squadDivision = squad.division || null
        }

        // Fallback 2: Calculate from most common member division
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

  // MEMOIZED: HOA (High Over All) - Overall champions across ALL disciplines
  // PERFORMANCE: Only recalculates when athlete scores or config changes
  const { hoaathletes, hoaMaleathletes, hoaFemaleathletes, hoaWinnerIds } = useMemo(() => {
    let hoaathletes: athletescore[] = []
    let hoaMaleathletes: athletescore[] = []
    let hoaFemaleathletes: athletescore[] = []

    if (tournament.enableHOA) {
      // Overall HOA - athletes with hoaPlace set (from "HOA Individual Place" Excel column)
      // Filter for gender-neutral placements (no "Men's" or "Lady's" in haaConcurrent)
      hoaathletes = [...allathletes]
        .filter(s => {
          // Must have at least one shoot with hoaPlace set
          const hasHoaPlace = Object.values(s.disciplinePlacements).some((p: any) => p?.hoaPlace !== undefined)
          if (!hasHoaPlace) return false

          // Check if haaConcurrent is gender-neutral (e.g., "HOA Champion" not "HOA Men's Champion")
          const concurrent = (s.haaConcurrent || '').toLowerCase()
          const isGenderSpecific = concurrent.includes("men's") ||
                                   concurrent.includes("mens") ||
                                   concurrent.includes("male") ||
                                   concurrent.includes("lady's") ||
                                   concurrent.includes("ladies") ||
                                   concurrent.includes("female") ||
                                   concurrent.includes("women")
          return !isGenderSpecific
        })
        .map(s => {
          // Get the hoaPlace from any discipline (should be same across all)
          const hoaPlace = Object.values(s.disciplinePlacements).find((p: any) => p?.hoaPlace !== undefined)?.hoaPlace
          return { ...s, hoaPlace }
        })
        .sort((a: any, b: any) => (a.hoaPlace || 999) - (b.hoaPlace || 999))
        .slice(0, tournament.haaOverallPlaces || 2) // Use haaOverallPlaces config for HOA

      const overallHOAWinnerIds = new Set(hoaathletes.map(s => s.athleteId))

      // HOA for males - athletes with hoaPlace and gender-specific designation
      hoaMaleathletes = [...allathletes]
        .filter(s => {
          const hasHoaPlace = Object.values(s.disciplinePlacements).some((p: any) => p?.hoaPlace !== undefined)
          if (!hasHoaPlace || overallHOAWinnerIds.has(s.athleteId)) return false

          const concurrent = (s.haaConcurrent || '').toLowerCase()
          return concurrent.includes("men's") || concurrent.includes("mens") || concurrent.includes("male")
        })
        .map(s => {
          const hoaPlace = Object.values(s.disciplinePlacements).find((p: any) => p?.hoaPlace !== undefined)?.hoaPlace
          return { ...s, hoaPlace }
        })
        .sort((a: any, b: any) => (a.hoaPlace || 999) - (b.hoaPlace || 999))
        .slice(0, tournament.haaMenPlaces || 2)

      // HOA for females - athletes with hoaPlace and gender-specific designation
      hoaFemaleathletes = [...allathletes]
        .filter(s => {
          const hasHoaPlace = Object.values(s.disciplinePlacements).some((p: any) => p?.hoaPlace !== undefined)
          if (!hasHoaPlace || overallHOAWinnerIds.has(s.athleteId)) return false

          const concurrent = (s.haaConcurrent || '').toLowerCase()
          return concurrent.includes("lady's") || concurrent.includes("ladies") ||
                 concurrent.includes("female") || concurrent.includes("women")
        })
        .map(s => {
          const hoaPlace = Object.values(s.disciplinePlacements).find((p: any) => p?.hoaPlace !== undefined)?.hoaPlace
          return { ...s, hoaPlace }
        })
        .sort((a: any, b: any) => (a.hoaPlace || 999) - (b.hoaPlace || 999))
        .slice(0, tournament.haaLadyPlaces || 2)
    }

    const hoaWinnerIds = new Set([
      ...hoaathletes.map(s => s.athleteId),
      ...hoaMaleathletes.map(s => s.athleteId),
      ...hoaFemaleathletes.map(s => s.athleteId)
    ])

    return { hoaathletes, hoaMaleathletes, hoaFemaleathletes, hoaWinnerIds }
  }, [allathletes, tournament.enableHOA, tournament.haaOverallPlaces, tournament.haaMenPlaces, tournament.haaLadyPlaces])

  // MEMOIZED: HAA (High All-Around) - Per discipline champions (highest in EACH discipline)
  // PERFORMANCE: Only recalculates when athlete scores or config changes
  const haaByDiscipline = useMemo(() => {
    const haaResults: Record<string, { combined: athletescore[], male: athletescore[], female: athletescore[] }> = {}

    if (tournament.enableHAA) {
      tournament.disciplines.forEach((td: any) => {
        const disciplineId = td.disciplineId

        // Filter athletes who have HAA placement for this discipline (using haaIndividualPlace from "HAA" concurrent place)
        const athletesWithHAAPlace = allathletes.filter(
          athlete => {
            const placement = athlete.disciplinePlacements[disciplineId]
            // Check both haaIndividualPlace (stored from parsePlacementText) and legacy field
            return placement?.haaIndividualPlace !== undefined && placement?.haaIndividualPlace !== null
          }
        )

        // Separate by gender - use configured place limits from Tournament Setup
        haaResults[disciplineId] = {
          combined: [],
          male: [...athletesWithHAAPlace]
            .filter(s => s.gender === 'M')
            .sort((a, b) => {
              const aPlace = a.disciplinePlacements[disciplineId]?.haaIndividualPlace || 999
              const bPlace = b.disciplinePlacements[disciplineId]?.haaIndividualPlace || 999
              return aPlace - bPlace
            })
            .slice(0, tournament.hoaMenPlaces || 2),
          female: [...athletesWithHAAPlace]
            .filter(s => s.gender === 'F')
            .sort((a, b) => {
              const aPlace = a.disciplinePlacements[disciplineId]?.haaIndividualPlace || 999
              const bPlace = b.disciplinePlacements[disciplineId]?.haaIndividualPlace || 999
              return aPlace - bPlace
            })
            .slice(0, tournament.hoaLadyPlaces || 2)
        }
      })
    }

    return haaResults
  }, [allathletes, tournament.enableHAA, tournament.disciplines, tournament.hoaMenPlaces, tournament.hoaLadyPlaces])

  // MEMOIZED: HAA All Shooters - Show everyone who competed in multiple core disciplines
  const allHAAathletes = useMemo(() => {
    if (!tournament.enableHAA) return []

    // Get all athletes who competed in at least 2 core disciplines
    return [...allathletes]
      .filter(s => {
        // Count how many core disciplines they competed in
        const disciplinesCompeted = coreDisciplines.filter(
          (disciplineId: string) => s.disciplineScores[disciplineId] !== undefined
        ).length
        return disciplinesCompeted >= 2
      })
      .map(s => {
        // Calculate total score across core disciplines only
        const coreTotal = coreDisciplines.reduce((sum: number, disciplineId: string) => {
          return sum + (s.disciplineScores[disciplineId] || 0)
        }, 0)

        // Count disciplines competed in
        const disciplinesCompeted = coreDisciplines.filter(
          (disciplineId: string) => s.disciplineScores[disciplineId] !== undefined
        ).length

        return {
          ...s,
          haaTotal: coreTotal,
          haaDisciplinesCompeted: disciplinesCompeted
        }
      })
      .sort((a, b) => b.haaTotal - a.haaTotal) // Sort by total score descending
  }, [allathletes, tournament.enableHAA, coreDisciplines])

  // Get rank number
  const getMedal = (index: number) => {
    return `${index + 1}.`
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

      // HAA/HOA winners now appear in BOTH their division tab AND the HAA/HOA sections

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
    <div className="space-y-6" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
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
            onClick={() => setActiveView('haa-all')}
            className={`px-3 py-1.5 rounded text-sm transition font-medium ${
              activeView === 'haa-all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            📊 HAA All
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
          {/* HOA Section - Overall champions across all disciplines */}
          {tournament.enableHOA && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-gray-900">👑 HOA - High Over All</h2>
                <p className="text-gray-600 text-xs">Overall Champions Across All Disciplines</p>
              </div>

              <div className={singleColumnMode ? 'flex flex-wrap gap-2' : 'grid grid-cols-1 lg:grid-cols-3 gap-2'}>
                {/* HOA Overall */}
                {hoaathletes.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-white p-2 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900">Overall</h3>
                      <p className="text-gray-600 text-xs">
                        {hoaathletes.length} athlete{hoaathletes.length !== 1 ? 's' : ''}
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
                          {hoaathletes.map((athlete, idx) => {
                            return (
                              <tr key={athlete.athleteId} className={`transition ${'hover:bg-gray-50'}`}>
                                <td className="px-2 py-1 text-gray-600">
                                  {getMedal(idx)}
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

                {/* HOA Male */}
                {hoaMaleathletes.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-white p-2 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900">Male</h3>
                      <p className="text-gray-600 text-xs">
                        {hoaMaleathletes.length} athlete{hoaMaleathletes.length !== 1 ? 's' : ''}
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
                          {hoaMaleathletes.map((athlete, idx) => {
                            return (
                              <tr key={athlete.athleteId} className={`transition ${'hover:bg-gray-50'}`}>
                                <td className="px-2 py-1 text-gray-600">
                                  {getMedal(idx)}
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

                {/* HOA Female */}
                {hoaFemaleathletes.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-white p-2 border-b border-gray-200">
                      <h3 className="text-sm font-bold text-gray-900">Female</h3>
                      <p className="text-gray-600 text-xs">
                        {hoaFemaleathletes.length} athlete{hoaFemaleathletes.length !== 1 ? 's' : ''}
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
                          {hoaFemaleathletes.map((athlete, idx) => {
                            return (
                              <tr key={athlete.athleteId} className={`transition ${'hover:bg-gray-50'}`}>
                                <td className="px-2 py-1 text-gray-600">
                                  {getMedal(idx)}
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

          {/* HAA Section - Per discipline champions (cycles through disciplines) */}
          {tournament.enableHAA && (() => {
            // Get the current discipline based on haaDisciplineIndex
            const currentDiscipline = tournament.disciplines[haaDisciplineIndex % tournament.disciplines.length]
            if (!currentDiscipline) return null

            const disciplineId = currentDiscipline.disciplineId
            const disciplineName = currentDiscipline.discipline.displayName
            const haaResults = haaByDiscipline[disciplineId]

            if (!haaResults) return null

            const hasResults = haaResults.male.length > 0 || haaResults.female.length > 0

            if (!hasResults) return null

            return (
              <>
                {/* Discipline Filter Tabs */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                  <div className="flex gap-2 flex-wrap">
                    {tournament.disciplines.map((td: any, idx: number) => (
                      <button
                        key={td.disciplineId}
                        onClick={() => setHaaDisciplineIndex(idx)}
                        className={`px-3 py-1.5 rounded text-sm transition font-medium ${
                          idx === haaDisciplineIndex % tournament.disciplines.length
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {td.discipline.displayName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
                    <div className="mb-3">
                      <h2 className="text-lg font-bold text-gray-900">🎯 HAA - {disciplineName}</h2>
                      <p className="text-gray-600 text-xs">High All-Around for this discipline</p>
                    </div>

                    <div className={singleColumnMode ? 'flex flex-wrap gap-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-2'}>
                      {/* HAA Male */}
                      {haaResults.male.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-white p-2 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-900">Male</h3>
                            <p className="text-gray-600 text-xs">
                              {haaResults.male.length} athlete{haaResults.male.length !== 1 ? 's' : ''}
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
                                {haaResults.male.map((athlete, idx) => (
                                  <tr key={athlete.athleteId} className={`transition ${'hover:bg-gray-50'}`}>
                                    <td className="px-2 py-1 text-gray-600">
                                      {getMedal(idx)}
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

                      {/* HAA Female */}
                      {haaResults.female.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-white p-2 border-b border-gray-200">
                            <h3 className="text-sm font-bold text-gray-900">Female</h3>
                            <p className="text-gray-600 text-xs">
                              {haaResults.female.length} athlete{haaResults.female.length !== 1 ? 's' : ''}
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
                                {haaResults.female.map((athlete, idx) => (
                                  <tr key={athlete.athleteId} className={`transition ${'hover:bg-gray-50'}`}>
                                    <td className="px-2 py-1 text-gray-600">
                                      {getMedal(idx)}
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
              </>
            )
          })()}
        </div>
      )}

      {/* Divisions View - Compact Grid with Classes Styling */}
      {activeView === 'divisions' && (
        <div className="space-y-3">
          {/* Discipline Filter Tabs */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <div className="flex gap-2 flex-wrap">
              {tournament.disciplines.map((td: any) => (
                <button
                  key={td.disciplineId}
                  onClick={() => setActiveDiscipline(td.disciplineId)}
                  className={`px-3 py-1.5 rounded text-sm transition font-medium ${
                    activeDiscipline === td.disciplineId
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {td.discipline.displayName}
                </button>
              ))}
            </div>
          </div>

          <div className={singleColumnMode ? 'flex gap-3' : 'space-y-3'}>
          {tournament.disciplines
            .filter((td: any) => !activeDiscipline || td.disciplineId === activeDiscipline)
            .map((td: any) => {
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
                                      : 'hover:bg-gray-50'
                                  }`}
                                  title={athlete.teamName || 'Independent'}
                                >
                                  <td className="px-2 py-1 text-gray-600">
                                    {getMedal(idx)}
                                  </td>
                                  <td className="px-2 py-1 font-medium text-gray-900 text-xs truncate max-w-[120px]" title={athlete.athleteName}>
                                    {athlete.athleteName}
                                    {isRecent && <span className="ml-1 text-green-600">✨</span>}
                                  </td>
                                  <td className="px-2 py-1 text-right font-bold text-gray-900 bg-white">
                                    {Math.floor(athlete.disciplineScores[disciplineId] || 0)}
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
        </div>
      )}

      {/* HAA All Shooters View */}
      {activeView === 'haa-all' && tournament.enableHAA && (() => {
        const ITEMS_PER_PAGE = 20
        const totalPages = Math.ceil(allHAAathletes.length / ITEMS_PER_PAGE)
        const currentPage = totalPages > 0 ? haaAllPage % totalPages : 0
        const startIdx = currentPage * ITEMS_PER_PAGE
        const endIdx = startIdx + ITEMS_PER_PAGE
        const paginatedAthletes = allHAAathletes.slice(startIdx, endIdx)

        return (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">📊 HAA - All Shooters</h2>
                  <p className="text-gray-600 text-sm">
                    All athletes who competed in at least 2 core disciplines
                    {coreDisciplines.length > 0 && tournament.disciplines && (
                      <span className="ml-1">
                        ({tournament.disciplines
                          .filter((td: any) => coreDisciplines.includes(td.disciplineId))
                          .map((td: any) => td.discipline.displayName)
                          .join(', ')})
                      </span>
                    )}
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="text-sm font-medium text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                )}
              </div>

              {paginatedAthletes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Athlete
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Division
                        </th>
                        {tournament.disciplines
                          .filter((td: any) => coreDisciplines.includes(td.disciplineId))
                          .map((td: any) => (
                            <th key={td.disciplineId} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {td.discipline.displayName}
                            </th>
                          ))}
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Events
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedAthletes.map((athlete: any, idx: number) => {
                        const isRecent = athlete.lastUpdated &&
                          (new Date().getTime() - new Date(athlete.lastUpdated).getTime()) < 2 * 60 * 1000
                        const actualRank = startIdx + idx + 1

                        return (
                          <tr
                            key={athlete.athleteId}
                            className={`transition ${
                              isRecent ? 'bg-green-50' :
                              'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {actualRank}.
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {isRecent && <span className="mr-1">✨</span>}
                              {athlete.athleteName}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                              {athlete.division || 'N/A'}
                            </td>
                            {tournament.disciplines
                              .filter((td: any) => coreDisciplines.includes(td.disciplineId))
                              .map((td: any) => {
                                const score = athlete.disciplineScores[td.disciplineId]
                                return (
                                  <td key={td.disciplineId} className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-700">
                                    {score !== undefined ? Math.round(score) : '-'}
                                  </td>
                                )
                              })}
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-center font-bold text-indigo-600">
                              {Math.round(athlete.haaTotal)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-600">
                              {athlete.haaDisciplinesCompeted}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    No athletes have competed in at least 2 core disciplines yet
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Squads View - Compact Grid */}
      {activeView === 'squads' && (
        <div className="space-y-3">
          {/* Discipline Filter Tabs */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <div className="flex gap-2 flex-wrap">
              {tournament.disciplines.map((td: any) => (
                <button
                  key={td.disciplineId}
                  onClick={() => setActiveDiscipline(td.disciplineId)}
                  className={`px-3 py-1.5 rounded text-sm transition font-medium ${
                    activeDiscipline === td.disciplineId
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {td.discipline.displayName}
                </button>
              ))}
            </div>
          </div>

          <div className={singleColumnMode ? 'flex gap-3' : 'space-y-3'}>
          {tournament.disciplines
            .filter((td: any) => !activeDiscipline || td.disciplineId === activeDiscipline)
            .map((td: any) => {
            const disciplineId = td.disciplineId
            const discipline = td.discipline

            // Get squads for this discipline (exclude Unassigned division)
            const disciplineSquads = squadScores.filter(s =>
              s.disciplineId === disciplineId &&
              s.division !== 'Unassigned'
            )

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
                                  className={`transition hover:bg-gray-50 ${!squad.isComplete ? 'border-l-2 border-l-yellow-400' : ''}`}
                                >
                                  <td className="px-2 py-1 text-gray-600">
                                    {getMedal(idx)}
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
        </div>
      )}

      {/* Classes View - Compact Grid */}
      {activeView === 'classes' && (
        <div className="space-y-3">
          {/* Discipline Filter Tabs */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <div className="flex gap-2 flex-wrap">
              {tournament.disciplines.map((td: any) => (
                <button
                  key={td.disciplineId}
                  onClick={() => setActiveDiscipline(td.disciplineId)}
                  className={`px-3 py-1.5 rounded text-sm transition font-medium ${
                    activeDiscipline === td.disciplineId
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {td.discipline.displayName}
                </button>
              ))}
            </div>
          </div>

          <div className={singleColumnMode ? 'flex gap-3' : 'space-y-3'}>
          {tournament.disciplines
            .filter((td: any) => !activeDiscipline || td.disciplineId === activeDiscipline)
            .map((tournamentDiscipline: any) => {
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
                                        : 'hover:bg-gray-50'
                                    }`}
                                    title={athlete.teamName || 'Independent'}
                                  >
                                    <td className="px-2 py-1 text-gray-600">
                                      {getMedal(idx)}
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
        </div>
      )}

      {/* Teams View - Compact Grid */}
      {activeView === 'teams' && (
        <div className="space-y-3">
          {/* Discipline Filter Tabs */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <div className="flex gap-2 flex-wrap">
              {tournament.disciplines.map((td: any) => (
                <button
                  key={td.disciplineId}
                  onClick={() => setActiveDiscipline(td.disciplineId)}
                  className={`px-3 py-1.5 rounded text-sm transition font-medium ${
                    activeDiscipline === td.disciplineId
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {td.discipline.displayName}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
          {tournament.disciplines
            .filter((td: any) => !activeDiscipline || td.disciplineId === activeDiscipline)
            .map((tournamentDiscipline: any) => {
            const disciplineId = tournamentDiscipline.disciplineId
            const disciplineName = tournamentDiscipline.discipline.displayName

            // Get athletes who competed in this discipline and have teams (excluding unassigned)
            const disciplineathletes = allathletes.filter(
              athlete => athlete.disciplineScores[disciplineId] !== undefined &&
                         athlete.teamName &&
                         athlete.division !== 'Unassigned'
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
                        className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="bg-white p-2 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {team.teamLogoUrl && (
                                <img src={team.teamLogoUrl} alt={team.teamName} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                  {getMedal(index)} {team.teamName}
                                </h3>
                                <p className="text-gray-600 text-xs">
                                  {team.totalathletes} athlete{team.totalathletes !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-base font-bold text-gray-900">{Math.floor(team.teamTotal)}</div>
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
                                  {Math.floor(athlete.disciplineScores[disciplineId])}
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

