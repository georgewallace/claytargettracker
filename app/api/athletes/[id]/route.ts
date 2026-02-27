import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calculateDivision } from '@/lib/divisions'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'



interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { birthDay, birthMonth, birthYear, gender, nscaClass, ataClass, nssaClass, ataNumber, nscaNumber, nssaNumber, grade, divisionOverride, isActive } = await request.json()
    
    // Check if user is a coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can update shooter details' },
        { status: 403 }
      )
    }

    // Fetch the athlete to check team association
    const shooter = await prisma.athlete.findUnique({
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

    // If user is a coach (not admin), verify they coach this athlete's team
    if (user.role === 'coach') {
      if (!shooter.team || !(await isUserCoachOfTeam(user.id, shooter.team.id))) {
        return NextResponse.json(
          { error: 'You can only update shooters on your team' },
          { status: 403 }
        )
      }
    }

    // Calculate division from grade
    const division = calculateDivision(grade)
    
    // Parse and validate numeric fields
    const parsedBirthDay = birthDay && birthDay !== '' ? parseInt(birthDay, 10) : null
    const parsedBirthMonth = birthMonth && birthMonth !== '' ? parseInt(birthMonth, 10) : null
    const parsedBirthYear = birthYear && birthYear !== '' ? parseInt(birthYear, 10) : null

    // Validate parsed values
    if (parsedBirthDay !== null && (isNaN(parsedBirthDay) || parsedBirthDay < 1 || parsedBirthDay > 31)) {
      return NextResponse.json(
        { error: 'Invalid birth day. Must be between 1 and 31.' },
        { status: 400 }
      )
    }

    if (parsedBirthMonth !== null && (isNaN(parsedBirthMonth) || parsedBirthMonth < 1 || parsedBirthMonth > 12)) {
      return NextResponse.json(
        { error: 'Invalid birth month. Must be between 1 and 12.' },
        { status: 400 }
      )
    }

    if (parsedBirthYear !== null && (isNaN(parsedBirthYear) || parsedBirthYear < 1900 || parsedBirthYear > new Date().getFullYear())) {
      return NextResponse.json(
        { error: 'Invalid birth year.' },
        { status: 400 }
      )
    }
    
    // Update athlete
    const updatedShooter = await prisma.athlete.update({
      where: { id },
      data: {
        birthDay: parsedBirthDay,
        birthMonth: parsedBirthMonth,
        birthYear: parsedBirthYear,
        gender: gender && gender.trim() !== '' ? gender.trim() : null,
        nscaClass: nscaClass && nscaClass.trim() !== '' ? nscaClass.trim() : null,
        ataClass: ataClass && ataClass.trim() !== '' ? ataClass.trim() : null,
        nssaClass: nssaClass && nssaClass.trim() !== '' ? nssaClass.trim() : null,
        ataNumber: ataNumber && ataNumber.trim() !== '' ? ataNumber.trim() : null,
        nscaNumber: nscaNumber && nscaNumber.trim() !== '' ? nscaNumber.trim() : null,
        nssaNumber: nssaNumber && nssaNumber.trim() !== '' ? nssaNumber.trim() : null,
        grade: grade && grade.trim() !== '' ? grade.trim() : null,
        division,
        divisionOverride: divisionOverride && divisionOverride.trim() !== '' ? divisionOverride.trim() : null,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        user: true,
        team: true
      }
    })
    
    return NextResponse.json(updatedShooter, { status: 200 })
  } catch (error) {
    console.error('Shooter update error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to update shooter details' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

