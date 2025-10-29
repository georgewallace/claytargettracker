import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{
    id: string
    shootOffId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: tournamentId, shootOffId } = await params

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canManage = user.role === 'admin' || tournament.createdById === user.id
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this shoot-off' },
        { status: 403 }
      )
    }

    // Get shoot-off
    const shootOff = await prisma.shootOff.findUnique({
      where: { id: shootOffId }
    })

    if (!shootOff) {
      return NextResponse.json(
        { error: 'Shoot-off not found' },
        { status: 404 }
      )
    }

    if (shootOff.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed shoot-off' },
        { status: 400 }
      )
    }

    if (shootOff.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Shoot-off is already cancelled' },
        { status: 400 }
      )
    }

    // Update status to cancelled
    const updatedShootOff = await prisma.shootOff.update({
      where: { id: shootOffId },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    })

    return NextResponse.json(updatedShootOff)
  } catch (error) {
    console.error('Error cancelling shoot-off:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to cancel a shoot-off' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

