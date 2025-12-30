import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// GET /api/admin/athletes - Get all athletes
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only admins can access this endpoint
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      )
    }

    // Fetch all athletes with related data
    const athletes = await prisma.athlete.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { user: { name: 'asc' } }
      ]
    })

    return NextResponse.json(athletes)
  } catch (error: any) {
    console.error('Error fetching athletes:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch athletes' },
      { status: 500 }
    )
  }
}
