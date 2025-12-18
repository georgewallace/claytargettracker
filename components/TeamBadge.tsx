interface TeamBadgeProps {
  teamName: string
  isIndividualTeam?: boolean
  className?: string
}

/**
 * Display team name with optional "Individual" badge for individual competitor teams
 */
export default function TeamBadge({ teamName, isIndividualTeam, className = '' }: TeamBadgeProps) {
  if (isIndividualTeam) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span>Individual</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          Independent
        </span>
      </span>
    )
  }

  return <span className={className}>{teamName}</span>
}
