import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import * as XLSX from 'xlsx'

// Helper function to parse placement text like "Varsity Men's Skeet Runner Up" or "HOA Lady's Skeet Champion"
function parsePlacementText(text: string, athleteGender: string | null, athleteDivision: string | null): {
  concurrentPlace?: number
  hoaPlace?: number
} {
  if (!text) return {}

  const lowerText = text.toLowerCase().trim()
  const result: { concurrentPlace?: number; hoaPlace?: number } = {}

  // Determine if this is HOA or division-specific
  const isHOA = lowerText.startsWith('hoa ')

  // Check gender matching
  const isMale = lowerText.includes("men's") || lowerText.includes("mens") || lowerText.includes("male")
  const isFemale = lowerText.includes("lady's") || lowerText.includes("ladies") || lowerText.includes("female") || lowerText.includes("women")
  const genderMatches = !isMale && !isFemale ||
                       (isMale && athleteGender === 'M') ||
                       (isFemale && athleteGender === 'F')

  if (!genderMatches) return {}

  // Check division matching (if it's not HOA)
  if (!isHOA && athleteDivision) {
    const divisionLower = athleteDivision.toLowerCase()
    // Common division name variations
    const divisionVariations = [
      divisionLower,
      divisionLower.replace(' ', ''),
      divisionLower.replace('junior varsity', 'jr varsity'),
      divisionLower.replace('jr varsity', 'junior varsity')
    ]

    const divisionMatches = divisionVariations.some(div => lowerText.includes(div))
    if (!divisionMatches) return {}
  }

  // Extract placement number
  let place: number | undefined
  if (lowerText.includes('champion') && !lowerText.includes('runner')) {
    place = 1
  } else if (lowerText.includes('runner up') || lowerText.includes('runner-up')) {
    place = 2
  } else if (lowerText.includes('3rd') || lowerText.includes('third')) {
    place = 3
  } else if (lowerText.includes('4th') || lowerText.includes('fourth')) {
    place = 4
  } else if (lowerText.includes('5th') || lowerText.includes('fifth')) {
    place = 5
  }

  if (place) {
    if (isHOA) {
      result.hoaPlace = place
    } else {
      result.concurrentPlace = place
    }
  }

  return result
}

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

    // Read Tournament Setup sheet if it exists and update tournament configuration
    const tournamentSetupSheet = workbook.Sheets['Tournament Setup']
    if (tournamentSetupSheet) {
      const setupData = XLSX.utils.sheet_to_json(tournamentSetupSheet, { header: 1, defval: '' }) as any[]

      // Extract HAA/HOA configuration from specific rows
      // Row 20: Places for HAA (Overall) - Column B (index 1)
      // Row 21: Places for HAA Men - Column B (index 1)
      // Row 22: Places for HAA Lady - Column B (index 1)
      // Row 26: Places for HOA (Overall) - Column B (index 1)
      // Row 27: Places for HOA Men - Column B (index 1)
      // Row 28: Places for HOA Lady - Column B (index 1)

      const haaOverallPlaces = setupData[20]?.[1] || 2
      const haaMenPlaces = setupData[21]?.[1] || 2
      const haaLadyPlaces = setupData[22]?.[1] || 2
      const hoaOverallPlaces = setupData[26]?.[1] || 0
      const hoaMenPlaces = setupData[27]?.[1] || 2
      const hoaLadyPlaces = setupData[28]?.[1] || 2

      // Update tournament configuration
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          haaOverallPlaces: typeof haaOverallPlaces === 'number' ? haaOverallPlaces : 2,
          haaMenPlaces: typeof haaMenPlaces === 'number' ? haaMenPlaces : 2,
          haaLadyPlaces: typeof haaLadyPlaces === 'number' ? haaLadyPlaces : 2,
          hoaOverallPlaces: typeof hoaOverallPlaces === 'number' ? hoaOverallPlaces : 0,
          hoaMenPlaces: typeof hoaMenPlaces === 'number' ? hoaMenPlaces : 2,
          hoaLadyPlaces: typeof hoaLadyPlaces === 'number' ? hoaLadyPlaces : 2
        } as any
      })
    }

    // Only accept "Shooter History" or "Shooter Scores" sheets
    const shooterHistorySheet = workbook.Sheets['Shooter History']
    const shooterScoresSheet = workbook.Sheets['Shooter Scores']

    // Check if both sheets exist
    if (shooterHistorySheet && shooterScoresSheet) {
      // Check if both have data
      const historyData = XLSX.utils.sheet_to_json(shooterHistorySheet)
      const scoresData = XLSX.utils.sheet_to_json(shooterScoresSheet)

      if (historyData.length > 0 && scoresData.length > 0) {
        return NextResponse.json(
          { error: 'Import failed: Excel file contains both "Shooter History" and "Shooter Scores" sheets with data. Please remove one of them.' },
          { status: 400 }
        )
      }
    }

    // Determine which sheet to use based on existence and data
    let sheet = null
    let sheetName = ''
    let data: any[] = []

    if (shooterHistorySheet) {
      const historyData = XLSX.utils.sheet_to_json(shooterHistorySheet)
      if (historyData.length > 0) {
        sheet = shooterHistorySheet
        sheetName = 'Shooter History'
        data = historyData
      }
    }

    if (!sheet && shooterScoresSheet) {
      let scoresData = XLSX.utils.sheet_to_json(shooterScoresSheet)

      // Check if first row has expected headers (Shooter ID, First Name, etc.)
      // If not, the sheet might have an extra title row that needs to be skipped
      if (scoresData.length > 0) {
        const firstRow = scoresData[0] as Record<string, any>
        const hasValidHeaders = firstRow && (
          'Shooter ID' in firstRow ||
          'First Name' in firstRow ||
          'Last Name' in firstRow
        )

        if (!hasValidHeaders) {
          // Re-read with Row 1 as headers (skip Row 0)
          scoresData = XLSX.utils.sheet_to_json(shooterScoresSheet, { range: 1 })
        }
      }

      if (scoresData.length > 0) {
        sheet = shooterScoresSheet
        sheetName = 'Shooter Scores'
        data = scoresData
      }
    }

    if (!sheet || data.length === 0) {
      return NextResponse.json(
        { error: 'Import failed: Excel file must contain a sheet named "Shooter History" or "Shooter Scores" with data' },
        { status: 400 }
      )
    }

    // Process scores using the Shooter History import format (both sheets use same format)
    const results = await processShooterHistoryImport(tournamentId, data)

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

  // BATCH OPTIMIZATION: Collect all shooter IDs and names upfront
  const shooterIds = new Set<string>()
  const shooterNames = new Set<string>()

  // Track squad divisions and teams from Excel for later squad updates
  // Map: athleteId -> { skeet: { division, team }, trap: { division, team }, sporting: { division, team } }
  const athleteSquadData = new Map<string, {
    skeet?: { division: string, team: string }
    trap?: { division: string, team: string }
    sporting?: { division: string, team: string }
  }>()

  for (const row of data) {
    const shooterId = row['Shooter ID']?.toString().trim()
    const fullName = row['Full Name']?.toString().trim()
    const firstName = row['First Name']?.toString().trim()
    const lastName = row['Last Name']?.toString().trim()
    const shooterName = fullName || (firstName && lastName ? `${firstName} ${lastName}` : null)

    if (shooterId) shooterIds.add(shooterId)
    if (shooterName && shooterName.toLowerCase() !== 'x' && shooterName.toLowerCase() !== 'x x' && shooterName.trim().length >= 2) {
      shooterNames.add(shooterName)
    }
  }

  // BATCH OPTIMIZATION: Fetch all athletes in one query
  const athletes = await prisma.athlete.findMany({
    where: {
      OR: [
        { shooterId: { in: Array.from(shooterIds) } },
        { user: { name: { in: Array.from(shooterNames) } } }
      ]
    },
    include: { user: true }
  })

  // Create lookup maps
  const athleteByShooterId = new Map(
    athletes.filter(a => a.shooterId).map(a => [a.shooterId!, a])
  )
  const athleteByName = new Map(
    athletes.map(a => [a.user.name, a])
  )

  // BATCH OPTIMIZATION: Collect all class updates to apply in bulk
  const classUpdatesMap = new Map<string, any>()

  // Process each row (athlete)
  for (const row of data) {
    try {
      const shooterId = row['Shooter ID']?.toString().trim()
      const fullName = row['Full Name']?.toString().trim()
      const firstName = row['First Name']?.toString().trim()
      const lastName = row['Last Name']?.toString().trim()

      // Construct name from available fields
      const shooterName = fullName || (firstName && lastName ? `${firstName} ${lastName}` : null)

      // Skip rows with no ID/name or placeholder names like "x x", "x", etc.
      if (!shooterId && !shooterName) {
        results.skipped++
        continue
      }

      // Skip placeholder/invalid names
      if (shooterName && (shooterName.toLowerCase() === 'x' || shooterName.toLowerCase() === 'x x' || shooterName.trim().length < 2)) {
        results.skipped++
        continue
      }

      // Find athlete using pre-loaded map
      let athlete = null
      if (shooterId) {
        athlete = athleteByShooterId.get(shooterId)
      }
      if (!athlete && shooterName) {
        athlete = athleteByName.get(shooterName)
      }

      if (!athlete) {
        results.errors.push(`Athlete not found: ${shooterName || shooterId}`)
        continue
      }

      // Collect athlete class data if present in the spreadsheet
      const skeetClass = row['Skeet Class']?.toString().trim()
      const trapClass = row['Trap Class']?.toString().trim()
      const sportingClass = row['Sporting Class']?.toString().trim()

      const classUpdates: any = {}
      if (skeetClass) classUpdates.nssaClass = skeetClass
      if (trapClass) classUpdates.ataClass = trapClass
      if (sportingClass) classUpdates.nscaClass = sportingClass

      // Collect class updates for batch processing
      if (Object.keys(classUpdates).length > 0) {
        classUpdatesMap.set(athlete.id, classUpdates)
      }

      // Extract HAA placement data (applies to all disciplines)
      // Parse text-based placement values like "HAA Champion", "HAA Men's Champion", etc.
      let haaIndividualPlace: number | undefined
      let haaConcurrent: string | undefined

      const athleteGender = athlete.gender
      const haaPlaceText = row['HAA Individual Place']?.toString().trim() || ''

      // Parse HAA placement text to numeric value
      if (haaPlaceText) {
        const lowerText = haaPlaceText.toLowerCase()

        // Check if this is a gender-specific placement
        const isMale = lowerText.includes("men's") || lowerText.includes("mens") || lowerText.includes("male")
        const isFemale = lowerText.includes("lady's") || lowerText.includes("ladies") || lowerText.includes("female") || lowerText.includes("women")

        // Only assign if it matches athlete's gender or is gender-neutral
        const genderMatches = !isMale && !isFemale ||
                             (isMale && athleteGender === 'M') ||
                             (isFemale && athleteGender === 'F')

        if (genderMatches) {
          // Map text to placement number
          if (lowerText.includes('champion') && !lowerText.includes('runner')) {
            haaIndividualPlace = 1
          } else if (lowerText.includes('runner up') || lowerText.includes('runner-up')) {
            haaIndividualPlace = 2
          } else if (lowerText.includes('third') || lowerText.includes('3rd')) {
            haaIndividualPlace = 3
          } else if (lowerText.includes('fourth') || lowerText.includes('4th')) {
            haaIndividualPlace = 4
          } else if (lowerText.includes('fifth') || lowerText.includes('5th')) {
            haaIndividualPlace = 5
          }
        }
      }

      // Try numeric columns as fallback
      if (!haaIndividualPlace) {
        if (athleteGender === 'M') {
          haaIndividualPlace = row['HAA Male Place'] ? parseInt(row['HAA Male Place']) :
                              row['HAA Men Place'] ? parseInt(row['HAA Men Place']) : undefined
        } else if (athleteGender === 'F') {
          haaIndividualPlace = row['HAA Female Place'] ? parseInt(row['HAA Female Place']) :
                              row['HAA Ladies Place'] ? parseInt(row['HAA Ladies Place']) :
                              row['HAA Women Place'] ? parseInt(row['HAA Women Place']) : undefined
        }
      }

      // Get HAA Concurrent (division)
      haaConcurrent = row['HAA Concurrent']?.toString().trim() ||
                     row['HAA Male Concurrent']?.toString().trim() ||
                     row['HAA Men Concurrent']?.toString().trim() ||
                     row['HAA Female Concurrent']?.toString().trim() ||
                     row['HAA Ladies Concurrent']?.toString().trim() ||
                     row['HAA Women Concurrent']?.toString().trim() || undefined

      let imported = false

      // Import Skeet score if present
      const skeetScore = row[' Skeet Score '] || row['Skeet Score']
      if (skeetDiscipline && skeetScore) {
        try {
          const score = parseFloat(skeetScore.toString().trim())
          if (!isNaN(score) && score > 0) {
            // Track Skeet squad division and team from Excel
            const skeetSquadDivision = row['Skeet Squad Concurrent']?.toString().trim()
            const teamName = row['Team']?.toString().trim() || ''
            if (skeetSquadDivision && teamName) {
              const squadData = athleteSquadData.get(athlete.id) || {}
              squadData.skeet = { division: skeetSquadDivision, team: teamName }
              athleteSquadData.set(athlete.id, squadData)
            }

            // Extract placement data - check for gender-specific columns
            const gender = athlete.gender
            const athleteDivision = athlete.division

            // Get the raw placement column value (could be text or number)
            const concurrentPlaceRaw = (gender === 'M'
              ? (row['Skeet Male Concurrent Place'] || row['Skeet Men Concurrent Place'] || row['Skeet Concurrent Place'])
              : gender === 'F'
              ? (row['Skeet Female Concurrent Place'] || row['Skeet Ladies Concurrent Place'] || row['Skeet Women Concurrent Place'] || row['Skeet Concurrent Place'])
              : row['Skeet Concurrent Place']
            )

            // Try parsing as text first
            const placementText = concurrentPlaceRaw?.toString().trim()
            const parsedPlacement = placementText ? parsePlacementText(placementText, gender, athleteDivision) : {}

            // Use parsed values or fall back to numeric parsing
            let concurrentPlace = parsedPlacement.concurrentPlace
            let hoaPlace = parsedPlacement.hoaPlace

            if (!concurrentPlace && concurrentPlaceRaw) {
              const numericValue = parseInt(concurrentPlaceRaw.toString())
              if (!isNaN(numericValue)) {
                concurrentPlace = numericValue
              }
            }

            const classPlace = (gender === 'M'
              ? (row['Skeet Male Class Place'] || row['Skeet Men Class Place'] || row['Skeet Class Place'])
              : gender === 'F'
              ? (row['Skeet Female Class Place'] || row['Skeet Ladies Class Place'] || row['Skeet Women Class Place'] || row['Skeet Class Place'])
              : row['Skeet Class Place']
            ) ? parseInt((gender === 'M'
              ? (row['Skeet Male Class Place'] || row['Skeet Men Class Place'] || row['Skeet Class Place'])
              : gender === 'F'
              ? (row['Skeet Female Class Place'] || row['Skeet Ladies Class Place'] || row['Skeet Women Class Place'] || row['Skeet Class Place'])
              : row['Skeet Class Place']
            )) : undefined

            const teamPlace = row['Skeet Team Place'] ? parseInt(row['Skeet Team Place']) : undefined
            const individualRank = row['Skeet Individual Rank'] ? parseInt(row['Skeet Individual Rank']) : undefined
            const teamRank = row['Skeet Team Rank'] ? parseInt(row['Skeet Team Rank']) : undefined
            const teamScore = row['Skeet Team Score'] ? parseInt(row['Skeet Team Score']) : undefined

            await importSingleScore({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: skeetDiscipline.disciplineId,
              totalScore: score,
              maxScore: 100,
              concurrentPlace,
              classPlace,
              teamPlace,
              hoaPlace,
              individualRank,
              teamRank,
              teamScore,
              haaIndividualPlace,
              haaConcurrent
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
          const score = parseFloat(trapScore.toString().trim())
          if (!isNaN(score) && score > 0) {
            // Track Trap squad division and team from Excel
            const trapSquadDivision = row['Trap Squad Concurrent']?.toString().trim()
            const teamName = row['Team']?.toString().trim() || ''
            if (trapSquadDivision && teamName) {
              const squadData = athleteSquadData.get(athlete.id) || {}
              squadData.trap = { division: trapSquadDivision, team: teamName }
              athleteSquadData.set(athlete.id, squadData)
            }

            // Extract placement data - check for gender-specific columns
            const gender = athlete.gender
            const athleteDivision = athlete.division

            // Get the raw placement column value (could be text or number)
            const concurrentPlaceRaw = (gender === 'M'
              ? (row['Trap Male Concurrent Place'] || row['Trap Men Concurrent Place'] || row['Trap Concurrent Place'])
              : gender === 'F'
              ? (row['Trap Female Concurrent Place'] || row['Trap Ladies Concurrent Place'] || row['Trap Women Concurrent Place'] || row['Trap Concurrent Place'])
              : row['Trap Concurrent Place']
            )

            // Try parsing as text first
            const placementText = concurrentPlaceRaw?.toString().trim()
            const parsedPlacement = placementText ? parsePlacementText(placementText, gender, athleteDivision) : {}

            // Use parsed values or fall back to numeric parsing
            let concurrentPlace = parsedPlacement.concurrentPlace
            let hoaPlace = parsedPlacement.hoaPlace

            if (!concurrentPlace && concurrentPlaceRaw) {
              const numericValue = parseInt(concurrentPlaceRaw.toString())
              if (!isNaN(numericValue)) {
                concurrentPlace = numericValue
              }
            }

            const classPlace = (gender === 'M'
              ? (row['Trap Male Class Place'] || row['Trap Men Class Place'] || row['Trap Class Place'])
              : gender === 'F'
              ? (row['Trap Female Class Place'] || row['Trap Ladies Class Place'] || row['Trap Women Class Place'] || row['Trap Class Place'])
              : row['Trap Class Place']
            ) ? parseInt((gender === 'M'
              ? (row['Trap Male Class Place'] || row['Trap Men Class Place'] || row['Trap Class Place'])
              : gender === 'F'
              ? (row['Trap Female Class Place'] || row['Trap Ladies Class Place'] || row['Trap Women Class Place'] || row['Trap Class Place'])
              : row['Trap Class Place']
            )) : undefined

            const teamPlace = row['Trap Team Place'] ? parseInt(row['Trap Team Place']) : undefined
            const individualRank = row['Trap Individual Rank'] ? parseInt(row['Trap Individual Rank']) : undefined
            const teamRank = row['Trap Team Rank'] ? parseInt(row['Trap Team Rank']) : undefined
            const teamScore = row['Trap Team Score'] ? parseInt(row['Trap Team Score']) : undefined

            await importSingleScore({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: trapDiscipline.disciplineId,
              totalScore: score,
              maxScore: 100,
              concurrentPlace,
              classPlace,
              teamPlace,
              hoaPlace,
              individualRank,
              teamRank,
              teamScore,
              haaIndividualPlace,
              haaConcurrent
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
          const score = parseFloat(sportingScore.toString().trim())
          if (!isNaN(score) && score > 0) {
            // Track Sporting squad division and team from Excel
            const sportingSquadDivision = row['Sporting Squad Concurrent']?.toString().trim()
            const teamName = row['Team']?.toString().trim() || ''
            if (sportingSquadDivision && teamName) {
              const squadData = athleteSquadData.get(athlete.id) || {}
              squadData.sporting = { division: sportingSquadDivision, team: teamName }
              athleteSquadData.set(athlete.id, squadData)
            }

            // Extract placement data - check for gender-specific columns
            const gender = athlete.gender
            const athleteDivision = athlete.division

            // Get the raw placement column value (could be text or number)
            const concurrentPlaceRaw = (gender === 'M'
              ? (row['Sporting Male Concurrent Place'] || row['Sporting Men Concurrent Place'] || row['Sporting Concurrent Place'])
              : gender === 'F'
              ? (row['Sporting Female Concurrent Place'] || row['Sporting Ladies Concurrent Place'] || row['Sporting Women Concurrent Place'] || row['Sporting Concurrent Place'])
              : row['Sporting Concurrent Place']
            )

            // Try parsing as text first
            const placementText = concurrentPlaceRaw?.toString().trim()
            const parsedPlacement = placementText ? parsePlacementText(placementText, gender, athleteDivision) : {}

            // Use parsed values or fall back to numeric parsing
            let concurrentPlace = parsedPlacement.concurrentPlace
            let hoaPlace = parsedPlacement.hoaPlace

            if (!concurrentPlace && concurrentPlaceRaw) {
              const numericValue = parseInt(concurrentPlaceRaw.toString())
              if (!isNaN(numericValue)) {
                concurrentPlace = numericValue
              }
            }

            const classPlace = (gender === 'M'
              ? (row['Sporting Male Class Place'] || row['Sporting Men Class Place'] || row['Sporting Class Place'])
              : gender === 'F'
              ? (row['Sporting Female Class Place'] || row['Sporting Ladies Class Place'] || row['Sporting Women Class Place'] || row['Sporting Class Place'])
              : row['Sporting Class Place']
            ) ? parseInt((gender === 'M'
              ? (row['Sporting Male Class Place'] || row['Sporting Men Class Place'] || row['Sporting Class Place'])
              : gender === 'F'
              ? (row['Sporting Female Class Place'] || row['Sporting Ladies Class Place'] || row['Sporting Women Class Place'] || row['Sporting Class Place'])
              : row['Sporting Class Place']
            )) : undefined

            const teamPlace = row['Sporting Team Place'] ? parseInt(row['Sporting Team Place']) : undefined
            const individualRank = row['Sporting Individual Rank'] ? parseInt(row['Sporting Individual Rank']) : undefined
            const teamRank = row['Sporting Team Rank'] ? parseInt(row['Sporting Team Rank']) : undefined
            const teamScore = row['Sporting Team Score'] ? parseInt(row['Sporting Team Score']) : undefined

            await importSingleScore({
              athleteId: athlete.id,
              tournamentId,
              disciplineId: sportingDiscipline.disciplineId,
              totalScore: score,
              maxScore: 100,
              concurrentPlace,
              classPlace,
              teamPlace,
              hoaPlace,
              individualRank,
              teamRank,
              teamScore,
              haaIndividualPlace,
              haaConcurrent
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

  // BATCH OPTIMIZATION: Apply all class updates in a transaction
  if (classUpdatesMap.size > 0) {
    await prisma.$transaction(
      Array.from(classUpdatesMap.entries()).map(([athleteId, updates]) =>
        prisma.athlete.update({
          where: { id: athleteId },
          data: updates
        })
      )
    )
  }

  // Update squad divisions and teams based on Excel data
  if (athleteSquadData.size > 0) {
    // Get all squads for this tournament with their members
    const squads = await prisma.squad.findMany({
      where: {
        timeSlot: {
          tournamentId
        }
      },
      include: {
        members: true,
        timeSlot: {
          include: {
            discipline: true
          }
        }
      }
    }) as any[] as Array<{
      id: string
      teamId: string | null
      division: string | null
      capacity: number
      members: { id: string, athleteId: string }[]
      timeSlot: {
        discipline: { name: string }
      }
    }>

    // Get all teams for looking up teamId by name
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true
      }
    })

    const teamByName = new Map(teams.map(t => [t.name.toLowerCase(), t.id]))

    // Update each squad's division and teamId based on its members' Excel data
    const squadUpdates: Array<Promise<any>> = []

    for (const squad of squads) {
      if (squad.members.length === 0) continue

      // Determine the discipline from the time slot
      const disciplineName = squad.timeSlot.discipline.name

      // Find the squad division from any member's Excel data
      let squadDivision: string | null = null

      // Collect all team names from members to check if they're all the same
      const memberTeamNames = new Set<string>()

      for (const member of squad.members) {
        const squadData = athleteSquadData.get(member.athleteId)
        if (squadData) {
          if (disciplineName === 'skeet' && squadData.skeet) {
            if (!squadDivision) squadDivision = squadData.skeet.division
            if (squadData.skeet.team && squadData.skeet.team.toLowerCase() !== 'unaffiliated') {
              memberTeamNames.add(squadData.skeet.team.toLowerCase())
            }
          } else if (disciplineName === 'trap' && squadData.trap) {
            if (!squadDivision) squadDivision = squadData.trap.division
            if (squadData.trap.team && squadData.trap.team.toLowerCase() !== 'unaffiliated') {
              memberTeamNames.add(squadData.trap.team.toLowerCase())
            }
          } else if (disciplineName === 'sporting_clays' && squadData.sporting) {
            if (!squadDivision) squadDivision = squadData.sporting.division
            if (squadData.sporting.team && squadData.sporting.team.toLowerCase() !== 'unaffiliated') {
              memberTeamNames.add(squadData.sporting.team.toLowerCase())
            }
          }
        }
      }

      // Determine teamId
      // Set to null (Unaffiliated) if:
      // 1. Squad is partial (less than capacity), OR
      // 2. Members are from different teams, OR
      // 3. Any member is explicitly marked as "Unaffiliated"
      let teamId: string | null = null
      const isPartialSquad = squad.members.length < squad.capacity
      const hasMixedTeams = memberTeamNames.size > 1
      const hasUnaffiliatedMembers = memberTeamNames.size === 0

      if (!isPartialSquad && !hasMixedTeams && !hasUnaffiliatedMembers && memberTeamNames.size === 1) {
        // All members from same team and squad is full
        const teamName = Array.from(memberTeamNames)[0]
        teamId = teamByName.get(teamName) || null
      }

      // Check if squad needs updating
      const needsUpdate = (squadDivision && squad.division !== squadDivision) ||
                          (squad.teamId !== teamId)

      if (needsUpdate) {
        const updateData: any = {}
        if (squadDivision) updateData.division = squadDivision
        if (squad.teamId !== teamId) updateData.teamId = teamId

        squadUpdates.push(
          prisma.squad.update({
            where: { id: squad.id },
            data: updateData
          })
        )
      }
    }

    // Execute all squad updates
    if (squadUpdates.length > 0) {
      await Promise.all(squadUpdates)
      results.updated.push(`Updated ${squadUpdates.length} squad division(s)`)
    }
  }

  return results
}

async function importSingleScore({
  athleteId,
  tournamentId,
  disciplineId,
  totalScore,
  maxScore,
  concurrentPlace,
  classPlace,
  teamPlace,
  hoaPlace,
  individualRank,
  teamRank,
  teamScore,
  haaIndividualPlace,
  haaConcurrent
}: {
  athleteId: string
  tournamentId: string
  disciplineId: string
  totalScore: number
  maxScore: number
  concurrentPlace?: number
  classPlace?: number
  teamPlace?: number
  hoaPlace?: number
  individualRank?: number
  teamRank?: number
  teamScore?: number
  haaIndividualPlace?: number
  haaConcurrent?: string
}) {
  // Find or create Shoot record with placement data
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
        disciplineId,
        concurrentPlace,
        classPlace,
        teamPlace,
        hoaPlace,
        individualRank,
        teamRank,
        teamScore,
        haaIndividualPlace,
        haaConcurrent
      }
    })
  } else {
    // Update existing shoot with placement data
    shoot = await prisma.shoot.update({
      where: { id: shoot.id },
      data: {
        concurrentPlace,
        classPlace,
        teamPlace,
        hoaPlace,
        individualRank,
        teamRank,
        teamScore,
        haaIndividualPlace,
        haaConcurrent
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
      stationNumber: null,
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
  stationScores,
  concurrentPlace,
  classPlace,
  teamPlace,
  hoaPlace,
  individualRank,
  teamRank,
  teamScore,
  haaIndividualPlace,
  haaConcurrent
}: {
  athleteId: string
  tournamentId: string
  disciplineId: string
  roundScores?: number[]
  stationScores?: number[]
  concurrentPlace?: number
  classPlace?: number
  teamPlace?: number
  hoaPlace?: number
  individualRank?: number
  teamRank?: number
  teamScore?: number
  haaIndividualPlace?: number
  haaConcurrent?: string
}) {
  // Calculate total
  const totalTargets = [...(roundScores || []), ...(stationScores || [])]
    .reduce((sum, score) => sum + score, 0)

  // Find or create Shoot record with placement data
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
        disciplineId,
        concurrentPlace,
        classPlace,
        teamPlace,
        hoaPlace,
        individualRank,
        teamRank,
        teamScore,
        haaIndividualPlace,
        haaConcurrent
      }
    })
  } else {
    // Update existing shoot with placement data
    shoot = await prisma.shoot.update({
      where: { id: shoot.id },
      data: {
        concurrentPlace,
        classPlace,
        teamPlace,
        hoaPlace,
        individualRank,
        teamRank,
        teamScore,
        haaIndividualPlace,
        haaConcurrent
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
        stationNumber: null,
        targets,
        maxTargets: 25
      }))
    })
  }

  if (stationScores && stationScores.length > 0) {
    await prisma.score.createMany({
      data: stationScores.map((targets, idx) => ({
        shootId: shoot.id,
        roundNumber: null,
        stationNumber: idx + 1,
        targets,
        maxTargets: 10 // Varies by station, but 10 is common
      }))
    })
  }
}
