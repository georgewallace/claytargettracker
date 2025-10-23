'use client'

import { useDraggable } from '@dnd-kit/core'
import { getDivisionColor } from '@/lib/squadUtils'
import ShooterCard from './ShooterCard'

interface UnassignedShootersProps {
  shooters: any[]
}

export default function UnassignedShooters({ shooters }: UnassignedShootersProps) {
  // Group by division
  const byDivision = shooters.reduce((acc, shooter) => {
    const division = shooter.division || 'No Division'
    if (!acc[division]) {
      acc[division] = []
    }
    acc[division].push(shooter)
    return acc
  }, {} as Record<string, any[]>)

  const divisions = [
    'Novice',
    'Intermediate',
    'Junior Varsity',
    'Senior',
    'College-Trade School',
    'No Division'
  ].filter(div => byDivision[div]?.length > 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Unassigned Shooters ({shooters.length})
      </h3>

      {shooters.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          All shooters are assigned to squads! 🎉
        </p>
      ) : (
        <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {divisions.map(division => (
            <div key={division}>
              <div className={`text-xs font-semibold mb-2 px-2 py-1 rounded ${getDivisionColor(division)}`}>
                {division} ({byDivision[division].length})
              </div>
              <div className="space-y-2">
                {byDivision[division].map(shooter => (
                  <DraggableShooter key={shooter.id} shooter={shooter} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Drag shooters to squads to assign them
        </p>
      </div>
    </div>
  )
}

function DraggableShooter({ shooter }: { shooter: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: shooter.id
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-50' : ''}
    >
      <ShooterCard shooter={shooter} isDragging={isDragging} />
    </div>
  )
}

