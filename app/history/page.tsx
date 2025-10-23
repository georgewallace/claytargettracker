import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function ShooterHistoryPage() {
  const user = await getCurrentUser()
  
  if (!user || !user.shooter) {
    redirect('/login')
  }

  // Get all shoots for this shooter
  const shoots = await prisma.shoot.findMany({
    where: {
      shooterId: user.shooter.id
    },
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
  })

  // Calculate totals for each shoot
  const shootsWithTotals = shoots.map((shoot: any) => {
    const totalTargets = shoot.scores.reduce((sum: number, score: any) => sum + score.targets, 0)
    const totalPossible = shoot.scores.reduce((sum: number, score: any) => sum + score.totalTargets, 0)
    const percentage = totalPossible > 0 ? ((totalTargets / totalPossible) * 100).toFixed(1) : '0'
    
    return {
      ...shoot,
      totalTargets,
      totalPossible,
      percentage
    }
  })

  // Group by discipline for statistics
  const disciplineStats = shoots.reduce((acc: any, shoot: any) => {
    const disciplineId = shoot.discipline.id
    if (!acc[disciplineId]) {
      acc[disciplineId] = {
        discipline: shoot.discipline,
        totalShoots: 0,
        totalTargets: 0,
        totalPossible: 0
      }
    }
    
    const targets = shoot.scores.reduce((sum: number, score: any) => sum + score.targets, 0)
    const possible = shoot.scores.reduce((sum: number, score: any) => sum + score.totalTargets, 0)
    
    acc[disciplineId].totalShoots++
    acc[disciplineId].totalTargets += targets
    acc[disciplineId].totalPossible += possible
    
    return acc
  }, {} as Record<string, any>)

  const stats = Object.values(disciplineStats).map((stat: any) => ({
    ...stat,
    average: stat.totalPossible > 0 
      ? ((stat.totalTargets / stat.totalPossible) * 100).toFixed(1)
      : '0'
  }))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Shooting History</h1>
          <p className="text-gray-600">Track your progress across all tournaments</p>
        </div>

        {/* Statistics */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat: any) => (
              <div key={stat.discipline.id} className="bg-white rounded-lg shadow-md p-6">
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
        )}

        {/* History Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">All Shoots</h2>
          </div>
          
          {shootsWithTotals.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg mb-4">No shooting history yet.</p>
              <Link 
                href="/"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Browse Tournaments →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tournament
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discipline
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shootsWithTotals.map((shoot) => (
                    <tr key={shoot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(shoot.date), 'PP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/tournaments/${shoot.tournamentId}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {shoot.tournament.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shoot.discipline.displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {shoot.totalTargets} / {shoot.totalPossible}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                          parseFloat(shoot.percentage) >= 90 ? 'bg-green-100 text-green-800' :
                          parseFloat(shoot.percentage) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shoot.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          {shoot.scores.map((score: any) => (
                            <span 
                              key={score.id}
                              className="text-xs text-gray-600"
                              title={`Station ${score.station}: ${score.targets}/${score.totalTargets}`}
                            >
                              {score.targets}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

