'use client'

import { getDivisionColor } from '@/lib/squadUtils'

interface ShooterCardProps {
  shooter: any
  isDragging?: boolean
  onRemove?: () => void
}

export default function ShooterCard({ shooter, isDragging, onRemove }: ShooterCardProps) {
  return (
    <div
      className={`p-3 bg-white border-2 rounded-md transition cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'border-indigo-500 shadow-lg'
          : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {shooter.user.name}
          </div>
          
          {shooter.team && (
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {shooter.team.name}
            </div>
          )}
          
          {shooter.division && (
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getDivisionColor(shooter.division)}`}>
                {shooter.division}
              </span>
            </div>
          )}
        </div>

        {onRemove && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
            title="Remove from squad"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

