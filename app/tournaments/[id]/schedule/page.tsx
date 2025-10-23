import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import ScheduleManager from './ScheduleManager'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// For static export (demo mode)
export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return [
      { id: 'demo-tournament-1' },
      { id: 'demo-tournament-2' },
      { id: 'demo-tournament-3' },
    ]
  }
  return []
}

export default async function TournamentSchedulePage({ params }: PageProps) {
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Tournament Schedule" />
  }
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      disciplines: {
        include: {
          discipline: true
        }
      },
      timeSlots: {
        include: {
          discipline: true,
          squads: true
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ]
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  // Check permissions - only admin or creator can manage schedule
  const canManage = user.role === 'admin' || tournament.createdById === user.id

  if (!canManage) {
    redirect(`/tournaments/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScheduleManager tournament={tournament} />
      </div>
    </div>
  )
}

