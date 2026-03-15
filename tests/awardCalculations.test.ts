import { describe, it, expect } from 'vitest'
import {
  calculateHOAAwards,
  calculateCollegiateHOA,
  calculateEventAwards,
  calculateTeamAwards,
  AthleteScoreEntry,
  AwardConfig,
} from '../lib/awardCalculations'

const baseConfig: AwardConfig = {
  hoaScope: 'combined',
  hoaIncludesDivisions: ['Novice', 'Intermediate', 'JV', 'Varsity'],
  hoaHighLadyCanWinBoth: true,
  collegiateHOAEnabled: true,
  individualEventPlaces: 3,
  teamEventPlaces: 2,
  teamSizeDefault: 3,
  trapTeamSize: 5,
  tiebreakOrder: ['shootoff', 'longrun'],
  longRunDisciplines: [],
}

function makeEntry(
  athleteId: string,
  disciplineId: string,
  totalScore: number,
  opts: Partial<AthleteScoreEntry['athlete']> = {}
): AthleteScoreEntry {
  return {
    athleteId,
    disciplineId,
    totalScore,
    scores: [],
    athlete: {
      division: opts.division ?? 'Varsity',
      gender: opts.gender ?? 'male',
      teamId: opts.teamId ?? null,
      name: opts.name ?? athleteId,
    },
  }
}

describe('calculateHOAAwards', () => {
  it('assigns HOA, RU, and 3rd to top 3 combined scorers', () => {
    const entries = {
      trap: [
        makeEntry('a1', 'trap', 90, { name: 'Alice', gender: 'male', division: 'Varsity' }),
        makeEntry('a2', 'trap', 80, { name: 'Bob', gender: 'male', division: 'Varsity' }),
        makeEntry('a3', 'trap', 70, { name: 'Carol', gender: 'male', division: 'Varsity' }),
      ],
    }
    const result = calculateHOAAwards(entries, baseConfig)
    expect(result.hoa?.athleteId).toBe('a1')
    expect(result.ru?.athleteId).toBe('a2')
    expect(result.third?.athleteId).toBe('a3')
  })

  it('finds HOA Lady as highest-scoring female', () => {
    const entries = {
      skeet: [
        makeEntry('m1', 'skeet', 95, { gender: 'male', division: 'Varsity', name: 'Male1' }),
        makeEntry('f1', 'skeet', 88, { gender: 'female', division: 'Varsity', name: 'Lady1' }),
        makeEntry('m2', 'skeet', 85, { gender: 'male', division: 'Varsity', name: 'Male2' }),
      ],
    }
    const result = calculateHOAAwards(entries, baseConfig)
    expect(result.hoaLady?.athleteId).toBe('f1')
  })

  it('HOA Lady can win both HOA Lady and HOA when hoaHighLadyCanWinBoth=true', () => {
    const entries = {
      skeet: [
        makeEntry('f1', 'skeet', 100, { gender: 'female', division: 'Varsity', name: 'TopLady' }),
        makeEntry('m1', 'skeet', 90, { gender: 'male', division: 'Varsity', name: 'Male1' }),
        makeEntry('m2', 'skeet', 80, { gender: 'male', division: 'Varsity', name: 'Male2' }),
      ],
    }
    const config = { ...baseConfig, hoaHighLadyCanWinBoth: true }
    const result = calculateHOAAwards(entries, config)
    expect(result.hoa?.athleteId).toBe('f1')
    expect(result.hoaLady?.athleteId).toBe('f1')
    expect(result.ru?.athleteId).toBe('m1')
  })

  it('excludes athletes not in hoaIncludesDivisions', () => {
    const entries = {
      trap: [
        makeEntry('c1', 'trap', 99, { division: 'Collegiate', name: 'Colleg' }),
        makeEntry('v1', 'trap', 80, { division: 'Varsity', name: 'Varsity1' }),
      ],
    }
    const result = calculateHOAAwards(entries, baseConfig)
    expect(result.hoa?.athleteId).toBe('v1')
  })

  it('aggregates scores across disciplines in combined mode', () => {
    const entries = {
      trap: [makeEntry('a1', 'trap', 40, { division: 'Varsity', name: 'A1' })],
      skeet: [makeEntry('a1', 'skeet', 45, { division: 'Varsity', name: 'A1' })],
    }
    const result = calculateHOAAwards(entries, baseConfig)
    expect(result.hoa?.totalScore).toBe(85)
  })
})

describe('calculateCollegiateHOA', () => {
  it('returns top 3 collegiate athletes', () => {
    const entries = {
      trap: [
        makeEntry('c1', 'trap', 90, { division: 'Collegiate', name: 'C1' }),
        makeEntry('c2', 'trap', 85, { division: 'Collegiate', name: 'C2' }),
        makeEntry('c3', 'trap', 80, { division: 'Collegiate', name: 'C3' }),
        makeEntry('c4', 'trap', 75, { division: 'Collegiate', name: 'C4' }),
      ],
    }
    const result = calculateCollegiateHOA(entries, baseConfig)
    expect(result.first?.athleteId).toBe('c1')
    expect(result.second?.athleteId).toBe('c2')
    expect(result.third?.athleteId).toBe('c3')
  })
})

describe('calculateEventAwards', () => {
  it('returns correct event champions by gender', () => {
    const entries: AthleteScoreEntry[] = [
      makeEntry('m1', 'skeet', 90, { gender: 'male', division: 'Varsity', name: 'Male1' }),
      makeEntry('m2', 'skeet', 85, { gender: 'male', division: 'Varsity', name: 'Male2' }),
      makeEntry('f1', 'skeet', 88, { gender: 'female', division: 'Varsity', name: 'Lady1' }),
      makeEntry('f2', 'skeet', 80, { gender: 'female', division: 'JV', name: 'Lady2' }),
    ]
    const result = calculateEventAwards(entries, 'skeet', baseConfig)
    expect(result.championMen?.athleteId).toBe('m1')
    expect(result.championLady?.athleteId).toBe('f1')
  })

  it('assigns division placements for up to individualEventPlaces athletes', () => {
    const entries: AthleteScoreEntry[] = [
      makeEntry('v1', 'skeet', 90, { division: 'Varsity', name: 'V1' }),
      makeEntry('v2', 'skeet', 85, { division: 'Varsity', name: 'V2' }),
      makeEntry('v3', 'skeet', 80, { division: 'Varsity', name: 'V3' }),
      makeEntry('v4', 'skeet', 75, { division: 'Varsity', name: 'V4' }),
      makeEntry('n1', 'skeet', 70, { division: 'Novice', name: 'N1' }),
    ]
    const result = calculateEventAwards(entries, 'skeet', baseConfig)
    expect(result.divisionPlacements['Varsity']).toHaveLength(3)
    expect(result.divisionPlacements['Varsity'][0].athleteId).toBe('v1')
    expect(result.divisionPlacements['Novice']).toHaveLength(1)
  })

  it('handles decimal tie-breaking — higher decimal wins', () => {
    const e1 = makeEntry('a1', 'skeet', 24.5, { division: 'Varsity', name: 'A1' })
    const e2 = makeEntry('a2', 'skeet', 24.0, { division: 'Varsity', name: 'A2' })
    const result = calculateEventAwards([e1, e2], 'skeet', baseConfig)
    expect(result.divisionPlacements['Varsity'][0].athleteId).toBe('a1')
    expect(result.divisionPlacements['Varsity'][1].athleteId).toBe('a2')
  })

  it('NSSA rule d: uses max(LRF,LRB) first — athlete with higher back run wins over higher front run', () => {
    // A: LRF=10, LRB=15 → best = 15
    // B: LRF=14, LRB=8  → best = 14
    // NSSA: A wins (15 > 14); naive LRF-first would give B (14 > 10)
    const config = { ...baseConfig, tiebreakOrder: ['longrun'], longRunDisciplines: ['skeet'] }
    const e1: AthleteScoreEntry = { ...makeEntry('a1', 'skeet', 90, { division: 'Varsity', name: 'A1' }), longRunFront: 10, longRunBack: 15 }
    const e2: AthleteScoreEntry = { ...makeEntry('a2', 'skeet', 90, { division: 'Varsity', name: 'A2' }), longRunFront: 14, longRunBack: 8 }
    const result = calculateEventAwards([e1, e2], 'skeet', config)
    expect(result.divisionPlacements['Varsity'][0].athleteId).toBe('a1')
    expect(result.divisionPlacements['Varsity'][1].athleteId).toBe('a2')
  })

  it('NSSA rule d: uses opposite end when max(LRF,LRB) is tied', () => {
    // A: LRF=15, LRB=12 → max=15, min=12
    // B: LRF=15, LRB=10 → max=15, min=10
    // Max tied → compare opposite end: A wins (12 > 10)
    const config = { ...baseConfig, tiebreakOrder: ['longrun'], longRunDisciplines: ['skeet'] }
    const e1: AthleteScoreEntry = { ...makeEntry('a1', 'skeet', 90, { division: 'Varsity', name: 'A1' }), longRunFront: 15, longRunBack: 12 }
    const e2: AthleteScoreEntry = { ...makeEntry('a2', 'skeet', 90, { division: 'Varsity', name: 'A2' }), longRunFront: 15, longRunBack: 10 }
    const result = calculateEventAwards([e1, e2], 'skeet', config)
    expect(result.divisionPlacements['Varsity'][0].athleteId).toBe('a1')
    expect(result.divisionPlacements['Varsity'][1].athleteId).toBe('a2')
  })
})

describe('calculateTeamAwards', () => {
  it('forms complete teams of teamSizeDefault and routes remainder to open', () => {
    // 7 athletes from club A in Varsity Skeet, teamSizeDefault=3
    const entries: AthleteScoreEntry[] = Array.from({ length: 7 }, (_, i) =>
      makeEntry(`a${i+1}`, 'skeet', 90 - i, {
        division: 'Varsity',
        gender: 'male',
        teamId: 'clubA',
        name: `A${i+1}`,
      })
    )
    const teamNames = { clubA: 'Club A' }
    const result = calculateTeamAwards(entries, 'skeet', teamNames, baseConfig)

    // Should have 2 complete Varsity teams (athletes 1-3 and 4-6)
    expect(result.divisionTeams['Varsity']).toHaveLength(2)
    // Open pool: athlete #7 should form an open team if >= teamSizeDefault — but 1 < 3, so no open team
    expect(result.openTeams).toHaveLength(0)
  })

  it('routes remainder athletes to open teams when enough remain from multiple clubs', () => {
    // Club A: 4 Varsity athletes (1 complete team + 1 open)
    // Club B: 4 Varsity athletes (1 complete team + 1 open)
    // The 2 remainder athletes cannot form an open team of 3 each, so 0 open teams
    const entriesA = Array.from({ length: 4 }, (_, i) =>
      makeEntry(`a${i+1}`, 'skeet', 80 - i, { division: 'Varsity', teamId: 'clubA', name: `A${i+1}` })
    )
    const entriesB = Array.from({ length: 4 }, (_, i) =>
      makeEntry(`b${i+1}`, 'skeet', 75 - i, { division: 'Varsity', teamId: 'clubB', name: `B${i+1}` })
    )
    const teamNames = { clubA: 'Club A', clubB: 'Club B' }
    const result = calculateTeamAwards([...entriesA, ...entriesB], 'skeet', teamNames, baseConfig)

    expect(result.divisionTeams['Varsity']).toHaveLength(2) // 1 from each club, capped at teamEventPlaces=2
    // Each club has 1 remainder athlete → open pool per club has 1 → can't form team of 3
    expect(result.openTeams).toHaveLength(0)
  })

  it('uses trapTeamSize for trap disciplines', () => {
    // 6 athletes from one club in Varsity Trap, trapTeamSize=5
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeEntry(`t${i+1}`, 'trap', 90 - i, { division: 'Varsity', teamId: 'clubA', name: `T${i+1}` })
    )
    const teamNames = { clubA: 'Club A' }
    const result = calculateTeamAwards(entries, 'trap', teamNames, baseConfig)
    // First team: top 5 athletes (trapTeamSize=5)
    expect(result.divisionTeams['Varsity']).toHaveLength(1)
    expect(result.divisionTeams['Varsity'][0].athletes).toHaveLength(5)
    // 1 remainder → open pool
    expect(result.openTeams).toHaveLength(0)
  })
})
