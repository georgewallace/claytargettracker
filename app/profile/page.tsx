import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import ProfileForm from './ProfileForm'
import AccountSettings from './AccountSettings'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get athlete profile if exists
  const athlete = user.athlete ? await prisma.athlete.findUnique({
    where: { id: user.athlete.id },
    include: {
      user: true,
      team: {
        include: {
          coaches: {
            include: {
              user: true
            }
          }
        }
      },
      shoots: {
        include: {
          tournament: true,
          discipline: true,
          scores: {
            orderBy: [
              { roundNumber: 'asc' },
              { stationNumber: 'asc' }
            ]
          }
        },
        orderBy: {
          date: 'desc'
        }
      }
    }
  }) : null

  // Calculate shooting statistics if athlete exists
  let shootingStats = null
  if (athlete && athlete.shoots.length > 0) {
    const shootsWithTotals = athlete.shoots.map((shoot: any) => {
      const totalTargets = shoot.scores.reduce((sum: number, score: any) => sum + score.targets, 0)
      const totalPossible = shoot.scores.reduce((sum: number, score: any) => sum + score.totalTargets, 0)
      const percentage = totalPossible > 0 ? ((totalTargets / totalPossible) * 100) : 0
      
      return {
        ...shoot,
        totalTargets,
        totalPossible,
        percentage
      }
    })

    // Group by discipline for statistics
    const disciplineStats: Record<string, any> = {}
    
    shootsWithTotals.forEach((shoot: any) => {
      const disciplineId = shoot.discipline.id
      if (!disciplineStats[disciplineId]) {
        disciplineStats[disciplineId] = {
          discipline: shoot.discipline,
          totalShoots: 0,
          totalTargets: 0,
          totalPossible: 0
        }
      }
      
      disciplineStats[disciplineId].totalShoots++
      disciplineStats[disciplineId].totalTargets += shoot.totalTargets
      disciplineStats[disciplineId].totalPossible += shoot.totalPossible
    })

    const stats = Object.values(disciplineStats).map((stat: any) => ({
      ...stat,
      average: stat.totalPossible > 0 
        ? ((stat.totalTargets / stat.totalPossible) * 100).toFixed(1)
        : '0'
    }))

    shootingStats = {
      totalShoots: shootsWithTotals.length,
      recentShoots: shootsWithTotals.slice(0, 5),
      disciplineStats: stats
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
          <p className="text-sm text-gray-600">
            {user.name} • {user.email} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </p>
        </div>

        {/* Account Settings - Available to all users */}
        <div className="mb-4">
          <AccountSettings user={user} />
        </div>

        {/* Athlete Profile - Only for users with athlete profiles */}
        {athlete ? (
          <>
            <ProfileForm athlete={athlete} />
            {shootingStats && shootingStats.totalShoots > 0 && (
              <div className="mt-4 space-y-4">
                {/* Statistics Cards */}
                <div className="bg-white rounded-lg shadow-md p-3">
                  <h2 className="text-base font-bold text-gray-900 mb-3">Shooting Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {shootingStats.disciplineStats.map((stat: any) => (
                      <div key={stat.discipline.id} className="border border-gray-200 rounded-lg p-2">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                          {stat.discipline.displayName}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Shoots:</span>
                            <span className="font-medium">{stat.totalShoots}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">{stat.totalTargets} / {stat.totalPossible}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-600">Avg:</span>
                            <span className="text-lg font-bold text-indigo-600">{stat.average}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Shoots */}
                <div className="bg-white rounded-lg shadow-md p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-900">Recent Shoots</h2>
                    <a
                      href="/history"
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                    >
                      View All →
                    </a>
                  </div>
                  <div className="space-y-2">
                    {shootingStats.recentShoots.map((shoot: any) => (
                      <div key={shoot.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{shoot.tournament.name}</div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {shoot.discipline.displayName} • {new Date(shoot.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-sm font-semibold text-gray-900">
                            {shoot.totalTargets} / {shoot.totalPossible}
                          </div>
                          <div className={`text-xs font-medium ${
                            shoot.percentage >= 90 ? 'text-green-600' :
                            shoot.percentage >= 75 ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {shoot.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">
              You don't have a athlete profile yet.
            </p>
            {(user.role === 'coach' || user.role === 'admin') && (
              <p className="text-gray-500 text-sm">
                As a {user.role}, you can manage tournaments and teams without a athlete profile. 
                If you'd like to compete in tournaments, please contact an administrator to set up your athlete profile.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

