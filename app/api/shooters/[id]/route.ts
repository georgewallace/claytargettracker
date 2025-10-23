import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calculateDivision } from '@/lib/divisions'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { birthMonth, birthYear, nscaClass, ataClass, grade } = await request.json()
    
    // Check if user is a coach or admin
    if (user.role !== 'coach' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only coaches and admins can update shooter details' },
        { status: 403 }
      )
    }

    // Fetch the shooter to check team association
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

    // If user is a coach (not admin), verify they coach this shooter's team
    if (user.role === 'coach') {
      if (!shooter.team || shooter.team.coachId !== user.id) {
        return NextResponse.json(
          { error: 'You can only update shooters on your team' },
          { status: 403 }
        )
      }
    }

    // Calculate division from grade
    const division = calculateDivision(grade)
    
    // Parse and validate numeric fields
    const parsedBirthMonth = birthMonth && birthMonth !== '' ? parseInt(birthMonth, 10) : null
    const parsedBirthYear = birthYear && birthYear !== '' ? parseInt(birthYear, 10) : null
    
    // Validate parsed values
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
    
    // Update shooter
    const updatedShooter = await prisma.shooter.update({
      where: { id },
      data: {
        birthMonth: parsedBirthMonth,
        birthYear: parsedBirthYear,
        nscaClass: nscaClass && nscaClass.trim() !== '' ? nscaClass.trim() : null,
        ataClass: ataClass && ataClass.trim() !== '' ? ataClass.trim() : null,
        grade: grade && grade.trim() !== '' ? grade.trim() : null,
        division
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

