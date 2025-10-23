import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import TournamentList from './TournamentList'

export default async function Home() {
  const user = await getCurrentUser()
  
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
  const tournamentsWithStatus = tournaments.map(tournament => ({
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
            Welcome to Clay Target Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track tournaments, manage scores, and compete with shooters from around the region
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
