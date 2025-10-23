import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import ScoreEntryForm from './ScoreEntryForm'
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

export default async function EnterScoresPage({ params }: PageProps) {
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Enter Scores" />
  }
  const { id } = await params
  const user = await getCurrentUser()
  
  if (!user || !user.shooter) {
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
      registrations: {
        where: {
          shooterId: user.shooter.id
        },
        include: {
          disciplines: {
            include: {
              discipline: true
            }
          }
        }
      },
      shoots: {
        where: {
          shooterId: user.shooter.id
        },
        include: {
          discipline: true,
          scores: true
        }
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  // Check if user is registered
  if (tournament.registrations.length === 0) {
    redirect(`/tournaments/${id}`)
  }

  const registration = tournament.registrations[0]
  const registeredDisciplines = registration.disciplines.map(d => d.discipline)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter Scores</h1>
          <p className="text-gray-600 mb-8">{tournament.name}</p>
          
          <ScoreEntryForm 
            tournamentId={tournament.id}
            shooterId={user.shooter.id}
            disciplines={registeredDisciplines}
            existingShoots={tournament.shoots}
          />
        </div>
      </div>
    </div>
  )
}

