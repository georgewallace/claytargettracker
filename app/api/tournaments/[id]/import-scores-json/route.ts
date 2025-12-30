import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthWithApiKey } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthWithApiKey()
    const { id: tournamentId } = await params

    // Only admins can import scores
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can import scores' },
        { status: 403 }
      )
    }

    // Get JSON data from request body
    const body = await request.json()
    const { sheets } = body

    if (!sheets) {
      return NextResponse.json(
        { error: 'No sheet data provided' },
        { status: 400 }
      )
    }

    // Create a workbook from the JSON data
    const workbook = XLSX.utils.book_new()

    // Add each sheet to the workbook
    for (const sheetName in sheets) {
      const sheetData = sheets[sheetName]
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    }

    // Process the workbook (same logic as import-scores endpoint)
    // Update tournament configuration from Tournament Setup sheet if it exists
    const tournamentSetupSheet = workbook.Sheets['Tournament Setup']
    if (tournamentSetupSheet) {
      const setupData = XLSX.utils.sheet_to_json(tournamentSetupSheet, { header: 1, defval: '' }) as any[]

      const haaOverallPlaces = setupData[20]?.[1] || 2
      const haaMenPlaces = setupData[21]?.[1] || 2
      const haaLadyPlaces = setupData[22]?.[1] || 2
      const hoaOverallPlaces = setupData[26]?.[1] || 0
      const hoaMenPlaces = setupData[27]?.[1] || 2
      const hoaLadyPlaces = setupData[28]?.[1] || 2

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

    // Check for Shooter History or Shooter Scores sheet
    const shooterHistorySheet = workbook.Sheets['Shooter History']
    const shooterScoresSheet = workbook.Sheets['Shooter Scores']

    if (!shooterHistorySheet && !shooterScoresSheet) {
      return NextResponse.json(
        { error: 'Import failed: Excel data must contain a sheet named "Shooter History" or "Shooter Scores"' },
        { status: 400 }
      )
    }

    // Check if both sheets exist with data
    if (shooterHistorySheet && shooterScoresSheet) {
      const historyData = XLSX.utils.sheet_to_json(shooterHistorySheet)
      const scoresData = XLSX.utils.sheet_to_json(shooterScoresSheet)

      if (historyData.length > 0 && scoresData.length > 0) {
        return NextResponse.json(
          { error: 'Import failed: Data contains both "Shooter History" and "Shooter Scores" sheets with data. Please remove one of them.' },
          { status: 400 }
        )
      }
    }

    // Determine which sheet to use
    let data: any[] = []
    if (shooterHistorySheet) {
      const historyData = XLSX.utils.sheet_to_json(shooterHistorySheet)
      if (historyData.length > 0) {
        data = historyData
      }
    }

    if (data.length === 0 && shooterScoresSheet) {
      let scoresData = XLSX.utils.sheet_to_json(shooterScoresSheet)

      // Check for valid headers
      if (scoresData.length > 0) {
        const firstRow = scoresData[0] as Record<string, any>
        const hasValidHeaders = firstRow && (
          'Shooter ID' in firstRow ||
          'First Name' in firstRow ||
          'Last Name' in firstRow
        )

        if (!hasValidHeaders) {
          scoresData = XLSX.utils.sheet_to_json(shooterScoresSheet, { range: 1 })
        }
      }

      if (scoresData.length > 0) {
        data = scoresData
      }
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Import failed: No data found in Shooter History or Shooter Scores sheets' },
        { status: 400 }
      )
    }

    // Write the workbook to a buffer and create a file to pass to the import endpoint
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create a new NextRequest with the workbook buffer as form data
    const formData = new FormData()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const file = new File([blob], 'scores.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    formData.append('file', file)

    // Create a new request with the form data
    const importRequest = new NextRequest(new URL(`/api/tournaments/${tournamentId}/import-scores`, request.url), {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': request.headers.get('Authorization') || ''
      }
    })

    // Call the import endpoint directly
    const { POST: importScores } = await import('../import-scores/route')
    return await importScores(importRequest, { params: Promise.resolve({ id: tournamentId }) })

  } catch (error: any) {
    console.error('Error importing scores from JSON:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import scores' },
      { status: 500 }
    )
  }
}
