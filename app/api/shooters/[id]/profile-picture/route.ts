import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('[Profile Picture Upload] Starting upload process...')
    
    const user = await requireAuth()
    console.log('[Profile Picture Upload] User authenticated:', user.id)
    
    const { id } = await params
    console.log('[Profile Picture Upload] Shooter ID:', id)
    
    // Fetch the shooter to check permissions
    const shooter = await prisma.shooter.findUnique({
      where: { id },
      include: {
        team: true
      }
    })

    if (!shooter) {
      console.log('[Profile Picture Upload] Shooter not found')
      return NextResponse.json(
        { error: 'Shooter not found' },
        { status: 404 }
      )
    }

    console.log('[Profile Picture Upload] Shooter found:', shooter.id)

    // Check if user is the shooter themselves, their coach, or an admin
    const isOwnProfile = user.shooter?.id === shooter.id
    const isCoachOfTeam = shooter.team ? await isUserCoachOfTeam(user.id, shooter.team.id) : false
    const isAdmin = user.role === 'admin'

    console.log('[Profile Picture Upload] Permissions check:', { isOwnProfile, isCoachOfTeam, isAdmin })

    if (!isOwnProfile && !isCoachOfTeam && !isAdmin) {
      console.log('[Profile Picture Upload] Permission denied')
      return NextResponse.json(
        { error: 'You do not have permission to upload this profile picture' },
        { status: 403 }
      )
    }

    // Parse form data
    console.log('[Profile Picture Upload] Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('[Profile Picture Upload] No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[Profile Picture Upload] File received:', file.name, file.type, file.size)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log('[Profile Picture Upload] Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      console.log('[Profile Picture Upload] File too large:', file.size)
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles')
    console.log('[Profile Picture Upload] Uploads directory:', uploadsDir)
    
    if (!existsSync(uploadsDir)) {
      console.log('[Profile Picture Upload] Creating uploads directory...')
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${id}-${Date.now()}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)
    
    console.log('[Profile Picture Upload] Saving file to:', filePath)
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    console.log('[Profile Picture Upload] File saved successfully')
    
    // Update shooter with profile picture URL
    const profilePictureUrl = `/uploads/profiles/${fileName}`
    const updatedShooter = await prisma.shooter.update({
      where: { id },
      data: {
        profilePictureUrl
      },
      include: {
        user: true
      }
    })
    
    console.log('[Profile Picture Upload] Database updated successfully')
    
    return NextResponse.json({
      message: 'Profile picture uploaded successfully',
      profilePictureUrl,
      shooter: updatedShooter
    }, { status: 200 })
  } catch (error) {
    console.error('[Profile Picture Upload] ERROR:', error)
    console.error('[Profile Picture Upload] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to upload a profile picture' },
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
    
    // Fetch the shooter to check permissions
    const shooter = await prisma.shooter.findUnique({
      where: { id },
      include: {
        team: true
      }
    })

    if (!shooter) {
      return NextResponse.json(
        { error: 'Shooter not found' },
        { status: 404 }
      )
    }

    // Check if user is the shooter themselves, their coach, or an admin
    const isOwnProfile = user.shooter?.id === shooter.id
    const isCoachOfTeam = shooter.team ? await isUserCoachOfTeam(user.id, shooter.team.id) : false
    const isAdmin = user.role === 'admin'

    if (!isOwnProfile && !isCoachOfTeam && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this profile picture' },
        { status: 403 }
      )
    }

    // Update shooter to remove profile picture
    const updatedShooter = await prisma.shooter.update({
      where: { id },
      data: {
        profilePictureUrl: null
      },
      include: {
        user: true
      }
    })
    
    return NextResponse.json({
      message: 'Profile picture removed successfully',
      shooter: updatedShooter
    }, { status: 200 })
  } catch (error) {
    console.error('Profile picture deletion error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to delete a profile picture' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

