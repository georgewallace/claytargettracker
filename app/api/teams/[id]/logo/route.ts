import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { uploadToS3, deleteFromS3, extractS3Key, isS3Available } from '@/lib/s3'

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

    // Validate file size - 5MB for S3, same for local
    const maxSize = 5 * 1024 * 1024 // 5MB
    
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

    // Delete old logo if it exists
    if (team.logoUrl) {
      try {
        const s3Key = extractS3Key(team.logoUrl)
        if (s3Key && isS3Available()) {
          console.log('[Team Logo Upload] Deleting old S3 logo:', s3Key)
          await deleteFromS3(s3Key)
        } else if (team.logoUrl.startsWith('/uploads/')) {
          // Delete from local filesystem
          const oldFilePath = join(process.cwd(), 'public', team.logoUrl)
          if (existsSync(oldFilePath)) {
            console.log('[Team Logo Upload] Deleting old local logo:', oldFilePath)
            await unlink(oldFilePath)
          }
        }
      } catch (error) {
        console.warn('[Team Logo Upload] Failed to delete old logo:', error)
        // Continue with upload even if deletion fails
      }
    }

    if (isS3Available()) {
      // Use S3 for production/staging
      console.log('[Team Logo Upload] Uploading to S3...')
      const fileExtension = file.name.split('.').pop()
      const s3Key = `team-logos/${id}-${Date.now()}.${fileExtension}`
      
      logoUrl = await uploadToS3(s3Key, buffer, file.type)
      console.log('[Team Logo Upload] S3 upload complete:', logoUrl)
    } else {
      // Use local filesystem for development
      console.log('[Team Logo Upload] S3 not configured, using local filesystem')
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'teams')
      
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

    // Delete logo from S3 if applicable
    if (team.logoUrl) {
      try {
        const s3Key = extractS3Key(team.logoUrl)
        if (s3Key && isS3Available()) {
          console.log('[Team Logo Delete] Deleting from S3:', s3Key)
          await deleteFromS3(s3Key)
        } else if (team.logoUrl.startsWith('/uploads/')) {
          // Delete from local filesystem
          const filePath = join(process.cwd(), 'public', team.logoUrl)
          if (existsSync(filePath)) {
            console.log('[Team Logo Delete] Deleting local file:', filePath)
            await unlink(filePath)
          }
        }
      } catch (error) {
        console.warn('[Team Logo Delete] Failed to delete file:', error)
        // Continue with database update even if file deletion fails
      }
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

