import { describe, it, expect, vi, beforeAll } from 'vitest'

// Stub all Next.js / DB / xlsx dependencies so we can import the route module
vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: { json: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    score: { createMany: vi.fn() },
    tournament: { update: vi.fn() },
    $disconnect: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({ requireAuthWithApiKey: vi.fn() }))

vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: { sheet_to_json: vi.fn() },
}))

describe('parsePlacementText', () => {
  let parsePlacementText: (
    text: string,
    athleteGender: string | null,
    athleteDivision: string | null
  ) => { concurrentPlace?: number; haaPlace?: number }

  beforeAll(async () => {
    const mod = await import('@/app/api/tournaments/[id]/import-scores/route')
    parsePlacementText = mod.parsePlacementText
  })

  // --- placement number extraction ---

  it('Champion → 1', () => {
    const r = parsePlacementText('Varsity Men\'s Skeet Champion', 'M', 'Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('Runner Up → 2', () => {
    const r = parsePlacementText('Varsity Men\'s Skeet Runner Up', 'M', 'Varsity')
    expect(r.concurrentPlace).toBe(2)
  })

  it('3rd → 3', () => {
    const r = parsePlacementText('Varsity Men\'s Skeet 3rd', 'M', 'Varsity')
    expect(r.concurrentPlace).toBe(3)
  })

  it('4th → 4', () => {
    const r = parsePlacementText('Varsity Men\'s Skeet 4th', 'M', 'Varsity')
    expect(r.concurrentPlace).toBe(4)
  })

  it('5th → 5', () => {
    const r = parsePlacementText('Varsity Men\'s Skeet 5th', 'M', 'Varsity')
    expect(r.concurrentPlace).toBe(5)
  })

  // --- HAA vs non-HAA routing ---

  it('HAA prefix routes to haaPlace, not concurrentPlace', () => {
    const r = parsePlacementText('HAA Lady\'s Skeet Champion', 'F', null)
    expect(r.haaPlace).toBe(1)
    expect(r.concurrentPlace).toBeUndefined()
  })

  it('non-HAA prefix routes to concurrentPlace', () => {
    const r = parsePlacementText('Varsity Men\'s Skeet Champion', 'M', 'Varsity')
    expect(r.concurrentPlace).toBe(1)
    expect(r.haaPlace).toBeUndefined()
  })

  // --- gender matching ---

  it('men\'s text matches M athlete', () => {
    const r = parsePlacementText('Varsity Men\'s Skeet Champion', 'M', 'Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('men\'s text does not match F athlete', () => {
    const r = parsePlacementText('Varsity Men\'s Skeet Champion', 'F', 'Varsity')
    expect(r).toEqual({})
  })

  it('lady\'s text matches F athlete', () => {
    const r = parsePlacementText('Varsity Lady\'s Skeet Champion', 'F', 'Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('ladies text matches F athlete', () => {
    const r = parsePlacementText('Varsity Ladies Skeet Champion', 'F', 'Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('female text matches F athlete', () => {
    const r = parsePlacementText('Varsity Female Skeet Champion', 'F', 'Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('women text matches F athlete', () => {
    const r = parsePlacementText('Varsity Women Skeet Champion', 'F', 'Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('male text matches M athlete', () => {
    const r = parsePlacementText('Varsity Male Skeet Champion', 'M', 'Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('gender-neutral text matches any athlete', () => {
    const rM = parsePlacementText('Varsity Skeet Champion', 'M', 'Varsity')
    const rF = parsePlacementText('Varsity Skeet Champion', 'F', 'Varsity')
    expect(rM.concurrentPlace).toBe(1)
    expect(rF.concurrentPlace).toBe(1)
  })

  // --- division matching ---

  it('division must match when not HAA', () => {
    const match = parsePlacementText('Varsity Men\'s Skeet Champion', 'M', 'Varsity')
    const noMatch = parsePlacementText('Varsity Men\'s Skeet Champion', 'M', 'Junior Varsity')
    expect(match.concurrentPlace).toBe(1)
    expect(noMatch).toEqual({})
  })

  it('"jr varsity" matches athlete with division "Junior Varsity"', () => {
    const r = parsePlacementText('Jr Varsity Men\'s Skeet Champion', 'M', 'Junior Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('"junior varsity" matches athlete with division "Jr Varsity"', () => {
    const r = parsePlacementText('Junior Varsity Men\'s Skeet Champion', 'M', 'Jr Varsity')
    expect(r.concurrentPlace).toBe(1)
  })

  it('HAA skips division check', () => {
    // HAA entries don't filter by division
    const r = parsePlacementText('HAA Men\'s Skeet Champion', 'M', 'Varsity')
    expect(r.haaPlace).toBe(1)
  })

  // --- empty / no match ---

  it('returns {} for empty string', () => {
    expect(parsePlacementText('', 'M', 'Varsity')).toEqual({})
  })

  it('returns {} when no placement word found', () => {
    expect(parsePlacementText('Varsity Men\'s Skeet', 'M', 'Varsity')).toEqual({})
  })
})
