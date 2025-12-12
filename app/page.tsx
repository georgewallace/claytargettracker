import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import TournamentList from './TournamentList'
import { demoTournaments } from '@/lib/demoData'

// Force dynamic rendering (required for getCurrentUser)
export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getCurrentUser()
  
  // In demo mode, use mock data
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const tournamentsWithStatus = demoTournaments.map((tournament: any) => ({
      ...tournament,
      isRegistered: false,
      _count: {
        registrations: tournament.registrations?.length || 0,
        shoots: tournament.shoots?.length || 0
      }
    }))
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to COYESS Tournaments
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Register for COYESS Tournaments
            </p>
          </div>

          {/* Demo Mode Notice */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-center">
              🎭 <strong>Demo Mode</strong> - This is a static preview. Tournament details require a live database.
            </p>
          </div>

          {/* Tournaments Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournaments</h2>
          </div>

          {/* Tournament List */}
          <TournamentList tournaments={tournamentsWithStatus} isShooter={false} />
        </div>
      </div>
    )
  }
  
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      createdBy: true,
      disciplines: {
        include: {
          discipline: true
        }
      },
      registrations: user?.shooter ? {
        where: {
          shooterId: user.shooter.id
        },
        select: {
          id: true
        }
      } : false,
      _count: {
        select: {
          registrations: true,
          shoots: true
        }
      }
    }
  })

  // Add registration status to each tournament
  const tournamentsWithStatus = tournaments.map((tournament: any) => ({
    ...tournament,
    isRegistered: user?.shooter && Array.isArray(tournament.registrations) 
      ? tournament.registrations.length > 0 
      : false
  }))

  // Only allow coaches and admins to create tournaments
  const canCreateTournament = user && (user.role === 'coach' || user.role === 'admin')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to COYESS Tournaments
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Register for COYESS Tournaments
          </p>
        </div>

        {/* Tournaments Section */}
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Tournaments</h2>
          {canCreateTournament && (
            <Link
              href="/tournaments/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Create Tournament
            </Link>
          )}
        </div>

        {tournaments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">No tournaments yet. Be the first to create one!</p>
            {canCreateTournament && (
              <Link
                href="/tournaments/create"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition"
              >
                Create Your First Tournament
              </Link>
            )}
          </div>
        ) : (
          <TournamentList 
            tournaments={tournamentsWithStatus} 
            isShooter={!!user?.shooter}
          />
        )}
      </div>
    </div>
  )
}
