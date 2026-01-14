import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import { generateRandomPassword } from '@/lib/passwordUtils'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth()

    // Only admins can reset passwords
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can reset user passwords' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Don't allow resetting your own password via this endpoint
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot reset your own password. Use the account settings page.' },
        { status: 400 }
      )
    }

    // Generate secure random password
    const plainPassword = generateRandomPassword()
    const hashedPassword = await hashPassword(plainPassword)

    // Update user with new password and set mustChangePassword flag
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    // Log this action for audit trail
    console.log(`Admin ${currentUser.email} reset password for user ${updatedUser.email}`)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      temporaryPassword: plainPassword // Only returned once!
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      {
        error: 'Failed to reset user password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
