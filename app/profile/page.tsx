import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import ProfileForm from './ProfileForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get shooter profile if exists
  const shooter = user.shooter ? await prisma.shooter.findUnique({
    where: { id: user.shooter.id },
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
            orderBy: { station: 'asc' }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }
    }
  }) : null

  // Calculate shooting statistics if shooter exists
  let shootingStats = null
  if (shooter && shooter.shoots.length > 0) {
    const shootsWithTotals = shooter.shoots.map((shoot: any) => {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            {user.name} • {user.email}
          </p>
        </div>

        {shooter ? (
          <>
            <ProfileForm shooter={shooter} />
            {shootingStats && shootingStats.totalShoots > 0 && (
              <div className="mt-8 space-y-8">
                {/* Statistics Cards */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Shooting Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {shootingStats.disciplineStats.map((stat: any) => (
                      <div key={stat.discipline.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {stat.discipline.displayName}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shoots:</span>
                            <span className="font-medium">{stat.totalShoots}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Score:</span>
                            <span className="font-medium">{stat.totalTargets} / {stat.totalPossible}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average:</span>
                            <span className="text-xl font-bold text-indigo-600">{stat.average}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Shoots */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Recent Shoots</h2>
                    <a
                      href="/history"
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      View All →
                    </a>
                  </div>
                  <div className="space-y-3">
                    {shootingStats.recentShoots.map((shoot: any) => (
                      <div key={shoot.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{shoot.tournament.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {shoot.discipline.displayName} • {new Date(shoot.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {shoot.totalTargets} / {shoot.totalPossible}
                          </div>
                          <div className={`text-sm font-medium ${
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
            <p className="text-gray-600">
              You don't have a shooter profile yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

