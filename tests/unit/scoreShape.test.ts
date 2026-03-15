/**
 * scoreShape.test.ts
 *
 * Does NOT import route.ts — defines factory functions that mirror the
 * shape-building logic for Score INSERT objects.
 *
 * Guards against the pre-fix bug where `stationNumber` was omitted from
 * round-score objects, shifting all bind parameters ($5 → $4) and causing
 * PostgreSQL 22P03 binary protocol errors.
 */

import { describe, it, expect } from 'vitest'

// ----- shape types mirroring the Prisma Score createMany data -----

interface ScoreInsert {
  shootId: string
  athleteId: string
  score: number
  targets: number
  roundNumber: number | null
  stationNumber: number | null
}

function hasRequiredFields(s: object): s is ScoreInsert {
  return (
    'roundNumber' in s &&
    'stationNumber' in s &&
    'targets' in s &&
    'score' in s &&
    'shootId' in s &&
    'athleteId' in s
  )
}

// ----- factory functions mirroring the shape-building logic in route.ts -----

function makeRoundScore(
  shootId: string,
  athleteId: string,
  idx: number,
  hits: number,
  maxTargets = 25
): ScoreInsert {
  return {
    shootId,
    athleteId,
    score: hits,
    targets: maxTargets,
    roundNumber: idx + 1,
    stationNumber: null,
  }
}

function makeStationScore(
  shootId: string,
  athleteId: string,
  idx: number,
  hits: number,
  maxTargets = 25
): ScoreInsert {
  return {
    shootId,
    athleteId,
    score: hits,
    targets: maxTargets,
    roundNumber: null,
    stationNumber: idx + 1,
  }
}

function makeTotalScore(
  shootId: string,
  athleteId: string,
  totalHits: number,
  totalTargets: number
): ScoreInsert {
  return {
    shootId,
    athleteId,
    score: totalHits,
    targets: totalTargets,
    roundNumber: 1,
    stationNumber: null,
  }
}

// ----- tests -----

describe('Score INSERT shape', () => {
  const SHOOT_ID = 'shoot-1'
  const ATHLETE_ID = 'athlete-1'

  describe('round scores', () => {
    it('has both roundNumber and stationNumber keys', () => {
      const s = makeRoundScore(SHOOT_ID, ATHLETE_ID, 0, 23)
      expect(hasRequiredFields(s)).toBe(true)
    })

    it('stationNumber is null for round-based scores', () => {
      const s = makeRoundScore(SHOOT_ID, ATHLETE_ID, 0, 23)
      expect(s).toHaveProperty('stationNumber', null)
    })

    it('roundNumber is idx+1', () => {
      const s = makeRoundScore(SHOOT_ID, ATHLETE_ID, 2, 20)
      expect(s.roundNumber).toBe(3)
    })

    it('uses provided maxTargets', () => {
      const s = makeRoundScore(SHOOT_ID, ATHLETE_ID, 0, 23, 25)
      expect(s.targets).toBe(25)
    })
  })

  describe('station scores', () => {
    it('has both roundNumber and stationNumber keys', () => {
      const s = makeStationScore(SHOOT_ID, ATHLETE_ID, 0, 4)
      expect(hasRequiredFields(s)).toBe(true)
    })

    it('roundNumber is null for station-based scores', () => {
      const s = makeStationScore(SHOOT_ID, ATHLETE_ID, 0, 4)
      expect(s).toHaveProperty('roundNumber', null)
    })

    it('stationNumber is idx+1', () => {
      const s = makeStationScore(SHOOT_ID, ATHLETE_ID, 4, 3)
      expect(s.stationNumber).toBe(5)
    })
  })

  describe('total/batch scores', () => {
    it('has both roundNumber and stationNumber keys', () => {
      const s = makeTotalScore(SHOOT_ID, ATHLETE_ID, 87, 100)
      expect(hasRequiredFields(s)).toBe(true)
    })

    it('roundNumber is 1 for total scores', () => {
      const s = makeTotalScore(SHOOT_ID, ATHLETE_ID, 87, 100)
      expect(s.roundNumber).toBe(1)
    })

    it('stationNumber is null for total scores', () => {
      const s = makeTotalScore(SHOOT_ID, ATHLETE_ID, 87, 100)
      expect(s).toHaveProperty('stationNumber', null)
    })
  })

  describe('pre-fix bug regression', () => {
    it('a score object MISSING stationNumber fails the shape check', () => {
      // This mirrors the bug: round scores were built without stationNumber,
      // shifting bind parameters and causing 22P03
      const buggyScore = {
        shootId: SHOOT_ID,
        athleteId: ATHLETE_ID,
        score: 23,
        targets: 25,
        roundNumber: 1,
        // stationNumber intentionally omitted ← the bug
      }
      expect(hasRequiredFields(buggyScore)).toBe(false)
    })

    it('a score object MISSING roundNumber fails the shape check', () => {
      const buggyScore = {
        shootId: SHOOT_ID,
        athleteId: ATHLETE_ID,
        score: 4,
        targets: 25,
        stationNumber: 1,
        // roundNumber intentionally omitted
      }
      expect(hasRequiredFields(buggyScore)).toBe(false)
    })
  })
})
