import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import ScoreEntry from './ScoreEntry'
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

export default async function TournamentScoresPage({ params }: PageProps) {
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Tournament Scores" />
  }
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Only coaches and admins can enter scores
  if (user.role !== 'coach' && user.role !== 'admin') {
    redirect(`/tournaments/${id}`)
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
          squads: {
            include: {
              members: {
                include: {
                  athlete: {
                    include: {
                      user: true,
                      team: true
                    }
                  }
                },
                orderBy: {
                  position: 'asc'
                }
              }
            },
            orderBy: {
              name: 'asc'
            }
          }
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

  // Check if scores are enabled for this tournament
  if (!tournament.enableScores) {
    redirect(`/tournaments/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <ScoreEntry tournament={tournament as any} />
      </div>
    </div>
  )
}

