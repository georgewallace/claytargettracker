// Types
export interface AthleteScoreEntry {
  athleteId: string
  disciplineId: string
  totalScore: number
  tiebreakScore?: number | null  // Optional shoot-off score for tie-breaking
  longRunFront?: number | null   // Long run from front (LRF) for automatic tiebreaking
  longRunBack?: number | null    // Long run from back (LRB) for automatic tiebreaking
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
  tiebreakOrder: string[]      // e.g. ["lrf","lrb","shootoff"]
  longRunDisciplines: string[] // disciplineIds where LRF/LRB tiebreaking applies
  shootOffMaxPlace: number     // 0 = all places; 3 = USAYESS (only places 1–3 require shoot-offs)
}

type SortItem = { total: number; tiebreak?: number | null; lrf?: number | null; lrb?: number | null; entry: AthleteScoreEntry }

// Factory: returns a sort comparator for aggregated score objects (used in HOA/Collegiate)
// Applies tiebreakOrder across all configured criteria; null values compare as 0 (no advantage)
// 'longrun' criterion: compare max(LRF,LRB) first (NSSA rule d — whichever is longest),
//   then min(LRF,LRB) (the opposite end) if still tied.
function makeSortByScore(config: AwardConfig) {
  return (a: SortItem, b: SortItem): number => {
    if (b.total !== a.total) return b.total - a.total
    for (const criterion of config.tiebreakOrder) {
      if (criterion === 'longrun') {
        const aMax = Math.max(a.lrf ?? 0, a.lrb ?? 0)
        const bMax = Math.max(b.lrf ?? 0, b.lrb ?? 0)
        if (bMax !== aMax) return bMax - aMax
        const aMin = Math.min(a.lrf ?? 0, a.lrb ?? 0)
        const bMin = Math.min(b.lrf ?? 0, b.lrb ?? 0)
        if (bMin !== aMin) return bMin - aMin
      } else if (criterion === 'shootoff') {
        const av = a.tiebreak ?? 0, bv = b.tiebreak ?? 0
        if (bv !== av) return bv - av
      }
    }
    return a.entry.athlete.name.localeCompare(b.entry.athlete.name)
  }
}

// Factory: returns a sort comparator for AthleteScoreEntry objects (used in event/team calculations).
// disciplineId determines which tiebreak criteria are active:
//   skeet   → 'longrun' applies (NSSA rule d: max(LRF,LRB) then opposite end)
//   sporting → 'countback' applies (NSCA rule 18.2: from last station back)
//   trap    → only 'shootoff' applies (ATA: shoot-off only)
function makeSortEntriesByScore(config: AwardConfig, disciplineId?: string) {
  const category = disciplineId ? getDisciplineCategory(disciplineId) : 'other'
  return (a: AthleteScoreEntry, b: AthleteScoreEntry): number => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    for (const criterion of config.tiebreakOrder) {
      if (criterion === 'longrun') {
        // NSSA only — and only if this discipline is enrolled in longRunDisciplines
        if (category !== 'skeet' || !disciplineId || !config.longRunDisciplines.includes(disciplineId)) continue
        const aMax = Math.max(a.longRunFront ?? 0, a.longRunBack ?? 0)
        const bMax = Math.max(b.longRunFront ?? 0, b.longRunBack ?? 0)
        if (bMax !== aMax) return bMax - aMax
        const aMin = Math.min(a.longRunFront ?? 0, a.longRunBack ?? 0)
        const bMin = Math.min(b.longRunFront ?? 0, b.longRunBack ?? 0)
        if (bMin !== aMin) return bMin - aMin
      } else if (criterion === 'countback') {
        // NSCA only — sporting clays / five_stand
        if (category !== 'sporting') continue
        const result = countbackCompare(a.scores, b.scores)
        if (result !== 0) return result
      } else if (criterion === 'shootoff') {
        const av = a.tiebreakScore ?? 0, bv = b.tiebreakScore ?? 0
        if (bv !== av) return bv - av
      }
    }
    return a.athlete.name.localeCompare(b.athlete.name)
  }
}

const TRAP_DISCIPLINE_NAMES = ['trap', 'super_sport', 'doubles_trap']

function isTrapDiscipline(disciplineId: string): boolean {
  return TRAP_DISCIPLINE_NAMES.some(name => disciplineId.toLowerCase().includes(name))
}

/**
 * Parse tiebreakOrder from its stored JSON string, migrating legacy 'lrf'/'lrb'
 * criteria (pre-v2.1) to the unified 'longrun' criterion.
 * Safe to call on any stored value — returns a valid array with no duplicates.
 */
export function parseTiebreakOrder(raw: string | null | undefined): string[] {
  try {
    const arr: string[] = JSON.parse(raw ?? '["shootoff","longrun"]')
    // Backwards compat: old separate 'lrf'/'lrb' entries collapse to 'longrun'
    const migrated = arr.flatMap(c => (c === 'lrf' || c === 'lrb') ? ['longrun'] : [c])
    return [...new Set(migrated)] // dedupe (lrf+lrb would both expand to longrun)
  } catch {
    return ['shootoff', 'longrun']
  }
}

/**
 * Classify a discipline by the governing body whose tiebreak rules apply.
 * skeet   → NSSA (long run from front/back)
 * trap    → ATA  (shoot-off only)
 * sporting → NSCA (countback by station/layout, shoot-off for top 3)
 */
export function getDisciplineCategory(disciplineId: string): 'skeet' | 'trap' | 'sporting' | 'other' {
  const n = disciplineId.toLowerCase()
  if (n.includes('skeet')) return 'skeet'
  if (n.includes('trap') || n.includes('super_sport')) return 'trap'
  if (n.includes('sporting') || n.includes('five_stand')) return 'sporting'
  return 'other'
}

type ScoreRow = { roundNumber?: number | null; stationNumber?: number | null; targets: number }

function scoreRowNum(s: ScoreRow): number {
  return s.stationNumber ?? s.roundNumber ?? 0
}

// NSCA rule 18.2: compare from last station/layout back to first
function countbackCompare(aScores: ScoreRow[], bScores: ScoreRow[]): number {
  const nums = [...new Set([...aScores, ...bScores].map(scoreRowNum))]
    .filter(n => n > 0)
    .sort((x, y) => y - x) // descending: 8, 7, 6 ...
  for (const num of nums) {
    const av = aScores.find(s => scoreRowNum(s) === num)?.targets ?? 0
    const bv = bScores.find(s => scoreRowNum(s) === num)?.targets ?? 0
    if (bv !== av) return bv - av
  }
  return 0
}

// NSCA rule 18.7: sum each team's station scores, compare from last station back
function teamCountbackCompare(aAthletes: AthleteScoreEntry[], bAthletes: AthleteScoreEntry[]): number {
  const allScores = [...aAthletes, ...bAthletes].flatMap(a => a.scores)
  const nums = [...new Set(allScores.map(scoreRowNum))]
    .filter(n => n > 0)
    .sort((x, y) => y - x)
  for (const num of nums) {
    const aSum = aAthletes.reduce((s, a) => s + (a.scores.find(r => scoreRowNum(r) === num)?.targets ?? 0), 0)
    const bSum = bAthletes.reduce((s, a) => s + (a.scores.find(r => scoreRowNum(r) === num)?.targets ?? 0), 0)
    if (bSum !== aSum) return bSum - aSum
  }
  return 0
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
  const sortByScore = makeSortByScore(config)

  // Collect all unique athletes from included divisions (excluding Collegiate)
  const athleteScores: Record<string, SortItem> = {}

  const allEntries = Object.values(entriesByDiscipline).flat()

  for (const entry of allEntries) {
    const div = entry.athlete.division || ''
    if (!hoaIncludesDivisions.includes(div)) continue
    if (div === 'Collegiate') continue

    const discId = entry.disciplineId
    const discUsesLongRun = config.longRunDisciplines.includes(discId)

    if (hoaScope === 'combined') {
      // Aggregate total across all disciplines
      if (!athleteScores[entry.athleteId]) {
        athleteScores[entry.athleteId] = {
          entry,
          total: 0,
          tiebreak: entry.tiebreakScore,
          lrf: discUsesLongRun ? (entry.longRunFront ?? null) : null,
          lrb: discUsesLongRun ? (entry.longRunBack ?? null) : null,
        }
      }
      athleteScores[entry.athleteId].total += entry.totalScore
      // Use highest tiebreakScore across disciplines
      if ((entry.tiebreakScore ?? 0) > (athleteScores[entry.athleteId].tiebreak ?? 0)) {
        athleteScores[entry.athleteId].tiebreak = entry.tiebreakScore
      }
      // Use highest LRF/LRB from longRun disciplines
      if (discUsesLongRun) {
        if ((entry.longRunFront ?? 0) > (athleteScores[entry.athleteId].lrf ?? 0)) {
          athleteScores[entry.athleteId].lrf = entry.longRunFront
        }
        if ((entry.longRunBack ?? 0) > (athleteScores[entry.athleteId].lrb ?? 0)) {
          athleteScores[entry.athleteId].lrb = entry.longRunBack
        }
      }
    } else {
      // per_discipline: use the single discipline score
      if (!athleteScores[entry.athleteId]) {
        athleteScores[entry.athleteId] = {
          entry,
          total: entry.totalScore,
          tiebreak: entry.tiebreakScore,
          lrf: discUsesLongRun ? (entry.longRunFront ?? null) : null,
          lrb: discUsesLongRun ? (entry.longRunBack ?? null) : null,
        }
      } else if (entry.totalScore > athleteScores[entry.athleteId].total) {
        athleteScores[entry.athleteId].total = entry.totalScore
        athleteScores[entry.athleteId].tiebreak = entry.tiebreakScore
        athleteScores[entry.athleteId].lrf = discUsesLongRun ? (entry.longRunFront ?? null) : null
        athleteScores[entry.athleteId].lrb = discUsesLongRun ? (entry.longRunBack ?? null) : null
      }
    }
  }

  // Sort descending by total score, then by tiebreakOrder criteria
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
  const sortByScore = makeSortByScore(config)
  const allEntries = Object.values(entriesByDiscipline).flat()
  const athleteScores: Record<string, SortItem> = {}

  for (const entry of allEntries) {
    const div = entry.athlete.division || ''
    if (div !== 'Collegiate') continue

    const discId = entry.disciplineId
    const discUsesLongRun = config.longRunDisciplines.includes(discId)

    if (!athleteScores[entry.athleteId]) {
      athleteScores[entry.athleteId] = {
        entry,
        total: 0,
        tiebreak: entry.tiebreakScore,
        lrf: discUsesLongRun ? (entry.longRunFront ?? null) : null,
        lrb: discUsesLongRun ? (entry.longRunBack ?? null) : null,
      }
    }
    athleteScores[entry.athleteId].total += entry.totalScore
    if ((entry.tiebreakScore ?? 0) > (athleteScores[entry.athleteId].tiebreak ?? 0)) {
      athleteScores[entry.athleteId].tiebreak = entry.tiebreakScore
    }
    if (discUsesLongRun) {
      if ((entry.longRunFront ?? 0) > (athleteScores[entry.athleteId].lrf ?? 0)) {
        athleteScores[entry.athleteId].lrf = entry.longRunFront
      }
      if ((entry.longRunBack ?? 0) > (athleteScores[entry.athleteId].lrb ?? 0)) {
        athleteScores[entry.athleteId].lrb = entry.longRunBack
      }
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
 * Sort entries with place-aware tiebreaking.
 * When shootOffMaxPlace === 0 (standard), delegates to existing makeSortEntriesByScore behavior.
 * When shootOffMaxPlace > 0 (USAYESS), applies:
 *   - Places 1..shootOffMaxPlace: tiebreakScore descending (shoot-off)
 *   - Places 4+ skeet: LRF descending, then LRB descending (not max/min)
 *   - Places 4+ sporting: countback (NSCA)
 *   - Places 4+ trap: alphabetical only (remain tied)
 */
export function sortWithPlaceAwareTiebreaks(
  entries: AthleteScoreEntry[],
  config: AwardConfig,
  disciplineId?: string
): AthleteScoreEntry[] {
  if (config.shootOffMaxPlace === 0) {
    return [...entries].sort(makeSortEntriesByScore(config, disciplineId))
  }

  const category = disciplineId ? getDisciplineCategory(disciplineId) : 'other'
  const useLongRun = category === 'skeet' && disciplineId != null && config.longRunDisciplines.includes(disciplineId)

  // Phase 1: sort by total score descending only
  const byScore = [...entries].sort((a, b) => b.totalScore - a.totalScore)

  // Phase 2: within each equal-score group, apply rank-aware tiebreak
  const result: AthleteScoreEntry[] = []
  let i = 0
  while (i < byScore.length) {
    const score = byScore[i].totalScore
    let j = i
    while (j < byScore.length && byScore[j].totalScore === score) j++
    const group = byScore.slice(i, j)
    const startingRank = i + 1  // 1 + count of athletes with higher score

    if (group.length === 1) {
      result.push(group[0])
    } else {
      const useShootOff = startingRank <= config.shootOffMaxPlace
      const sorted = [...group].sort((a, b) => {
        if (useShootOff) {
          const av = a.tiebreakScore ?? 0, bv = b.tiebreakScore ?? 0
          if (bv !== av) return bv - av
        } else if (useLongRun) {
          // USAYESS places 4+: LRF first, then LRB (not max/min like NSSA rule d)
          const aLRF = a.longRunFront ?? 0, bLRF = b.longRunFront ?? 0
          if (bLRF !== aLRF) return bLRF - aLRF
          const aLRB = a.longRunBack ?? 0, bLRB = b.longRunBack ?? 0
          if (bLRB !== aLRB) return bLRB - aLRB
        } else if (category === 'sporting') {
          const cbResult = countbackCompare(a.scores, b.scores)
          if (cbResult !== 0) return cbResult
        }
        // trap 4+: alphabetical only
        return a.athlete.name.localeCompare(b.athlete.name)
      })
      result.push(...sorted)
    }
    i = j
  }
  return result
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
  const males = sortWithPlaceAwareTiebreaks(entries.filter(e => isMale(e.athlete.gender)), config, disciplineId)
  const females = sortWithPlaceAwareTiebreaks(entries.filter(e => isFemale(e.athlete.gender)), config, disciplineId)

  const championMen = males[0] || null
  const championLady = females[0] || null

  // Division placements
  const divisions = ['Varsity', 'JV', 'Intermediate', 'Novice', 'Collegiate']
  const divisionPlacements: Record<string, AthleteScoreEntry[]> = {}

  for (const div of divisions) {
    const divEntries = entries.filter(e => e.athlete.division === div)
    if (divEntries.length === 0) continue

    const sorted = sortWithPlaceAwareTiebreaks(divEntries, config, disciplineId)
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
  const sortEntriesByScore = makeSortEntriesByScore(config, disciplineId)
  const category = getDisciplineCategory(disciplineId)
  const useCountback = category === 'sporting' && config.tiebreakOrder.includes('countback')
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

    // Sort division teams by total score, then countback for sporting (NSCA rule 18.7)
    divTeams.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      if (useCountback) return teamCountbackCompare(a.athletes, b.athletes)
      return 0
    })
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

  openTeams.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    if (useCountback) return teamCountbackCompare(a.athletes, b.athletes)
    return 0
  })

  return {
    disciplineId,
    divisionTeams,
    openTeams: openTeams.slice(0, teamEventPlaces)
  }
}
