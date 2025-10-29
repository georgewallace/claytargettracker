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

    if (shootOff.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot start shoot-off with status: ${shootOff.status}` },
        { status: 400 }
      )
    }

    // Update status to in_progress
    const updatedShootOff = await prisma.shootOff.update({
      where: { id: shootOffId },
      data: {
        status: 'in_progress',
        startedAt: new Date()
      }
    })

    return NextResponse.json(updatedShootOff)
  } catch (error) {
    console.error('Error starting shoot-off:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'You must be logged in to start a shoot-off' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

