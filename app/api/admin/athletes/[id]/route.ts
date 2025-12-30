import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calculateDivision } from '@/lib/divisions'

// PATCH /api/admin/athletes/[id] - Update athlete information
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    // Only admins can update athletes
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Extract fields from request
    const {
      divisionOverride,
      grade,
      birthMonth,
      birthDay,
      birthYear
    } = body

    // Validate athlete exists
    const existingAthlete = await prisma.athlete.findUnique({
      where: { id }
    })

    if (!existingAthlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      )
    }

    // Calculate new division based on grade if grade is being updated
    let newDivision = existingAthlete.division
    if (grade !== undefined) {
      newDivision = calculateDivision(grade)
    }

    // Update athlete
    const updatedAthlete = await prisma.athlete.update({
      where: { id },
      data: {
        divisionOverride: divisionOverride === null ? null : divisionOverride || undefined,
        grade: grade === null ? null : grade || undefined,
        division: newDivision || undefined,
        birthMonth: birthMonth === null ? null : birthMonth || undefined,
        birthDay: birthDay === null ? null : birthDay || undefined,
        birthYear: birthYear === null ? null : birthYear || undefined
      },
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
      }
    })

    return NextResponse.json(updatedAthlete)
  } catch (error: any) {
    console.error('Error updating athlete:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update athlete' },
      { status: 500 }
    )
  }
}
