import { PageHeaderSkeleton, RegistrationListSkeleton } from '@/components/LoadingSkeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button Skeleton */}
        <div className="mb-4">
          <div className="animate-pulse h-10 bg-gray-200 rounded w-48" />
        </div>

        {/* Tournament Header Skeleton */}
        <PageHeaderSkeleton />

        {/* Registration Section Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
            <RegistrationListSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  )
}
