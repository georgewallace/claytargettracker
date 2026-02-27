import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import TeamHistoryViewer from './TeamHistoryViewer'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    page?: string
    months?: string
  }>
}

async function getUserFirstCoachedTeam(userId: string) {
  const team = await prisma.team.findFirst({
    where: {
      coaches: {
        some: {
          userId: userId
        }
      }
    },
    select: {
      id: true,
      name: true
    }
  })

  return team
}

export default async function TeamHistoryPage({ searchParams }: PageProps) {
  const user = await getCurrentUser()

  // Get pagination and filter parameters
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')
  const monthsBack = parseInt(params.months || '6') // Default to 6 months
  const itemsPerPage = 10
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.role !== 'coach' && user.role !== 'admin') {
    redirect('/teams')
  }
  
  // Find first team coached by this user
  const team = await getUserFirstCoachedTeam(user.id)
  
  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You're not coaching a team yet
            </h1>
            <p className="text-gray-600 mb-6">
              Go to the Teams page to become a coach of an existing team or create a new one.
            </p>
            <a
              href="/teams"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition"
            >
              Go to Teams
            </a>
          </div>
        </div>
      </div>
    )
  }

  // PERFORMANCE OPTIMIZATION: Calculate date cutoff for filtering
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack)

  // PERFORMANCE OPTIMIZATION: Get total count for pagination
  const totalAthletes = await prisma.athlete.count({
    where: {
      teamId: team.id
    }
  })

  const totalPages = Math.ceil(totalAthletes / itemsPerPage)
  const skip = (currentPage - 1) * itemsPerPage

  // PERFORMANCE OPTIMIZATION: Get paginated athletes with date-filtered shoots
  // Previously: Loaded ALL athletes with ALL shoots (could be 500+ shoot records)
  // Now: Loads 10 athletes per page with shoots from last 6 months only
  const teamathletes = await prisma.athlete.findMany({
    where: {
      teamId: team.id
    },
    include: {
      user: true,
      shoots: {
        where: {
          date: {
            gte: cutoffDate // Only get shoots from last N months
          }
        },
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
          date: 'asc' // Ascending for trend analysis
        }
      }
    },
    orderBy: {
      user: {
        name: 'asc'
      }
    },
    skip,
    take: itemsPerPage
  })

  // Calculate totals and percentages for each shoot
  const athletesWithHistory = teamathletes.map(athlete => {
    const shootsWithTotals = athlete.shoots.map(shoot => {
      const totalTargets = shoot.scores.reduce((sum, score) => sum + Math.floor(score.targets), 0)
      const totalPossible = shoot.scores.reduce((sum, score) => sum + score.maxTargets, 0)
      const percentage = totalPossible > 0 ? ((totalTargets / totalPossible) * 100) : 0
      
      return {
        ...shoot,
        totalTargets,
        totalPossible,
        percentage
      }
    })

    // Calculate stats by discipline
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
        const firstHalf = stat.shoots.slice(0, midpoint)
        const secondHalf = stat.shoots.slice(midpoint)
        
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

    return {
      id: athlete.id,
      name: athlete.user.name,
      email: athlete.user.email,
      grade: athlete.grade,
      division: athlete.division,
      shoots: shootsWithTotals,
      stats
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TeamHistoryViewer
          teamName={team.name}
          athletes={athletesWithHistory}
          currentPage={currentPage}
          totalPages={totalPages}
          totalAthletes={totalAthletes}
          monthsBack={monthsBack}
        />
      </div>
    </div>
  )
}

