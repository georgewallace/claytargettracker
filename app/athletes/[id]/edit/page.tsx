import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'
import EditAthleteForm from './EditAthleteForm'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'

// Force dynamic rendering (required for getCurrentUser)
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
      { id: 'athlete-1' },
      { id: 'athlete-2' },
      { id: 'athlete-3' },
    ]
  }
  return []
}

export default async function EditAthletePage({ params }: PageProps) {
  // In demo mode, show placeholder
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Edit Athlete" />
  }
  const { id } = await params
  const user = await getCurrentUser()
  
  // Must be logged in
  if (!user) {
    redirect('/login')
  }
  
  // Must be coach or admin
  if (user.role !== 'coach' && user.role !== 'admin') {
    redirect('/teams/my-team')
  }
  
  // Fetch athlete with team
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: {
      user: true,
      team: true
    }
  })

  if (!athlete) {
    notFound()
  }

  // If user is coach (not admin), verify they coach this athlete's team
  if (user.role === 'coach') {
    if (!athlete.team || !(await isUserCoachOfTeam(user.id, athlete.team.id))) {
      redirect('/teams/my-team')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Athlete Details</h1>
            <p className="text-gray-600 mt-2">
              {athlete.user.name} 
              {athlete.team && <span className="text-gray-500"> • {athlete.team.name}</span>}
            </p>
          </div>
          <EditAthleteForm athlete={athlete} />
        </div>
      </div>
    </div>
  )
}

