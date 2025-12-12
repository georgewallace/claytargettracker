import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get shooter profile
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

    // Auto-calculate division based on grade
    let division = shooter.division
    if (grade) {
      const gradeNum = parseInt(grade)
      if (!isNaN(gradeNum)) {
        if (gradeNum <= 8) division = 'Novice'
        else if (gradeNum === 9) division = 'Intermediate'
        else if (gradeNum === 10) division = 'JV'
        else if (gradeNum >= 11 && gradeNum <= 12) division = 'Senior'
      } else if (grade === 'College') {
        division = 'College'
      }
    }

    // Update shooter profile
    const updatedShooter = await prisma.athlete.update({
      where: { id: shooter.id },
      data: {
        gender,
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

