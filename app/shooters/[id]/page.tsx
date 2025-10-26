import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'
import ShooterProfileView from './ShooterProfileView'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ShooterProfilePage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  
  // Must be logged in
  if (!user) {
    redirect('/login')
  }
  
  // Fetch shooter with full details
  const shooter = await prisma.shooter.findUnique({
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
            orderBy: { station: 'asc' }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }
    }
  })

  if (!shooter) {
    notFound()
  }

  // Check permissions
  const isOwnProfile = user.shooter?.id === shooter.id
  const isCoachOfTeam = shooter.team ? await isUserCoachOfTeam(user.id, shooter.team.id) : false
  const isAdmin = user.role === 'admin'

  // Allow access if: own profile, coach of shooter's team, or admin
  if (!isOwnProfile && !isCoachOfTeam && !isAdmin) {
    redirect('/')
  }

  // Calculate statistics
  const shootsWithTotals = shooter.shoots.map(shoot => {
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

  // Get division averages for comparison
  const divisionAverages: Record<string, Record<string, number>> = {}
  
  if (shooter.division) {
    // Get all shoots from shooters in the same division
    const divisionShoots = await prisma.shoot.findMany({
      where: {
        shooter: {
          division: shooter.division
        }
      },
      include: {
        tournament: true,
        discipline: true,
        scores: true
      }
    })

    // Calculate averages by tournament and discipline
    const avgsByTournamentAndDiscipline: Record<string, Record<string, { total: number, count: number }>> = {}

    divisionShoots.forEach(shoot => {
      const totalTargets = shoot.scores.reduce((sum, score) => sum + score.targets, 0)
      const totalPossible = shoot.scores.reduce((sum, score) => sum + score.totalTargets, 0)
      const percentage = totalPossible > 0 ? ((totalTargets / totalPossible) * 100) : 0

      const tournamentKey = shoot.tournamentId
      const disciplineKey = shoot.disciplineId

      if (!avgsByTournamentAndDiscipline[tournamentKey]) {
        avgsByTournamentAndDiscipline[tournamentKey] = {}
      }
      if (!avgsByTournamentAndDiscipline[tournamentKey][disciplineKey]) {
        avgsByTournamentAndDiscipline[tournamentKey][disciplineKey] = { total: 0, count: 0 }
      }

      avgsByTournamentAndDiscipline[tournamentKey][disciplineKey].total += percentage
      avgsByTournamentAndDiscipline[tournamentKey][disciplineKey].count += 1
    })

    // Calculate final averages
    Object.keys(avgsByTournamentAndDiscipline).forEach(tournamentId => {
      if (!divisionAverages[tournamentId]) {
        divisionAverages[tournamentId] = {}
      }
      Object.keys(avgsByTournamentAndDiscipline[tournamentId]).forEach(disciplineId => {
        const data = avgsByTournamentAndDiscipline[tournamentId][disciplineId]
        divisionAverages[tournamentId][disciplineId] = data.total / data.count
      })
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ShooterProfileView
          shooter={{
            id: shooter.id,
            name: shooter.user.name,
            email: shooter.user.email,
            grade: shooter.grade,
            division: shooter.division,
            team: shooter.team,
            shoots: shootsWithTotals,
            stats
          }}
          divisionAverages={divisionAverages}
          canEdit={canEdit}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  )
}

