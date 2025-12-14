import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import SquadManager from './SquadManager'
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

export default async function TournamentSquadsPage({ params }: PageProps) {
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Tournament Squads" />
  }
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Only coaches and admins can manage squads
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
      },
      registrations: {
        include: {
          athlete: {
            include: {
              user: true,
              team: true
            }
          },
          disciplines: {
            include: {
              discipline: true,
              timeSlotPreferences: {
                include: {
                  timeSlot: {
                    include: {
                      discipline: true
                    }
                  }
                },
                orderBy: {
                  preference: 'asc'
                }
              }
            }
          }
        }
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  // Get coach's team if user is a coach
  let coachedTeamId: string | null = null
  if (user.role === 'coach') {
    const teamCoach = await prisma.teamCoach.findFirst({
      where: { userId: user.id },
      select: { teamId: true }
    })
    coachedTeamId = teamCoach?.teamId || null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <SquadManager tournament={tournament} userRole={user.role} coachedTeamId={coachedTeamId} />
      </div>
    </div>
  )
}

