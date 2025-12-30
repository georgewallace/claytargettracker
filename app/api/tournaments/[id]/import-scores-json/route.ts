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

    // Write workbook to buffer to get the same format as file upload
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create a File-like object from the buffer
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const file = new File([blob], 'scores.xlsx')

    // Create FormData and add the file
    const formData = new FormData()
    formData.append('file', file)

    // Forward to the existing import-scores endpoint
    const importUrl = new URL(`/api/tournaments/${tournamentId}/import-scores`, request.url)
    const importRequest = new Request(importUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': request.headers.get('Authorization') || ''
      }
    })

    // Import the route handler
    const { POST: importScores } = await import('../import-scores/route')

    // Call the import endpoint
    return await importScores(importRequest, { params: Promise.resolve({ id: tournamentId }) })

  } catch (error: any) {
    console.error('Error importing scores from JSON:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import scores' },
      { status: 500 }
    )
  }
}
