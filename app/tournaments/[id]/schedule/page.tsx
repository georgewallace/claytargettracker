import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import ScheduleManager from './ScheduleManager'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'

// Force dynamic rendering (required for getCurrentUser)
export const dynamic = 'force-dynamic'

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

  // Filter out time slots that are outside the tournament date range (using string comparison to avoid timezone issues)
  const validTimeSlots = tournament.timeSlots.filter(slot => {
    // Convert dates to YYYY-MM-DD strings for comparison
    const slotDateStr = new Date(slot.date).toISOString().split('T')[0]
    const tournamentStartStr = new Date(tournament.startDate).toISOString().split('T')[0]
    const tournamentEndStr = new Date(tournament.endDate).toISOString().split('T')[0]
    
    const isValid = slotDateStr >= tournamentStartStr && slotDateStr <= tournamentEndStr
    
    // Debug logging
    if (!isValid) {
      console.log(`[SCHEDULE] Filtering out time slot: ${slotDateStr} (tournament range: ${tournamentStartStr} to ${tournamentEndStr})`)
    }
    
    return isValid
  })
  
  // Debug logging
  console.log(`[SCHEDULE] Tournament: ${tournament.name}`)
  console.log(`[SCHEDULE] Date range: ${new Date(tournament.startDate).toISOString().split('T')[0]} to ${new Date(tournament.endDate).toISOString().split('T')[0]}`)
  console.log(`[SCHEDULE] Total time slots in DB: ${tournament.timeSlots.length}`)
  console.log(`[SCHEDULE] Valid time slots after filtering: ${validTimeSlots.length}`)

  // Create a filtered tournament object
  const filteredTournament = {
    ...tournament,
    timeSlots: validTimeSlots
  }

  // Check permissions - only admin or creator can manage schedule
  const canManage = user.role === 'admin' || tournament.createdById === user.id

  if (!canManage) {
    redirect(`/tournaments/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScheduleManager tournament={filteredTournament} />
      </div>
    </div>
  )
}

