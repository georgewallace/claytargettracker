import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock @prisma/client before importing lib/prisma so new PrismaClient() doesn't fail
// without DATABASE_URL
vi.mock('@prisma/client', () => {
  class PrismaClientInitializationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'PrismaClientInitializationError'
    }
  }
  const mockInstance = {
    $extends: vi.fn().mockImplementation(function (this: any) { return this }),
    $disconnect: vi.fn(),
  }
  return {
    PrismaClient: vi.fn().mockReturnValue(mockInstance),
    PrismaClientInitializationError,
  }
})

// Prevent file-system lookups for .env.production in lib/prisma.ts
vi.mock('fs', async (importOriginal) => {
  const original = await importOriginal<typeof import('fs')>()
  return { ...original, existsSync: vi.fn().mockReturnValue(false) }
})

vi.mock('dotenv', () => ({ config: vi.fn() }))

describe('isConnectionError', () => {
  let isConnectionError: (error: any) => boolean

  beforeAll(async () => {
    const mod = await import('@/lib/prisma')
    isConnectionError = mod.isConnectionError
  })

  it.each([
    ["Can't reach database server"],
    ['ECONNREFUSED'],
    ['ETIMEDOUT'],
    ['ENOTFOUND'],
    ['Connection terminated unexpectedly'],
    ['incorrect binary data format'],
    ['22P03'],
  ])('returns true for error message containing "%s"', (msg) => {
    expect(isConnectionError({ message: msg })).toBe(true)
  })

  it.each([
    ['P1001'],
    ['P1008'],
    ['P1017'],
  ])('returns true for Prisma error code %s', (code) => {
    expect(isConnectionError({ code })).toBe(true)
  })

  it('returns true for PrismaClientInitializationError by name', () => {
    expect(isConnectionError({ name: 'PrismaClientInitializationError' })).toBe(true)
  })

  it('returns false for non-connection errors', () => {
    expect(isConnectionError({ message: 'Unique constraint violated' })).toBe(false)
    expect(isConnectionError({ code: 'P2002' })).toBe(false)
    expect(isConnectionError(new Error('Something went wrong'))).toBe(false)
  })

  it('handles null/undefined/empty error gracefully', () => {
    expect(isConnectionError(null)).toBe(false)
    expect(isConnectionError(undefined)).toBe(false)
    expect(isConnectionError({})).toBe(false)
  })
})
