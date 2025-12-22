import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { format } from 'date-fns'
import Link from 'next/link'
import RegisterButton from './RegisterButton'
import CoachRegistration from './CoachRegistration'
import ExportRegistrationsButton from './ExportRegistrationsButton'
import ExportComprehensiveButton from './ExportComprehensiveButton'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'
import RegistrationList from './RegistrationList'
import ImportScoresButton from './ImportScoresButton'

// Force dynamic rendering (required for getCurrentUser and dynamic params)
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

// Format date without timezone shifts - extract YYYY-MM-DD and create date at noon UTC
function parseDateSafe(date: Date) {
  const dateStr = new Date(date).toISOString().split('T')[0]
  return new Date(`${dateStr}T12:00:00.000Z`)
}

export default async function TournamentDetailPage({ params }: PageProps) {
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Tournament Details" />
  }
  const { id } = await params
  const user = await getCurrentUser()
  
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      createdBy: true,
      disciplines: {
        include: {
          discipline: true
        }
      },
      registrations: {
        include: {
          athlete: {
            include: {
              user: true,
              team: true,
              squadMembers: {
                include: {
                  squad: {
                    include: {
                      timeSlot: {
                        include: {
                          discipline: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          disciplines: {
            include: {
              discipline: true,
              timeSlotPreferences: {
                include: {
                  timeSlot: true
                },
                orderBy: {
                  preference: 'asc'
                }
              }
            }
          }
        }
      },
      shoots: {
        include: {
          athlete: {
            include: {
              user: true,
              team: true
            }
          },
          discipline: true,
          scores: true
        }
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  // Get athletes for coach registration based on role
  let allathletes: any[] = []

  if (user?.role === 'coach') {
    // Coaches can only register athletes from teams they coach
    const coachedTeams = await prisma.teamCoach.findMany({
      where: { userId: user.id },
      select: { teamId: true }
    })

    const teamIds = coachedTeams.map(tc => tc.teamId)

    allathletes = await prisma.athlete.findMany({
      where: {
        teamId: { in: teamIds },
        isActive: { not: false } // Only include active athletes
      },
      include: {
        user: true,
        team: true
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })
  } else if (user?.role === 'admin') {
    // Admins can register any athlete
    allathletes = await prisma.athlete.findMany({
      where: {
        isActive: { not: false } // Only include active athletes
      },
      include: {
        user: true,
        team: true
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })
  }

  const registeredathleteIds = tournament.registrations.map(r => r.athleteId)
  const isCoach = user?.role === 'coach' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  // Check if coach's team is registered for this tournament
  // Include admins who also coach a team
  let isTeamRegistered = false
  if (user?.role === 'coach' || user?.role === 'admin') {
    const coachedTeams = await prisma.teamCoach.findMany({
      where: { userId: user.id },
      select: { teamId: true }
    })

    if (coachedTeams.length > 0) {
      const firstTeamId = coachedTeams[0].teamId
      const teamRegistration = await prisma.teamTournamentRegistration.findUnique({
        where: {
          teamId_tournamentId: {
            teamId: firstTeamId,
            tournamentId: tournament.id
          }
        }
      })
      isTeamRegistered = !!teamRegistration
    }
  }

  // Check if current user is registered
  const isRegistered = user?.athlete && tournament.registrations.some(
    reg => reg.athleteId === user.athlete?.id
  )

  // Filter registrations based on role
  // Coaches only see their team's athletes, admins see all
  const visibleRegistrations = user?.role === 'admin'
    ? tournament.registrations
    : user?.role === 'coach'
    ? tournament.registrations.filter(reg => {
        // Get coach's team IDs
        const coachedTeams = allathletes.map(a => a.teamId).filter(Boolean)
        return reg.athlete.teamId && coachedTeams.includes(reg.athlete.teamId)
      })
    : [] // Athletes see none (they have their own view)

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      finalizing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return badges[status as keyof typeof badges] || badges.upcoming
  }

  // Get athlete's registration if they are registered
  const athleteRegistration = user?.athlete
    ? tournament.registrations.find(reg => reg.athleteId === user.athlete?.id)
    : null

  // Get athlete's squad assignments
  const athleteSquads = athleteRegistration && user?.athlete
    ? await prisma.squadMember.findMany({
        where: {
          athleteId: user.athlete.id,
          squad: {
            timeSlot: {
              tournamentId: tournament.id
            }
          }
        },
        include: {
          squad: {
            include: {
              timeSlot: {
                include: {
                  discipline: true
                }
              }
            }
          }
        },
        orderBy: {
          squad: {
            timeSlot: {
              date: 'asc'
            }
          }
        }
      })
    : []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Tournaments Button */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tournaments
          </Link>
        </div>

        {/* Coach Registration */}
        {isCoach && tournament.status === 'upcoming' && (
          <CoachRegistration
            tournamentId={tournament.id}
            allathletes={allathletes}
            registeredathleteIds={registeredathleteIds}
            tournamentDisciplines={tournament.disciplines.map(td => td.discipline)}
            userRole={user?.role as 'coach' | 'admin'}
            isTeamRegistered={isTeamRegistered}
          />
        )}

        {/* Tournament Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8 mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {tournament.name}
              </h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(tournament.status)}`}>
                {tournament.status}
              </span>
            </div>
            
            {/* Action Buttons - Responsive Grid */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {/* Leaderboard button - visible to everyone when enabled */}
              {tournament.enableLeaderboard && (
                <Link
                  href={`/tournaments/${tournament.id}/leaderboard`}
                  className="bg-yellow-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition font-medium text-sm sm:text-base whitespace-nowrap"
                >
                  🏆 Leaderboard
                </Link>
              )}

              {/* Import Scores button for admins when enabled */}
              {tournament.enableScores && user && user.role === 'admin' && (
                <ImportScoresButton tournamentId={tournament.id} />
              )}

              {/* Manage Squads button for coaches and admins */}
              {user && (user.role === 'coach' || user.role === 'admin') && (
                <Link
                  href={`/tournaments/${tournament.id}/squads`}
                  className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition font-medium text-sm sm:text-base whitespace-nowrap"
                >
                  Manage Squads
                </Link>
              )}
              
              {/* Schedule button for admin or creator */}
              {user && (user.role === 'admin' || tournament.createdById === user.id) && (
                <>
                  <Link
                    href={`/tournaments/${tournament.id}/schedule`}
                    className="bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium text-sm sm:text-base whitespace-nowrap"
                  >
                    Manage Schedule
                  </Link>
                  {tournament.enableShootOffs && (
                    <Link
                      href={`/tournaments/${tournament.id}/shoot-offs`}
                      className="bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition font-medium text-sm sm:text-base whitespace-nowrap"
                    >
                      Shoot-Offs
                    </Link>
                  )}
                  <ExportRegistrationsButton
                    registrations={tournament.registrations}
                    tournamentName={tournament.name}
                  />
                  <ExportComprehensiveButton
                    tournamentId={tournament.id}
                    tournamentName={tournament.name}
                  />
                  <Link
                    href={`/tournaments/${tournament.id}/edit`}
                    className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition font-medium text-sm sm:text-base whitespace-nowrap"
                  >
                    Edit Tournament
                  </Link>
                </>
              )}
              
              {/* Register button for athletes */}
              {user && user.athlete && !isRegistered && (tournament.status === 'upcoming' || tournament.status === 'active') && (
                <RegisterButton
                  tournamentId={tournament.id}
                  athleteId={user.athlete.id}
                  tournamentDisciplines={tournament.disciplines.map(td => td.discipline)}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <span className="font-semibold mr-2">📍 Location:</span>
                {tournament.location}
              </div>
              <div className="flex items-center text-gray-700">
                <span className="font-semibold mr-2">📅 Date:</span>
                {parseDateSafe(tournament.startDate).getTime() === parseDateSafe(tournament.endDate).getTime() ? (
                  format(parseDateSafe(tournament.startDate), 'PPP')
                ) : (
                  <>
                    {format(parseDateSafe(tournament.startDate), 'PPP')} - {format(parseDateSafe(tournament.endDate), 'PPP')}
                  </>
                )}
              </div>
              <div className="flex items-center text-gray-700">
                <span className="font-semibold mr-2">👥 Registered:</span>
                {tournament.registrations.length} athletes
              </div>
              <div className="flex items-center text-gray-700">
                <span className="font-semibold mr-2">👤 Organizer:</span>
                {tournament.createdBy.name}
              </div>
            </div>

            {tournament.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{tournament.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Athlete Registration View - Only for registered athletes */}
        {user?.athlete && athleteRegistration && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Registration</h2>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
                ✓ Registered
              </span>
            </div>

            {/* Registered Disciplines */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Disciplines</h3>
              <div className="flex flex-wrap gap-2">
                {athleteRegistration.disciplines.map((rd) => (
                  <span
                    key={rd.id}
                    className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-medium"
                  >
                    {rd.discipline.displayName}
                  </span>
                ))}
              </div>
            </div>

            {/* Time Slot Preferences */}
            {athleteRegistration.disciplines.some(d => d.timeSlotPreferences && d.timeSlotPreferences.length > 0) && (
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Time Preferences</h3>
                {athleteRegistration.disciplines.map((rd) => {
                  if (!rd.timeSlotPreferences || rd.timeSlotPreferences.length === 0) return null

                  // Group preferences by time and get the lowest preference value for each time
                  const groupedPrefs = rd.timeSlotPreferences.reduce((acc: any[], pref: any) => {
                    const key = `${pref.timeSlot.date}_${pref.timeSlot.startTime}_${pref.timeSlot.endTime}`
                    const existing = acc.find(p =>
                      `${p.timeSlot.date}_${p.timeSlot.startTime}_${p.timeSlot.endTime}` === key
                    )
                    // Keep the one with the lowest preference value (in case of old data with ungrouped preferences)
                    if (!existing) {
                      acc.push(pref)
                    } else if (pref.preference < existing.preference) {
                      // Replace with lower preference
                      const index = acc.indexOf(existing)
                      acc[index] = pref
                    }
                    return acc
                  }, [])

                  // Sort by preference value and re-number them
                  const sortedPrefs = groupedPrefs
                    .sort((a, b) => a.preference - b.preference)
                    .map((pref, index) => ({ ...pref, displayPreference: index + 1 }))

                  return (
                    <div key={rd.id} className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1.5">{rd.discipline.displayName}</h4>
                      <div className="space-y-1.5">
                        {sortedPrefs.map((pref) => (
                          <div
                            key={pref.id}
                            className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {format(parseDateSafe(pref.timeSlot.date), 'EEE, MMM d')} • {pref.timeSlot.startTime} - {pref.timeSlot.endTime}
                            </div>
                            <span className="text-xs font-medium text-blue-600 flex-shrink-0 ml-2">
                              {pref.displayPreference === 1 && '1st'}
                              {pref.displayPreference === 2 && '2nd'}
                              {pref.displayPreference === 3 && '3rd'}
                              {pref.displayPreference > 3 && `${pref.displayPreference}th`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Assigned Squads */}
            {athleteSquads.length > 0 ? (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Assigned Squads</h3>
                <div className="space-y-2">
                  {athleteSquads.map((squadMember) => (
                    <div
                      key={squadMember.id}
                      className="p-2 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">
                            {squadMember.squad.timeSlot.discipline.displayName}
                          </div>
                          <div className="text-sm text-gray-700">
                            {format(parseDateSafe(squadMember.squad.timeSlot.date), 'EEE, MMM d')} • {squadMember.squad.timeSlot.startTime} - {squadMember.squad.timeSlot.endTime}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {squadMember.squad.timeSlot.fieldNumber || squadMember.squad.timeSlot.stationNumber} • Squad {squadMember.squad.name}
                            {squadMember.position && ` • Pos ${squadMember.position}`}
                          </div>
                        </div>
                        <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">Squad Assignment Pending</h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      Your coach will assign you to a squad soon. Check back later for your shooting times.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
              Registered on {format(new Date(athleteRegistration.createdAt), 'PPP')}
            </div>
          </div>
        )}

        {/* Registered athletes - Only visible to coaches and admins */}
        {isCoach && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isAdmin ? 'Registered Athletes' : 'Your Team Athletes'} ({visibleRegistrations.length})
            </h2>

            {visibleRegistrations.length === 0 ? (
              <p className="text-gray-600">
                {isAdmin ? 'No athletes registered yet.' : 'No athletes from your team(s) are registered yet.'}
              </p>
            ) : (
              <RegistrationList
                registrations={visibleRegistrations}
                isAdmin={isAdmin}
                userRole={user?.role || ''}
                allathletes={allathletes}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

