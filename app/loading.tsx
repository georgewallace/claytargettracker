import { TournamentListSkeleton, PageHeaderSkeleton } from '@/components/LoadingSkeletons'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-96 mx-auto mb-4" />
            <div className="h-6 bg-gray-200 rounded w-64 mx-auto" />
          </div>
        </div>

        {/* Section Title Skeleton */}
        <div className="mb-8">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-48 mb-4" />
        </div>

        {/* Tournament Cards Skeleton */}
        <TournamentListSkeleton count={6} />
      </div>
    </div>
  )
}
