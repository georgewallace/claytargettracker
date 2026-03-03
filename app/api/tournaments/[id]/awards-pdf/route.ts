import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { uploadToS3, deleteFromS3, extractS3Key, isS3Available } from '@/lib/s3'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can upload awards PDFs' },
        { status: 403 }
      )
    }

    const { id } = await params

    const tournament = await prisma.tournament.findUnique({ where: { id } })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.status !== 'completed') {
      return NextResponse.json(
        { error: 'Awards PDF can only be uploaded for completed tournaments' },
        { status: 400 }
      )
    }

    if (!isS3Available()) {
      return NextResponse.json(
        { error: 'File storage is not configured' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const key = `tournaments/${id}/awards.pdf`

    const awardsUrl = await uploadToS3(key, buffer, 'application/pdf')

    const updated = await prisma.tournament.update({
      where: { id },
      data: { awardsUrl }
    })

    return NextResponse.json({ awardsUrl: updated.awardsUrl }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }
    console.error('Awards PDF upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete awards PDFs' },
        { status: 403 }
      )
    }

    const { id } = await params

    const tournament = await prisma.tournament.findUnique({ where: { id } })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.awardsUrl) {
      const key = extractS3Key(tournament.awardsUrl)
      if (key && isS3Available()) {
        await deleteFromS3(key)
      }
    }

    await prisma.tournament.update({
      where: { id },
      data: { awardsUrl: null }
    })

    return NextResponse.json({ message: 'Awards PDF removed' }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in' },
        { status: 401 }
      )
    }
    console.error('Awards PDF delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
