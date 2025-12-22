import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import * as XLSX from 'xlsx'
import { calculateDivision } from '@/lib/divisions'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only admins can bulk import
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can bulk import users' },
        { status: 403 }
      )
    }

    // Get form data with file
    const formData = await request.formData()
    const file = formData.get('file') as File
    const importType = formData.get('type') as string // 'athletes' or 'coaches'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!importType || !['athletes', 'coaches'].includes(importType)) {
      return NextResponse.json(
        { error: 'Invalid import type. Must be "athletes" or "coaches"' },
        { status: 400 }
      )
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)

    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) {
      return NextResponse.json(
        { error: 'No sheet found in Excel file' },
        { status: 400 }
      )
    }

    // Parse to JSON
    const data = XLSX.utils.sheet_to_json(sheet)

    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[],
      created: [] as string[]
    }

    if (importType === 'athletes') {
      await processAthleteImport(data, results)
    } else {
      await processCoachImport(data, results)
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      {
        error: 'Failed to import users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function processAthleteImport(data: any[], results: any) {
  for (const row of data) {
    try {
      const firstName = row['First Name']?.toString().trim()
      const lastName = row['Last Name']?.toString().trim()
      const email = row['Email']?.toString().trim().toLowerCase()
      const teamName = row['Team']?.toString().trim()
      const grade = row['Grade']?.toString().trim()
      const gender = row['Gender']?.toString().trim().toLowerCase()
      const nscaClass = row['NSCA Class']?.toString().trim()
      const ataClass = row['ATA Class']?.toString().trim()
      const nssaClass = row['NSSA Class']?.toString().trim()
      const shooterId = row['Shooter ID']?.toString().trim()

      if (!firstName || !lastName) {
        results.skipped++
        continue
      }

      const name = `${firstName} ${lastName}`

      // Check if user already exists by email
      const existingUserCheck = email ? await prisma.user.findUnique({
        where: { email },
        include: { athlete: true }
      }) : null

      // Skip if user exists and already has athlete profile
      if (existingUserCheck?.athlete) {
        results.skipped++
        continue
      }

      // Find or create team
      let team = null
      if (teamName) {
        team = await prisma.team.findFirst({
          where: { name: teamName }
        })

        if (!team) {
          team = await prisma.team.create({
            data: { name: teamName }
          })
        }
      }

      // Get or create user
      let userId: string
      if (existingUserCheck) {
        userId = existingUserCheck.id
      } else {
        // Create a placeholder user
        const userEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@placeholder.local`
        const defaultPassword = await hashPassword('ChangeMe123!')

        const newUser = await prisma.user.create({
          data: {
            email: userEmail,
            name,
            password: defaultPassword,
            role: 'athlete'
          }
        })
        userId = newUser.id
      }

      // Calculate division
      const division = calculateDivision(grade)

      // Normalize gender to M/F format (accept both old and new formats)
      let normalizedGender: string | null = null
      if (gender === 'M' || gender === 'male') normalizedGender = 'M'
      else if (gender === 'F' || gender === 'female') normalizedGender = 'F'

      // Create athlete profile
      await prisma.athlete.create({
        data: {
          userId,
          teamId: team?.id || null,
          grade: grade || null,
          gender: normalizedGender,
          division,
          nscaClass: nscaClass || null,
          ataClass: ataClass || null,
          nssaClass: nssaClass || null,
          shooterId: shooterId || null,
          isActive: true
        }
      })

      results.created.push(name)
      results.success++

    } catch (error) {
      const name = `${row['First Name']} ${row['Last Name']}` || 'Unknown'
      results.errors.push(`Error processing ${name}: ${error}`)
    }
  }
}

async function processCoachImport(data: any[], results: any) {
  for (const row of data) {
    try {
      const firstName = row['First Name']?.toString().trim()
      const lastName = row['Last Name']?.toString().trim()
      const email = row['Email']?.toString().trim().toLowerCase()
      const teamName = row['Team']?.toString().trim()

      if (!firstName || !lastName || !teamName) {
        results.skipped++
        continue
      }

      const name = `${firstName} ${lastName}`

      // Check if user already exists by email
      let existingUser = email ? await prisma.user.findUnique({
        where: { email }
      }) : null

      // Find or create team
      let team = await prisma.team.findFirst({
        where: { name: teamName }
      })

      if (!team) {
        team = await prisma.team.create({
          data: { name: teamName }
        })
      }

      // Check if already a coach for this team
      if (existingUser) {
        const existingCoach = await prisma.teamCoach.findFirst({
          where: {
            userId: existingUser.id,
            teamId: team.id
          }
        })

        if (existingCoach) {
          results.skipped++
          continue
        }
      }

      // If user doesn't exist, create a placeholder user
      if (!existingUser) {
        const userEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@placeholder.local`
        const defaultPassword = await hashPassword('ChangeMe123!')

        existingUser = await prisma.user.create({
          data: {
            email: userEmail,
            name,
            password: defaultPassword,
            role: 'coach'
          }
        })
      } else if (existingUser && existingUser.role === 'athlete') {
        // Upgrade athlete to coach
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'coach' }
        })
      }

      // Create coach relationship
      await prisma.teamCoach.create({
        data: {
          userId: existingUser.id,
          teamId: team.id,
          role: 'coach'
        }
      })

      results.created.push(`${name} - ${teamName}`)
      results.success++

    } catch (error) {
      const name = `${row['First Name']} ${row['Last Name']}` || 'Unknown'
      results.errors.push(`Error processing ${name}: ${error}`)
    }
  }
}
