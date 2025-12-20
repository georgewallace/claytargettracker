import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'
import AthleteProfileView from './AthleteProfileView'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export default async function athleteProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  // Must be logged in
  if (!user) {
    redirect('/login')
  }

  // PERFORMANCE OPTIMIZATION: Pagination setup
  const search = await searchParams
  const currentPage = parseInt(search.page || '1')
  const itemsPerPage = 20
  const skip = (currentPage - 1) * itemsPerPage

  // PERFORMANCE OPTIMIZATION: Fetch athlete with paginated shoots
  // Previously: Loaded ALL shoots (could be 100+ tournaments)
  // Now: Loads 20 shoots per page
  const athlete = await prisma.athlete.findUnique({
    where: { id },
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
        },
        skip,
        take: itemsPerPage
      }
    }
  })

  if (!athlete) {
    notFound()
  }

  // PERFORMANCE OPTIMIZATION: Get total shoot count for pagination
  const totalShoots = await prisma.shoot.count({
    where: {
      athleteId: id
    }
  })

  const totalPages = Math.ceil(totalShoots / itemsPerPage)

  // Check permissions
  const isOwnProfile = user.athlete?.id === athlete.id
  const isCoachOfTeam = athlete.team ? await isUserCoachOfTeam(user.id, athlete.team.id) : false
  const isAdmin = user.role === 'admin'

  // Allow access if: own profile, coach of athlete's team, or admin
  if (!isOwnProfile && !isCoachOfTeam && !isAdmin) {
    redirect('/')
  }

  // Calculate statistics
  const shootsWithTotals = athlete.shoots.map(shoot => {
    const totalTargets = shoot.scores.reduce((sum, score) => sum + score.targets, 0)
    const totalPossible = shoot.scores.reduce((sum, score) => sum + score.totalTargets, 0)
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
  
  shootsWithTotals.forEach(shoot => {
    const disciplineId = shoot.discipline.id
    if (!disciplineStats[disciplineId]) {
      disciplineStats[disciplineId] = {
        discipline: shoot.discipline,
        shoots: [],
        totalShoots: 0,
        totalTargets: 0,
        totalPossible: 0
      }
    }
    
    disciplineStats[disciplineId].shoots.push({
      date: shoot.date,
      percentage: shoot.percentage,
      score: `${shoot.totalTargets}/${shoot.totalPossible}`,
      tournamentName: shoot.tournament.name
    })
    disciplineStats[disciplineId].totalShoots++
    disciplineStats[disciplineId].totalTargets += shoot.totalTargets
    disciplineStats[disciplineId].totalPossible += shoot.totalPossible
  })

  // Calculate averages and trends
  const stats = Object.values(disciplineStats).map((stat: any) => {
    const average = stat.totalPossible > 0 
      ? ((stat.totalTargets / stat.totalPossible) * 100)
      : 0
    
    // Calculate trend (comparing first half vs second half)
    let trend = 'stable'
    if (stat.shoots.length >= 4) {
      const midpoint = Math.floor(stat.shoots.length / 2)
      const firstHalf = stat.shoots.slice(-stat.shoots.length, -midpoint).reverse()
      const secondHalf = stat.shoots.slice(0, midpoint).reverse()
      
      const firstAvg = firstHalf.reduce((sum: number, s: any) => sum + s.percentage, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum: number, s: any) => sum + s.percentage, 0) / secondHalf.length
      
      const difference = secondAvg - firstAvg
      if (difference > 5) trend = 'improving'
      else if (difference < -5) trend = 'declining'
    }
    
    return {
      ...stat,
      average,
      trend
    }
  })

  const canEdit = isCoachOfTeam || isAdmin

  // PERFORMANCE OPTIMIZATION: Division averages removed
  // Previously: Loaded ALL shoots from ALL athletes in same division (could be thousands of records!)
  // This was causing 5-10 second page loads for popular divisions
  // TODO: If division averages are needed, they should be pre-calculated/cached, not computed on every page load
  const divisionAverages: Record<string, Record<string, number>> = {}

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AthleteProfileView
          athlete={{
            id: athlete.id,
            name: athlete.user.name,
            email: athlete.user.email,
            grade: athlete.grade,
            division: athlete.division,
            profilePictureUrl: athlete.profilePictureUrl,
            team: athlete.team,
            shoots: shootsWithTotals,
            stats
          }}
          divisionAverages={divisionAverages}
          canEdit={canEdit}
          isOwnProfile={isOwnProfile}
          currentPage={currentPage}
          totalPages={totalPages}
          totalShoots={totalShoots}
        />
      </div>
    </div>
  )
}

