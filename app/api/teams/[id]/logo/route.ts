import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Check if running in serverless environment (AWS Amplify, Vercel, etc.)
const isServerless = process.env.AWS_EXECUTION_ENV || process.env.VERCEL || process.env.NODE_ENV === 'production'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('[Team Logo Upload] Starting upload process...')
    
    const user = await requireAuth()
    console.log('[Team Logo Upload] User authenticated:', user.id)
    
    const { id } = await params
    console.log('[Team Logo Upload] Team ID:', id)
    
    // Fetch the team to check permissions
    const team = await prisma.team.findUnique({
      where: { id }
    })

    if (!team) {
      console.log('[Team Logo Upload] Team not found')
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    console.log('[Team Logo Upload] Team found:', team.id)

    // Check if user is a coach of this team or an admin
    const isCoach = await isUserCoachOfTeam(user.id, team.id)
    const isAdmin = user.role === 'admin'

    console.log('[Team Logo Upload] Permissions check:', { isCoach, isAdmin })

    if (!isCoach && !isAdmin) {
      console.log('[Team Logo Upload] Permission denied')
      return NextResponse.json(
        { error: 'You do not have permission to upload this team logo' },
        { status: 403 }
      )
    }

    // Parse form data
    console.log('[Team Logo Upload] Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('[Team Logo Upload] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[Team Logo Upload] File received:', file.name, file.type, file.size)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('[Team Logo Upload] Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      console.log('[Team Logo Upload] File too large:', file.size)
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    let logoUrl: string

    if (isServerless) {
      // For serverless environments (AWS Amplify): store as base64 data URL
      console.log('[Team Logo Upload] Using base64 data URL for serverless environment')
      const base64 = buffer.toString('base64')
      logoUrl = `data:${file.type};base64,${base64}`
      console.log('[Team Logo Upload] Base64 encoding complete')
    } else {
      // For local development: save to filesystem
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'teams')
      console.log('[Team Logo Upload] Uploads directory:', uploadsDir)
      
      if (!existsSync(uploadsDir)) {
        console.log('[Team Logo Upload] Creating uploads directory...')
        await mkdir(uploadsDir, { recursive: true })
      }

      const fileExtension = file.name.split('.').pop()
      const fileName = `${id}-${Date.now()}.${fileExtension}`
      const filePath = join(uploadsDir, fileName)
      
      console.log('[Team Logo Upload] Saving file to:', filePath)
      await writeFile(filePath, buffer)
      console.log('[Team Logo Upload] File saved successfully')
      
      logoUrl = `/uploads/teams/${fileName}`
    }
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        logoUrl
      }
    })
    
    console.log('[Team Logo Upload] Database updated successfully')
    
    return NextResponse.json({
      message: 'Team logo uploaded successfully',
      logoUrl,
      team: updatedTeam
    }, { status: 200 })
  } catch (error) {
    console.error('[Team Logo Upload] ERROR:', error)
    console.error('[Team Logo Upload] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to upload a team logo' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    // Fetch the team to check permissions
    const team = await prisma.team.findUnique({
      where: { id }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Check if user is a coach of this team or an admin
    const isCoach = await isUserCoachOfTeam(user.id, team.id)
    const isAdmin = user.role === 'admin'

    if (!isCoach && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this team logo' },
        { status: 403 }
      )
    }

    // Update team to remove logo
    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        logoUrl: null
      }
    })
    
    return NextResponse.json({
      message: 'Team logo removed successfully',
      team: updatedTeam
    }, { status: 200 })
  } catch (error) {
    console.error('Team logo deletion error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to delete a team logo' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

