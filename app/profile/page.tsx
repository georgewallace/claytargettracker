import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import ProfileForm from './ProfileForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get shooter profile if exists
  const shooter = user.shooter ? await prisma.shooter.findUnique({
    where: { id: user.shooter.id },
    include: {
      user: true,
      team: true
    }
  }) : null

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">
              {user.name} ({user.email})
            </p>
            {shooter?.team && (
              <p className="text-sm text-gray-500 mt-1">
                Team: {shooter.team.name}
              </p>
            )}
          </div>
          
          {shooter ? (
            <ProfileForm shooter={shooter} />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                You don't have a shooter profile yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

