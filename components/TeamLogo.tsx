interface TeamLogoProps {
  logoUrl?: string | null
  teamName: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function TeamLogo({ logoUrl, teamName, size = 'md', className = '' }: TeamLogoProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  }

  const borderClasses = {
    xs: 'border',
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3',
    xl: 'border-4'
  }

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className={`${sizeClasses[size]} rounded-full object-cover ${borderClasses[size]} border-indigo-100 ${className}`}
      />
    )
  }

  // Fallback: Show first letter of team name
  const initial = teamName.charAt(0).toUpperCase()
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ${borderClasses[size]} border-indigo-100 ${className}`}>
      <span className="text-white font-bold">
        {initial}
      </span>
    </div>
  )
}

