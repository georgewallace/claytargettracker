// Types
export interface AthleteScoreEntry {
  athleteId: string
  disciplineId: string
  totalScore: number
  tiebreakScore?: number | null  // Optional shoot-off score for tie-breaking
  scores: Array<{ roundNumber?: number | null; stationNumber?: number | null; targets: number; maxTargets: number }>
  athlete: {
    division: string | null
    gender: string | null
    teamId: string | null
    name: string
  }
}

export interface HOAResult {
  hoa: AthleteScoreEntry | null
  ru: AthleteScoreEntry | null
  third: AthleteScoreEntry | null
  hoaLady: AthleteScoreEntry | null
}

export interface CollegiateHOAResult {
  first: AthleteScoreEntry | null
  second: AthleteScoreEntry | null
  third: AthleteScoreEntry | null
}

export interface EventAwardResult {
  disciplineId: string
  championMen: AthleteScoreEntry | null
  championLady: AthleteScoreEntry | null
  divisionPlacements: Record<string, AthleteScoreEntry[]>
}

export interface TeamScore {
  teamId: string
  teamName: string
  athletes: AthleteScoreEntry[]
  totalScore: number
}

export interface TeamAwardResult {
  disciplineId: string
  divisionTeams: Record<string, TeamScore[]>
  openTeams: TeamScore[]
}

export interface AwardConfig {
  hoaScope: string         // "combined" | "per_discipline"
  hoaIncludesDivisions: string[]  // e.g. ["Novice","Intermediate","JV","Varsity"]
  hoaHighLadyCanWinBoth: boolean
  collegiateHOAEnabled: boolean
  individualEventPlaces: number
  teamEventPlaces: number
  teamSizeDefault: number
  trapTeamSize: number
}

// Sort descending by totalScore, then by tiebreakScore (higher = better), then alphabetically by name
function sortByScore(a: { total: number; tiebreak?: number | null; entry: AthleteScoreEntry }, b: { total: number; tiebreak?: number | null; entry: AthleteScoreEntry }): number {
  if (b.total !== a.total) return b.total - a.total
  // Tiebreak: higher tiebreakScore wins; null/undefined tiebreak treated as 0
  const at = a.tiebreak ?? 0
  const bt = b.tiebreak ?? 0
  if (bt !== at) return bt - at
  return a.entry.athlete.name.localeCompare(b.entry.athlete.name)
}

function sortEntriesByScore(a: AthleteScoreEntry, b: AthleteScoreEntry): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
  const at = a.tiebreakScore ?? 0
  const bt = b.tiebreakScore ?? 0
  if (bt !== at) return bt - at
  return a.athlete.name.localeCompare(b.athlete.name)
}

const TRAP_DISCIPLINE_NAMES = ['trap', 'super_sport', 'doubles_trap']

function isTrapDiscipline(disciplineId: string): boolean {
  // Check by discipline name/id patterns - trap disciplines use trapTeamSize
  return TRAP_DISCIPLINE_NAMES.some(name => disciplineId.toLowerCase().includes(name))
}

/**
 * Calculate HOA (High Over All) awards for all non-collegiate athletes.
 * When hoaScope = "combined", aggregates scores across all disciplines per athlete.
 * The hoaHighLadyCanWinBoth option allows HOA Lady to also hold HOA/RU/3rd simultaneously.
 */
export function calculateHOAAwards(
  entriesByDiscipline: Record<string, AthleteScoreEntry[]>,
  config: AwardConfig
): HOAResult {
  const { hoaScope, hoaIncludesDivisions, hoaHighLadyCanWinBoth } = config

  // Collect all unique athletes from included divisions (excluding Collegiate)
  const athleteScores: Record<string, { entry: AthleteScoreEntry; total: number; tiebreak?: number | null }> = {}

  const allEntries = Object.values(entriesByDiscipline).flat()

  for (const entry of allEntries) {
    const div = entry.athlete.division || ''
    if (!hoaIncludesDivisions.includes(div)) continue
    if (div === 'Collegiate') continue

    if (hoaScope === 'combined') {
      // Aggregate total across all disciplines
      if (!athleteScores[entry.athleteId]) {
        athleteScores[entry.athleteId] = { entry, total: 0, tiebreak: entry.tiebreakScore }
      }
      athleteScores[entry.athleteId].total += entry.totalScore
      // Use highest tiebreakScore across disciplines
      if ((entry.tiebreakScore ?? 0) > (athleteScores[entry.athleteId].tiebreak ?? 0)) {
        athleteScores[entry.athleteId].tiebreak = entry.tiebreakScore
      }
    } else {
      // per_discipline: use the single discipline score
      if (!athleteScores[entry.athleteId]) {
        athleteScores[entry.athleteId] = { entry, total: entry.totalScore, tiebreak: entry.tiebreakScore }
      } else if (entry.totalScore > athleteScores[entry.athleteId].total) {
        athleteScores[entry.athleteId].total = entry.totalScore
        athleteScores[entry.athleteId].tiebreak = entry.tiebreakScore
      }
    }
  }

  // Sort descending by total score, then tiebreakScore
  const sorted = Object.values(athleteScores).sort(sortByScore)

  if (sorted.length === 0) {
    return { hoa: null, ru: null, third: null, hoaLady: null }
  }

  // Find HOA Lady (highest-scoring female) — gender stored as 'F' or 'female'
  const ladyEntry = sorted.find(s => s.entry.athlete.gender === 'F' || s.entry.athlete.gender === 'female')
  const hoaLady = ladyEntry ? { ...ladyEntry.entry, totalScore: ladyEntry.total } : null

  if (hoaHighLadyCanWinBoth) {
    // Lady can win HOA Lady AND one of HOA/RU/3rd simultaneously
    const top3 = sorted.slice(0, 3)
    const hoa = top3[0] ? { ...top3[0].entry, totalScore: top3[0].total } : null
    const ru = top3[1] ? { ...top3[1].entry, totalScore: top3[1].total } : null
    const third = top3[2] ? { ...top3[2].entry, totalScore: top3[2].total } : null
    return { hoa, ru, third, hoaLady }
  } else {
    // Lady cannot appear in HOA/RU/3rd if she wins HOA Lady
    const ladyId = ladyEntry?.entry.athleteId
    const nonLadyHOA = sorted.filter(s => s.entry.athleteId !== ladyId)
    const hoa = nonLadyHOA[0] ? { ...nonLadyHOA[0].entry, totalScore: nonLadyHOA[0].total } : sorted[0] ? { ...sorted[0].entry, totalScore: sorted[0].total } : null
    const ruCandidates = sorted.filter(s => s.entry.athleteId !== (hoa?.athleteId ?? ''))
    const ru = ruCandidates[0] ? { ...ruCandidates[0].entry, totalScore: ruCandidates[0].total } : null
    const thirdCandidates = sorted.filter(s => s.entry.athleteId !== (hoa?.athleteId ?? '') && s.entry.athleteId !== (ru?.athleteId ?? ''))
    const third = thirdCandidates[0] ? { ...thirdCandidates[0].entry, totalScore: thirdCandidates[0].total } : null
    return { hoa, ru, third, hoaLady }
  }
}

/**
 * Calculate Collegiate HOA from entries.
 */
export function calculateCollegiateHOA(
  entriesByDiscipline: Record<string, AthleteScoreEntry[]>,
  config: AwardConfig
): CollegiateHOAResult {
  const allEntries = Object.values(entriesByDiscipline).flat()
  const athleteScores: Record<string, { entry: AthleteScoreEntry; total: number; tiebreak?: number | null }> = {}

  for (const entry of allEntries) {
    const div = entry.athlete.division || ''
    if (div !== 'Collegiate') continue

    if (!athleteScores[entry.athleteId]) {
      athleteScores[entry.athleteId] = { entry, total: 0, tiebreak: entry.tiebreakScore }
    }
    athleteScores[entry.athleteId].total += entry.totalScore
    if ((entry.tiebreakScore ?? 0) > (athleteScores[entry.athleteId].tiebreak ?? 0)) {
      athleteScores[entry.athleteId].tiebreak = entry.tiebreakScore
    }
  }

  const sorted = Object.values(athleteScores).sort(sortByScore)

  return {
    first: sorted[0] ? { ...sorted[0].entry, totalScore: sorted[0].total } : null,
    second: sorted[1] ? { ...sorted[1].entry, totalScore: sorted[1].total } : null,
    third: sorted[2] ? { ...sorted[2].entry, totalScore: sorted[2].total } : null,
  }
}

/**
 * Calculate individual event awards for a single discipline.
 * Returns event champions (Men/Lady) and division placements.
 */
export function calculateEventAwards(
  entries: AthleteScoreEntry[],
  disciplineId: string,
  config: AwardConfig
): EventAwardResult {
  const { individualEventPlaces } = config

  // Event champions: top male and top female in this discipline — gender stored as 'M'/'F' or 'male'/'female'
  const isMale = (g: string | null) => g === 'M' || g === 'male'
  const isFemale = (g: string | null) => g === 'F' || g === 'female'
  const males = [...entries].filter(e => isMale(e.athlete.gender)).sort(sortEntriesByScore)
  const females = [...entries].filter(e => isFemale(e.athlete.gender)).sort(sortEntriesByScore)

  const championMen = males[0] || null
  const championLady = females[0] || null

  // Division placements
  const divisions = ['Varsity', 'JV', 'Intermediate', 'Novice', 'Collegiate']
  const divisionPlacements: Record<string, AthleteScoreEntry[]> = {}

  for (const div of divisions) {
    const divEntries = entries.filter(e => e.athlete.division === div)
    if (divEntries.length === 0) continue

    const sorted = [...divEntries].sort(sortEntriesByScore)
    divisionPlacements[div] = sorted.slice(0, individualEventPlaces)
  }

  return { disciplineId, championMen, championLady, divisionPlacements }
}

/**
 * Calculate team awards for a single discipline.
 * Team = top N athletes from same club in same concurrent division.
 * Athletes who can't form a complete team go to the open pool.
 */
export function calculateTeamAwards(
  entries: AthleteScoreEntry[],
  disciplineId: string,
  teamNames: Record<string, string>,  // teamId -> teamName
  config: AwardConfig
): TeamAwardResult {
  const { teamSizeDefault, trapTeamSize, teamEventPlaces } = config
  const teamSize = isTrapDiscipline(disciplineId) ? trapTeamSize : teamSizeDefault

  const divisions = ['Varsity', 'JV', 'Intermediate', 'Novice']
  const divisionTeams: Record<string, TeamScore[]> = {}
  const openPoolByTeam: Record<string, AthleteScoreEntry[]> = {}

  for (const div of divisions) {
    const divEntries = entries.filter(e => e.athlete.division === div && e.athlete.teamId)
    if (divEntries.length === 0) continue

    // Group by team within this division
    const byTeam: Record<string, AthleteScoreEntry[]> = {}
    for (const entry of divEntries) {
      const tid = entry.athlete.teamId!
      if (!byTeam[tid]) byTeam[tid] = []
      byTeam[tid].push(entry)
    }

    const divTeams: TeamScore[] = []

    for (const [teamId, teamAthletes] of Object.entries(byTeam)) {
      const sorted = [...teamAthletes].sort(sortEntriesByScore)

      // Form complete teams of size teamSize, remainder goes to open pool
      let i = 0
      while (i + teamSize <= sorted.length) {
        const teamSlice = sorted.slice(i, i + teamSize)
        divTeams.push({
          teamId,
          teamName: teamNames[teamId] || teamId,
          athletes: teamSlice,
          totalScore: teamSlice.reduce((sum, a) => sum + a.totalScore, 0)
        })
        i += teamSize
      }

      // Remainder athletes go to open pool
      const remainder = sorted.slice(i)
      if (remainder.length > 0) {
        if (!openPoolByTeam[teamId]) openPoolByTeam[teamId] = []
        openPoolByTeam[teamId].push(...remainder)
      }
    }

    // Sort division teams by total score and assign top N places
    divTeams.sort((a, b) => b.totalScore - a.totalScore)
    divisionTeams[div] = divTeams.slice(0, teamEventPlaces)
  }

  // Open pool: form teams from remainder athletes across all divisions
  const openTeams: TeamScore[] = []
  for (const [teamId, poolAthletes] of Object.entries(openPoolByTeam)) {
    const sorted = [...poolAthletes].sort(sortEntriesByScore)
    let i = 0
    while (i + teamSize <= sorted.length) {
      const teamSlice = sorted.slice(i, i + teamSize)
      openTeams.push({
        teamId,
        teamName: teamNames[teamId] || teamId,
        athletes: teamSlice,
        totalScore: teamSlice.reduce((sum, a) => sum + a.totalScore, 0)
      })
      i += teamSize
    }
  }

  openTeams.sort((a, b) => b.totalScore - a.totalScore)

  return {
    disciplineId,
    divisionTeams,
    openTeams: openTeams.slice(0, teamEventPlaces)
  }
}
