import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import EditShooterForm from './EditShooterForm'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// For static export (demo mode)
export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return [
      { id: 'shooter-1' },
      { id: 'shooter-2' },
      { id: 'shooter-3' },
    ]
  }
  return []
}

export default async function EditShooterPage({ params }: PageProps) {
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
  
  // Fetch shooter with team
  const shooter = await prisma.shooter.findUnique({
    where: { id },
    include: {
      user: true,
      team: true
    }
  })

  if (!shooter) {
    notFound()
  }

  // If user is coach (not admin), verify they coach this shooter's team
  if (user.role === 'coach') {
    if (!shooter.team || shooter.team.coachId !== user.id) {
      redirect('/teams/my-team')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Shooter Details</h1>
            <p className="text-gray-600 mt-2">
              {shooter.user.name} 
              {shooter.team && <span className="text-gray-500"> • {shooter.team.name}</span>}
            </p>
          </div>
          <EditShooterForm shooter={shooter} />
        </div>
      </div>
    </div>
  )
}

