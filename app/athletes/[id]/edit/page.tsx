import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isUserCoachOfTeam } from '@/lib/teamHelpers'
import EditAthleteForm from './EditAthleteForm'
import DemoModePlaceholder from '@/components/DemoModePlaceholder'

// Force dynamic rendering (required for getCurrentUser)
export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return [{ id: 'athlete-1' }, { id: 'athlete-2' }, { id: 'athlete-3' }]
  }
  return []
}

export default async function EditAthletePage({ params }: PageProps) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return <DemoModePlaceholder pageName="Edit Athlete" />
  }

  const { id } = await params
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (user.role !== 'coach' && user.role !== 'admin') redirect('/teams/my-team')

  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: { user: true, team: true }
  })

  if (!athlete) notFound()

  if (user.role === 'coach') {
    if (!athlete.team || !(await isUserCoachOfTeam(user.id, athlete.team.id))) {
      redirect('/teams/my-team')
    }
  }

  const effectiveDivision = athlete.divisionOverride || athlete.division

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <a href="/teams/my-team" className="text-sm text-gray-500 hover:text-indigo-600 transition">
            ← Back to Team
          </a>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{athlete.user.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              athlete.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {athlete.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {athlete.team && (
            <p className="text-sm text-gray-500 mt-0.5">{athlete.team.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left column — Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Athlete Info</h2>
              <div className="space-y-3">
                {effectiveDivision && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Division</span>
                    <span className="text-sm font-semibold text-indigo-700">
                      {effectiveDivision}
                      {athlete.divisionOverride && <span className="ml-1 text-xs text-orange-500">(override)</span>}
                    </span>
                  </div>
                )}
                {athlete.grade && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Grade</span>
                    <span className="text-sm font-medium text-gray-900">{athlete.grade}</span>
                  </div>
                )}
                {athlete.team && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Team</span>
                    <span className="text-sm font-medium text-gray-900">{athlete.team.name}</span>
                  </div>
                )}
                {(athlete.nscaClass || athlete.ataClass || athlete.nssaClass) && (
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    {athlete.nscaClass && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">NSCA</span>
                        <span className="text-sm font-medium text-gray-900">{athlete.nscaClass}</span>
                      </div>
                    )}
                    {athlete.ataClass && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">ATA</span>
                        <span className="text-sm font-medium text-gray-900">{athlete.ataClass}</span>
                      </div>
                    )}
                    {athlete.nssaClass && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">NSSA</span>
                        <span className="text-sm font-medium text-gray-900">{athlete.nssaClass}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column — Edit form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Edit Details</h2>
              <EditAthleteForm athlete={athlete} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
