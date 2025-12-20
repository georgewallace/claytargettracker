import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only admins can promote users
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can promote users' },
        { status: 403 }
      )
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'coach', 'athlete'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, coach, or athlete' },
        { status: 400 }
      )
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Promote user error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
