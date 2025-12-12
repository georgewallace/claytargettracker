'use client'

import Link from 'next/link'

interface ShootOffResultsProps {
  shootOffs: any[]
  tournamentId: string
  isAdmin: boolean
}

export default function ShootOffResults({ shootOffs, tournamentId, isAdmin }: ShootOffResultsProps) {
  // Only show completed shoot-offs
  const completedShootOffs = shootOffs.filter(so => so.status === 'completed' && so.winner)

  if (completedShootOffs.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          🏆 Shoot-Off Results
        </h2>
        {isAdmin && (
          <Link
            href={`/tournaments/${tournamentId}/shoot-offs`}
            className="text-white hover:text-indigo-200 text-sm font-medium transition"
          >
            Manage All →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedShootOffs.map((shootOff) => (
          <div
            key={shootOff.id}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-xl p-6"
          >
            {/* Position Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">
                {shootOff.position === 1 ? '🥇' : 
                 shootOff.position === 2 ? '🥈' : 
                 shootOff.position === 3 ? '🥉' : 
                 `#${shootOff.position}`}
              </div>
              <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1">
                <span className="text-xs font-semibold text-white">COMPLETE</span>
              </div>
            </div>

            {/* Winner */}
            <div className="mb-4">
              <div className="text-white/80 text-sm mb-1">Winner</div>
              <div className="text-2xl font-bold text-white mb-1">
                {shootOff.winner.user.name}
              </div>
              {shootOff.winner.athlete?.team && (
                <div className="text-white/80 text-sm">
                  {shootOff.winner.athlete.team.name}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-white/80 text-xs">Participants</div>
                  <div className="text-white font-bold">{shootOff.participants.length}</div>
                </div>
                <div>
                  <div className="text-white/80 text-xs">Rounds</div>
                  <div className="text-white font-bold">{shootOff.rounds?.length || 0}</div>
                </div>
              </div>
            </div>

            {/* Action */}
            <Link
              href={`/tournaments/${tournamentId}/shoot-offs/${shootOff.id}`}
              className="block w-full bg-white/20 hover:bg-white/30 backdrop-blur text-white text-center py-2 rounded-lg font-semibold transition"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>

      {/* In Progress Shoot-Offs Notice */}
      {shootOffs.some(so => so.status === 'in_progress') && (
        <div className="mt-4 bg-blue-500/20 backdrop-blur border-2 border-blue-400 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎯</div>
            <div>
              <div className="text-white font-semibold">
                {shootOffs.filter(so => so.status === 'in_progress').length} Shoot-Off
                {shootOffs.filter(so => so.status === 'in_progress').length > 1 ? 's' : ''} In Progress
              </div>
              <div className="text-white/80 text-sm">
                Results will appear here once completed
              </div>
            </div>
            {isAdmin && (
              <Link
                href={`/tournaments/${tournamentId}/shoot-offs`}
                className="ml-auto bg-white/20 hover:bg-white/30 backdrop-blur text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Manage
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

