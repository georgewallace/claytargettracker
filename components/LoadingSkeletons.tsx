// Reusable loading skeleton components for better perceived performance

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-gray-200 rounded-lg h-32 w-full" />
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 rounded h-12 w-full" />
      ))}
    </div>
  )
}

export function AthleteCardSkeleton() {
  return (
    <div className="animate-pulse border border-gray-200 rounded-lg p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  )
}

export function TournamentCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-md p-6">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-10 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded w-24" />
      </div>
    </div>
  )
}

export function TournamentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TournamentCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function RegistrationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AthleteCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function SquadCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg border-2 border-gray-200 p-4">
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
      <div className="space-y-2">
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-md p-8 mb-8">
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-20 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

// Generic skeleton for any content
export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{ width: `${Math.random() * 30 + 60}%` }}
        />
      ))}
    </div>
  )
}
