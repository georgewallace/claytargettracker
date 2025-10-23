import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CreateTournamentForm from './CreateTournamentForm'

export default async function CreateTournamentPage() {
  const user = await getCurrentUser()
  
  // Only coaches and admins can create tournaments
  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    redirect('/')
  }

  const disciplines = await prisma.discipline.findMany({
    orderBy: { displayName: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Tournament</h1>
          <CreateTournamentForm disciplines={disciplines} />
        </div>
      </div>
    </div>
  )
}
