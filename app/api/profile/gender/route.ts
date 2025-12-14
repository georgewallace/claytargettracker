import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Update athlete's own gender
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { gender } = await request.json()

    // Validation
    if (!gender || !['Male', 'Female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Invalid gender value' },
        { status: 400 }
      )
    }

    // Get athlete profile
    const shooter = await prisma.athlete.findUnique({
      where: { userId: user.id }
    })

    if (!shooter) {
      return NextResponse.json(
        { error: 'Shooter profile not found' },
        { status: 404 }
      )
    }

    // Update gender
    await prisma.athlete.update({
      where: { id: shooter.id },
      data: { gender }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating gender:', error)
    return NextResponse.json(
      { error: 'Failed to update gender' },
      { status: 500 }
    )
  }
}

