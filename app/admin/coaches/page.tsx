import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import CoachManagement from './CoachManagement'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AdminCoachesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.role !== 'admin') {
    redirect('/')
  }
  
  // Get all users with coach or admin role
  const coaches = await prisma.user.findMany({
    where: {
      role: {
        in: ['coach', 'admin']
      }
    },
    include: {
      shooter: true,
      coachedTeams: {
        include: {
          team: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
  
  // Get all teams
  const teams = await prisma.team.findMany({
    include: {
      coaches: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          shooters: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Coach Management</h1>
          <p className="text-gray-600">
            Assign coaches to teams. Each coach can only coach one team, but teams can have multiple coaches.
          </p>
        </div>

        <CoachManagement coaches={coaches} teams={teams} />
      </div>
    </div>
  )
}

