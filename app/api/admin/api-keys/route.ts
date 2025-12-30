import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { generateApiKey, maskApiKey } from '@/lib/apiKeyUtils'

// GET /api/admin/api-keys - List all API keys
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only admins can manage API keys
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    // Fetch all API keys with user information
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Mask the keys for security
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: maskApiKey(key.key)
    }))

    return NextResponse.json(maskedKeys)
  } catch (error) {
    console.error('Error fetching API keys:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST /api/admin/api-keys - Generate new API key
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only admins can create API keys
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, expiresInDays } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }

    // Generate unique API key
    const apiKey = generateApiKey()

    // Calculate expiration date if specified
    let expiresAt: Date | null = null
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Create API key in database
    const newApiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: apiKey,
        userId: user.id,
        expiresAt
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Return the full key only once (for copying)
    // Include a masked version for display
    return NextResponse.json({
      ...newApiKey,
      fullKey: apiKey, // Only shown once
      key: maskApiKey(apiKey) // Masked version for future display
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating API key:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
