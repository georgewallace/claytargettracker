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
      team: true,
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
        orderBy: { date: 'desc' }
      }
    }
  }) : null

  // Calculate shooting statistics if athlete exists
  let shootingStats = null
  if (athlete && athlete.shoots.length > 0) {
    const shootsWithTotals = athlete.shoots.map((shoot: any) => {
      const totalTargets = shoot.scores.reduce((sum: number, score: any) => sum + Math.floor(score.targets), 0)
      const totalPossible = shoot.scores.reduce((sum: number, score: any) => sum + score.maxTargets, 0)
      const percentage = totalPossible > 0 ? (totalTargets / totalPossible) * 100 : 0
      return { ...shoot, totalTargets, totalPossible, percentage }
    })

    const disciplineStats: Record<string, any> = {}
    shootsWithTotals.forEach((shoot: any) => {
      const id = shoot.discipline.id
      if (!disciplineStats[id]) {
        disciplineStats[id] = { discipline: shoot.discipline, totalShoots: 0, totalTargets: 0, totalPossible: 0 }
      }
      disciplineStats[id].totalShoots++
      disciplineStats[id].totalTargets += shoot.totalTargets
      disciplineStats[id].totalPossible += shoot.totalPossible
    })

    shootingStats = {
      totalShoots: shootsWithTotals.length,
      recentShoots: shootsWithTotals.slice(0, 5),
      disciplineStats: Object.values(disciplineStats).map((s: any) => ({
        ...s,
        average: s.totalPossible > 0 ? ((s.totalTargets / s.totalPossible) * 100).toFixed(1) : '0'
      }))
    }
  }

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          </div>
          <span className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {roleLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left column — Account */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Account</h2>
              <AccountSettings user={user} />
            </div>

            {/* Division + Team info for athletes */}
            {athlete && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Info</h2>
                {athlete.division && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Division</span>
                    <span className="text-sm font-semibold text-indigo-700">
                      {athlete.divisionOverride || athlete.division}
                      {athlete.divisionOverride && <span className="ml-1 text-xs text-orange-500">(override)</span>}
                    </span>
                  </div>
                )}
                {athlete.team && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Team</span>
                    <span className="text-sm font-semibold text-gray-900">{athlete.team.name}</span>
                  </div>
                )}
                {shootingStats && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Shoots</span>
                    <span className="text-sm font-semibold text-gray-900">{shootingStats.totalShoots}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column — Shooting profile + stats */}
          <div className="lg:col-span-2 space-y-6">
            {athlete ? (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Shooting Profile</h2>
                  <ProfileForm athlete={athlete} />
                </div>

                {shootingStats && shootingStats.totalShoots > 0 && (
                  <>
                    {/* Discipline stats */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Shooting Statistics</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {shootingStats.disciplineStats.map((stat: any) => (
                          <div key={stat.discipline.id} className="border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-700 mb-2">{stat.discipline.displayName}</p>
                            <div className="text-2xl font-bold text-indigo-600 leading-none">{stat.average}%</div>
                            <div className="mt-2 space-y-0.5 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Shoots</span>
                                <span className="font-medium text-gray-900">{stat.totalShoots}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-medium text-gray-900">{stat.totalTargets} / {stat.totalPossible}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent shoots */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Shoots</h2>
                        <a href="/history" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                          View all →
                        </a>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {shootingStats.recentShoots.map((shoot: any) => (
                          <div key={shoot.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{shoot.tournament.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {shoot.discipline.displayName} • {new Date(shoot.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                              <div className="text-sm font-semibold text-gray-900">
                                {shoot.totalTargets} / {shoot.totalPossible}
                              </div>
                              <div className={`text-xs font-medium ${
                                shoot.percentage >= 90 ? 'text-green-600' :
                                shoot.percentage >= 75 ? 'text-yellow-600' :
                                'text-gray-500'
                              }`}>
                                {shoot.percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No athlete profile attached to this account. Contact an administrator to set one up.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
