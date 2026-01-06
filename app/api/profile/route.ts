import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateDivision } from '@/lib/divisions'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    const body = await request.json()
    const {
      gender,
      birthDay,
      birthMonth,
      birthYear,
      grade,
      nscaClass,
      ataClass,
      nssaClass,
      ataNumber,
      nscaNumber,
      nssaNumber
    } = body

    // Validate required fields
    if (!gender) {
      return NextResponse.json(
        { error: 'Gender is required' },
        { status: 400 }
      )
    }

    // Auto-calculate division based on grade using the standard calculation
    const division = grade ? calculateDivision(grade) : shooter.division

    // Update athlete profile
    const updatedShooter = await prisma.athlete.update({
      where: { id: shooter.id },
      data: {
        gender,
        birthDay: birthDay ? parseInt(birthDay) : null,
        birthMonth: birthMonth ? parseInt(birthMonth) : null,
        birthYear: birthYear ? parseInt(birthYear) : null,
        grade: grade || null,
        division,
        nscaClass: nscaClass || null,
        ataClass: ataClass || null,
        nssaClass: nssaClass || null,
        ataNumber: ataNumber || null,
        nscaNumber: nscaNumber || null,
        nssaNumber: nssaNumber || null
      },
      include: {
        user: true,
        team: true
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      athlete: updatedShooter
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

