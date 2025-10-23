import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import EditTournamentForm from './EditTournamentForm'

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

export default async function EditTournamentPage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  
  // Must be logged in
  if (!user) {
    redirect('/login')
  }
  
  // Fetch tournament with creator and disciplines
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      createdBy: true,
      disciplines: {
        include: {
          discipline: true
        }
      }
    }
  })

  if (!tournament) {
    notFound()
  }

  // Only admin or tournament creator can edit
  const canEdit = user.role === 'admin' || tournament.createdById === user.id
  
  if (!canEdit) {
    redirect(`/tournaments/${id}`)
  }

  // Fetch all available disciplines
  const allDisciplines = await prisma.discipline.findMany({
    orderBy: { displayName: 'asc' }
  })

  // Count registrations per discipline
  const disciplineRegistrationCounts = await Promise.all(
    allDisciplines.map(async (discipline) => {
      const count = await prisma.registrationDiscipline.count({
        where: {
          disciplineId: discipline.id,
          registration: {
            tournamentId: id
          }
        }
      })
      return {
        disciplineId: discipline.id,
        count
      }
    })
  )

  const disciplineCounts = disciplineRegistrationCounts.reduce((acc, item) => {
    acc[item.disciplineId] = item.count
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Tournament</h1>
          <EditTournamentForm 
            tournament={tournament}
            allDisciplines={allDisciplines}
            disciplineRegistrationCounts={disciplineCounts}
          />
        </div>
      </div>
    </div>
  )
}

