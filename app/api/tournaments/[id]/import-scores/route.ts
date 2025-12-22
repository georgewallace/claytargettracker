import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: tournamentId } = await params

    // Only admins can import scores
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can import scores' },
        { status: 403 }
      )
    }

    // Get form data with file
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)

    // Try new format first (Shooter History), then fall back to old format (Tournament List)
    let sheet = workbook.Sheets['Shooter History']
    let useNewFormat = true

    if (!sheet) {
      sheet = workbook.Sheets['Tournament List']
      useNewFormat = false
    }

    if (!sheet) {
      return NextResponse.json(
        { error: 'Neither "Shooter History" nor "Tournament List" sheet found in Excel file' },
        { status: 400 }
      )
    }

    // Parse to JSON
    const data = XLSX.utils.sheet_to_json(sheet)

    // Process scores based on format
    const results = useNewFormat
      ? await processShooterHistoryImport(tournamentId, data)
      : await processScoreImport(tournamentId, data)

    return NextResponse.json(results)

  } catch (error) {
    console.error('Score import error:', error)
    return NextResponse.json(
      {
        error: 'Failed to import scores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function processScoreImport(tournamentId: string, data: any[]) {
  const results = {
    success: 0,
    errors: [] as string[],
    updated: [] as string[],
    skipped: 0
  }

  // Get tournament and its disciplines
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      disciplines: {
        include: { discipline: true }
      }
    }
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  // Get discipline ID mappings
  const skeetDiscipline = tournament.disciplines.find(d =>
    d.discipline.name === 'skeet'
  )
  const trapDiscipline = tournament.disciplines.find(d =>
    d.discipline.name === 'trap'
  )
  const sportingDiscipline = tournament.disciplines.find(d =>
    d.discipline.name === 'sporting_clays'
  )

  // Process each row (athlete)
  for (const row of data) {
    try {
      const shooterId = row['Shooter ID']?.toString().trim()
      const fullName = row['Full Name']?.toString().trim()
      const firstName = row['First Name']?.toString().trim()
      const lastName = row['Last Name']?.toString().trim()

      // Construct name from available fields
      const shooterName = fullName || (firstName && lastName ? `${firstName} ${lastName}` : null)

      if (!shooterId && !shooterName) {
        results.skipped++
        continue
      }

      // Find athlete by shooterId first, then fall back to name
      let athlete = null

      if (shooterId) {
        athlete = await prisma.athlete.findFirst({
          where: { shooterId },
          include: { user: true }
        })
      }

      // If not found by shooterId, try matching by name
      if (!athlete && shooterName) {
        athlete = await prisma.athlete.findFirst({
          where: {
            user: {
              name: shooterName
            }
          },
          include: { user: true }
        })
      }

      if (!athlete) {
        results.errors.push(`Athlete not found: ${shooterName || shooterId}`)
        continue
      }

      // Import Skeet scores
      if (skeetDiscipline && row['Skeet Event'] === 'Y') {
        try {
          const roundScores = [
            row['Round 1'],
            row['Round 2'],
            row['Round 3'],
            row['Round 4']
          ].map(s => {
            const score = parseInt(s)
            return isNaN(score) ? null : score
          }).filter((s): s is number => s !== null)

          if (roundScores.length > 0) {
            await importDisciplineScores({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: skeetDiscipline.disciplineId,
              roundScores
            })
            results.updated.push(`${shooterId} - Skeet (${roundScores.length} rounds)`)
          }
        } catch (err) {
          results.errors.push(`${shooterId} - Skeet import failed: ${err}`)
        }
      }

      // Import Trap scores
      if (trapDiscipline && row['Trap Event'] === 'Y') {
        try {
          const roundScores = [
            row['Trap Round 1'],
            row['Trap Round 2'],
            row['Trap Round 3'],
            row['Trap Round 4']
          ].map(s => {
            const score = parseInt(s)
            return isNaN(score) ? null : score
          }).filter((s): s is number => s !== null)

          if (roundScores.length > 0) {
            await importDisciplineScores({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: trapDiscipline.disciplineId,
              roundScores
            })
            results.updated.push(`${shooterId} - Trap (${roundScores.length} rounds)`)
          }
        } catch (err) {
          results.errors.push(`${shooterId} - Trap import failed: ${err}`)
        }
      }

      // Import Sporting Clays scores
      if (sportingDiscipline && row['Sporting Event'] === 'Y') {
        try {
          const stationScores = []
          for (let i = 1; i <= 20; i++) {
            const score = parseInt(row[`Station ${i}`])
            if (!isNaN(score)) {
              stationScores.push(score)
            }
          }

          if (stationScores.length > 0) {
            await importDisciplineScores({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: sportingDiscipline.disciplineId,
              stationScores
            })
            results.updated.push(`${shooterId} - Sporting (${stationScores.length} stations)`)
          }
        } catch (err) {
          results.errors.push(`${shooterId} - Sporting import failed: ${err}`)
        }
      }

      results.success++

    } catch (error) {
      const shooterId = row['Shooter ID'] || 'Unknown'
      results.errors.push(`Error processing ${shooterId}: ${error}`)
    }
  }

  return results
}

async function processShooterHistoryImport(tournamentId: string, data: any[]) {
  const results = {
    success: 0,
    errors: [] as string[],
    updated: [] as string[],
    skipped: 0
  }

  // Get tournament and its disciplines
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      disciplines: {
        include: { discipline: true }
      }
    }
  })

  if (!tournament) {
    throw new Error('Tournament not found')
  }

  // Get discipline ID mappings
  const skeetDiscipline = tournament.disciplines.find(d =>
    d.discipline.name === 'skeet'
  )
  const trapDiscipline = tournament.disciplines.find(d =>
    d.discipline.name === 'trap'
  )
  const sportingDiscipline = tournament.disciplines.find(d =>
    d.discipline.name === 'sporting_clays'
  )

  // Process each row (athlete)
  for (const row of data) {
    try {
      const shooterId = row['Shooter ID']?.toString().trim()
      const fullName = row['Full Name']?.toString().trim()
      const firstName = row['First Name']?.toString().trim()
      const lastName = row['Last Name']?.toString().trim()

      // Construct name from available fields
      const shooterName = fullName || (firstName && lastName ? `${firstName} ${lastName}` : null)

      if (!shooterId && !shooterName) {
        results.skipped++
        continue
      }

      // Find athlete by shooterId first, then fall back to name
      let athlete = null

      if (shooterId) {
        athlete = await prisma.athlete.findFirst({
          where: { shooterId },
          include: { user: true }
        })
      }

      // If not found by shooterId, try matching by name
      if (!athlete && shooterName) {
        athlete = await prisma.athlete.findFirst({
          where: {
            user: {
              name: shooterName
            }
          },
          include: { user: true }
        })
      }

      if (!athlete) {
        results.errors.push(`Athlete not found: ${shooterName || shooterId}`)
        continue
      }

      let imported = false

      // Import Skeet score if present
      const skeetScore = row[' Skeet Score '] || row['Skeet Score']
      if (skeetDiscipline && skeetScore) {
        try {
          const score = parseInt(skeetScore.toString().trim())
          if (!isNaN(score) && score > 0) {
            await importSingleScore({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: skeetDiscipline.disciplineId,
              totalScore: score,
              maxScore: 100
            })
            results.updated.push(`${shooterId} - Skeet (${score})`)
            imported = true
          }
        } catch (err) {
          results.errors.push(`${shooterId} - Skeet import failed: ${err}`)
        }
      }

      // Import Trap score if present
      const trapScore = row[' Trap Score '] || row['Trap Score']
      if (trapDiscipline && trapScore) {
        try {
          const score = parseInt(trapScore.toString().trim())
          if (!isNaN(score) && score > 0) {
            await importSingleScore({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: trapDiscipline.disciplineId,
              totalScore: score,
              maxScore: 100
            })
            results.updated.push(`${shooterId} - Trap (${score})`)
            imported = true
          }
        } catch (err) {
          results.errors.push(`${shooterId} - Trap import failed: ${err}`)
        }
      }

      // Import Sporting score if present
      const sportingScore = row[' Sporting Score '] || row['Sporting Score']
      if (sportingDiscipline && sportingScore) {
        try {
          const score = parseInt(sportingScore.toString().trim())
          if (!isNaN(score) && score > 0) {
            await importSingleScore({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: sportingDiscipline.disciplineId,
              totalScore: score,
              maxScore: 100
            })
            results.updated.push(`${shooterId} - Sporting (${score})`)
            imported = true
          }
        } catch (err) {
          results.errors.push(`${shooterId} - Sporting import failed: ${err}`)
        }
      }

      if (imported) {
        results.success++
      } else {
        results.skipped++
      }

    } catch (error) {
      const shooterId = row['Shooter ID'] || 'Unknown'
      results.errors.push(`Error processing ${shooterId}: ${error}`)
    }
  }

  return results
}

async function importSingleScore({
  athleteId,
  tournamentId,
  disciplineId,
  totalScore,
  maxScore
}: {
  athleteId: string
  tournamentId: string
  disciplineId: string
  totalScore: number
  maxScore: number
}) {
  // Find or create Shoot record
  let shoot = await prisma.shoot.findUnique({
    where: {
      tournamentId_athleteId_disciplineId: {
        tournamentId,
        athleteId,
        disciplineId
      }
    }
  })

  if (!shoot) {
    shoot = await prisma.shoot.create({
      data: {
        athleteId,
        tournamentId,
        disciplineId
      }
    })
  }

  // Delete existing Score records for this shoot
  await prisma.score.deleteMany({
    where: { shootId: shoot.id }
  })

  // Create a single Score record with the total
  await prisma.score.create({
    data: {
      shootId: shoot.id,
      roundNumber: 1,
      targets: totalScore,
      maxTargets: maxScore
    }
  })
}

async function importDisciplineScores({
  athleteId,
  tournamentId,
  disciplineId,
  roundScores,
  stationScores
}: {
  athleteId: string
  tournamentId: string
  disciplineId: string
  roundScores?: number[]
  stationScores?: number[]
}) {
  // Calculate total
  const totalTargets = [...(roundScores || []), ...(stationScores || [])]
    .reduce((sum, score) => sum + score, 0)

  // Find or create Shoot record
  let shoot = await prisma.shoot.findUnique({
    where: {
      tournamentId_athleteId_disciplineId: {
        tournamentId,
        athleteId,
        disciplineId
      }
    }
  })

  if (!shoot) {
    shoot = await prisma.shoot.create({
      data: {
        athleteId,
        tournamentId,
        disciplineId
      }
    })
  }

  // Delete existing Score records for this shoot
  await prisma.score.deleteMany({
    where: { shootId: shoot.id }
  })

  // Create new Score records
  if (roundScores && roundScores.length > 0) {
    await prisma.score.createMany({
      data: roundScores.map((targets, idx) => ({
        shootId: shoot.id,
        roundNumber: idx + 1,
        targets,
        maxTargets: 25
      }))
    })
  }

  if (stationScores && stationScores.length > 0) {
    await prisma.score.createMany({
      data: stationScores.map((targets, idx) => ({
        shootId: shoot.id,
        stationNumber: idx + 1,
        targets,
        maxTargets: 10 // Varies by station, but 10 is common
      }))
    })
  }
}
