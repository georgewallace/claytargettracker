import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')

function readSchema(filename: string): string {
  return readFileSync(resolve(ROOT, 'prisma', filename), 'utf-8')
}

// Extract a model block by name from a Prisma schema string
function extractModel(schema: string, modelName: string): string {
  const regex = new RegExp(`^model ${modelName} \\{[\\s\\S]*?^\\}`, 'm')
  const match = schema.match(regex)
  if (!match) throw new Error(`Model "${modelName}" not found in schema`)
  return match[0]
}

describe('Prisma schema consistency', () => {
  const sqliteSchema = readSchema('schema-sqlite.prisma')
  const postgresSchema = readSchema('schema-postgres.prisma')

  it('Score.targets is Float in postgres schema (not Int)', () => {
    const model = extractModel(postgresSchema, 'Score')
    // Should contain "targets" followed by "Float"
    const targetsLine = model.split('\n').find(l => l.trim().match(/^targets\s/))
    expect(targetsLine).toBeDefined()
    expect(targetsLine).toMatch(/Float/)
    expect(targetsLine).not.toMatch(/\bInt\b/)
  })

  it('Score.targets is Int in sqlite schema (known intentional divergence)', () => {
    const model = extractModel(sqliteSchema, 'Score')
    const targetsLine = model.split('\n').find(l => l.trim().match(/^targets\s/))
    expect(targetsLine).toBeDefined()
    // SQLite doesn't support Float natively; stored as Int — this is intentional
    expect(targetsLine).toMatch(/Int/)
  })

  it('Score has roundNumber Int? in postgres schema', () => {
    const model = extractModel(postgresSchema, 'Score')
    const line = model.split('\n').find(l => l.trim().match(/^roundNumber\s/))
    expect(line).toBeDefined()
    expect(line).toMatch(/Int\?/)
  })

  it('Score has stationNumber Int? in postgres schema', () => {
    const model = extractModel(postgresSchema, 'Score')
    const line = model.split('\n').find(l => l.trim().match(/^stationNumber\s/))
    expect(line).toBeDefined()
    expect(line).toMatch(/Int\?/)
  })

  it('Score has roundNumber in sqlite schema', () => {
    const model = extractModel(sqliteSchema, 'Score')
    const line = model.split('\n').find(l => l.trim().match(/^roundNumber\s/))
    expect(line).toBeDefined()
    expect(line).toMatch(/Int/)
  })

  it('Score has stationNumber in sqlite schema', () => {
    const model = extractModel(sqliteSchema, 'Score')
    const line = model.split('\n').find(l => l.trim().match(/^stationNumber\s/))
    expect(line).toBeDefined()
    expect(line).toMatch(/Int/)
  })
})
