'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

interface Tournament {
  id: string
  name: string
  startDate: Date
  endDate: Date
  disciplines: any[]
  timeSlots: any[]
}

interface ScoreEntryProps {
  tournament: Tournament
}

export default function ScoreEntry({ tournament }: ScoreEntryProps) {
  const router = useRouter()
  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null)
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, Record<number, number>>>({}) // athleteId -> round -> score
  const [allDisciplineScores, setAllDisciplineScores] = useState<Record<string, boolean>>({}) // athleteId -> hasScores (for completion tracking)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Get unique disciplines that have squads
  const disciplinesWithSquads = Array.from(
    new Set(
      tournament.timeSlots
        .filter(slot => slot.squads.length > 0)
        .map(slot => slot.disciplineId)
    )
  ).map(disciplineId => {
    const slot = tournament.timeSlots.find(s => s.disciplineId === disciplineId)
    return slot?.discipline
  }).filter(Boolean)

  // Set initial active discipline
  useEffect(() => {
    if (!activeDiscipline && disciplinesWithSquads.length > 0) {
      setActiveDiscipline(disciplinesWithSquads[0].id)
    }
  }, [disciplinesWithSquads, activeDiscipline])

  // Fetch all scores for the active discipline (for completion tracking)
  // PERFORMANCE FIX: Use bulk completion endpoint instead of N+1 queries
  useEffect(() => {
    if (!activeDiscipline) return

    const fetchAllDisciplineScores = async () => {
      try {
        // Single API call to get completion status for all athletes
        // Previously: N API calls (one per athlete) - 100 athletes = 100 requests
        // Now: 1 API call regardless of athlete count - 95% reduction in API calls
        const response = await fetch(
          `/api/tournaments/${tournament.id}/scores/completion?disciplineId=${activeDiscipline}`
        )

        if (response.ok) {
          const completionMap = await response.json()
          setAllDisciplineScores(completionMap)
        } else {
          console.error('Error fetching discipline scores:', response.statusText)
          setAllDisciplineScores({})
        }
      } catch (err) {
        console.error('Error fetching discipline scores:', err)
        setAllDisciplineScores({})
      }
    }

    fetchAllDisciplineScores()
  }, [activeDiscipline, tournament.id])

  // Get squads for active discipline with completion status
  const activeSquads = activeDiscipline
    ? tournament.timeSlots
        .filter(slot => slot.disciplineId === activeDiscipline)
        .flatMap(slot => slot.squads.map((squad: any) => {
          // Calculate completion for this squad using allDisciplineScores
          let membersWithScores = 0
          squad.members.forEach((member: any) => {
            if (allDisciplineScores[member.athlete.id]) {
              membersWithScores++
            }
          })
          
          const isComplete = membersWithScores === squad.members.length && squad.members.length > 0
          const completionPercentage = squad.members.length > 0 
            ? Math.round((membersWithScores / squad.members.length) * 100) 
            : 0
          
          return {
            ...squad,
            timeSlot: slot,
            isComplete,
            completionPercentage,
            membersWithScores
          }
        }))
    : []

  // Get selected squad details (or all squads if "all" is selected)
  const selectedSquad = selectedSquadId === 'all' ? null : activeSquads.find(s => s.id === selectedSquadId)
  const squadsToDisplay = selectedSquadId === 'all' ? activeSquads : (selectedSquad ? [selectedSquad] : [])

  // Get discipline details
  const activeDisciplineData = disciplinesWithSquads.find(d => d.id === activeDiscipline)
  const isSkeetOrTrap = activeDisciplineData?.name === 'skeet' || activeDisciplineData?.name === 'trap'
  const isSportingClays = activeDisciplineData?.name === 'sporting_clays'
  const isFiveStand = activeDisciplineData?.name === 'five_stand'

  // Get tournament discipline configuration for limits
  const tournamentDiscipline = tournament.disciplines?.find(
    (td: any) => td.disciplineId === activeDiscipline
  )
  
  // Calculate max possible score based on tournament configuration
  const getMaxPossibleScore = (): number => {
    if (!tournamentDiscipline) return 0
    
    if (isSkeetOrTrap) {
      // Trap/Skeet: rounds * 25 targets per round
      return (tournamentDiscipline.rounds || 4) * 25
    } else if (isSportingClays) {
      // Sporting Clays: total targets configured
      return tournamentDiscipline.targets || 100
    } else if (isFiveStand) {
      // 5-Stand: total targets configured
      return tournamentDiscipline.targets || 50
    }
    return 0
  }

  const maxPossibleScore = getMaxPossibleScore()

  // Configuration based on discipline
  const maxRounds = tournamentDiscipline?.rounds || 4 // For skeet/trap
  const maxStations = tournamentDiscipline?.stations || (isSportingClays ? 14 : (isFiveStand ? 5 : 4))
  const maxTargetsPerStation = isSportingClays ? 10 : (isFiveStand ? 25 : 25) // Sporting Clays varies, default 10

  // Initialize scores when squad is selected
  useEffect(() => {
    if (selectedSquadId) {
      // Fetch existing scores
      fetchExistingScores()
    }
  }, [selectedSquadId, activeDiscipline])

  const fetchExistingScores = async () => {
    if (!activeDiscipline) return
    
    try {
      // Fetch scores for all squads in this discipline
      const scoresObj: Record<string, Record<number, number>> = {}
      
      for (const squad of squadsToDisplay) {
        const response = await fetch(
          `/api/tournaments/${tournament.id}/scores?squadId=${squad.id}&disciplineId=${activeDiscipline}`
        )
        if (response.ok) {
          const data = await response.json()
          // Transform data into scores object
          data.forEach((shoot: any) => {
            if (!scoresObj[shoot.athleteId]) {
              scoresObj[shoot.athleteId] = {}
            }
            shoot.scores.forEach((score: any) => {
              scoresObj[shoot.athleteId][score.stationNumber] = score.targets
            })
          })
        }
      }
      
      setScores(scoresObj)
    } catch (err) {
      console.error('Error fetching scores:', err)
    }
  }

  const handleScoreChange = (athleteId: string, round: number, value: string) => {
    // Allow empty string
    if (value === '') {
      setScores(prev => {
        const newScores = { ...prev }
        if (newScores[athleteId]) {
          const athletescores = { ...newScores[athleteId] }
          delete athletescores[round]
          if (Object.keys(athletescores).length === 0) {
            delete newScores[athleteId]
          } else {
            newScores[athleteId] = athletescores
          }
        }
        return newScores
      })
      return
    }

    const numValue = parseInt(value)
    
    // Validate score based on discipline
    const maxValue = isSkeetOrTrap ? 25 : maxTargetsPerStation
    if (isNaN(numValue) || numValue < 0 || numValue > maxValue) return

    setScores(prev => ({
      ...prev,
      [athleteId]: {
        ...(prev[athleteId] || {}),
        [round]: numValue
      }
    }))
  }

  const getathleteTotal = (athleteId: string): number => {
    const athletescores = scores[athleteId] || {}
    return Object.values(athletescores).reduce((sum, score) => sum + score, 0)
  }

  const handleSaveScores = async () => {
    if (!selectedSquadId || !activeDiscipline) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Build a map of athleteId to their squad's date
      const athleteToDateMap: Record<string, Date> = {}
      squadsToDisplay.forEach((squad: any) => {
        squad.members.forEach((member: any) => {
          athleteToDateMap[member.athlete.id] = squad.timeSlot.date
        })
      })

      // Validate scores before saving
      const invalidathletes: string[] = []
      Object.entries(scores).forEach(([athleteId, rounds]) => {
        const total = Object.values(rounds).reduce((sum, score) => sum + score, 0)
        if (total > maxPossibleScore) {
          const member = squadsToDisplay
            .flatMap(s => s.members)
            .find((m: any) => m.athlete.id === athleteId)
          if (member) {
            invalidathletes.push(`${member.athlete.user.name} (${total}/${maxPossibleScore})`)
          }
        }
      })

      if (invalidathletes.length > 0) {
        setError(
          `Cannot save scores. The following athlete(s) have scores exceeding the tournament limit of ${maxPossibleScore} targets:\n\n${invalidathletes.join('\n')}\n\nPlease correct the scores before saving.`
        )
        setLoading(false)
        return
      }

      // Prepare scores data
      const scoresData = Object.entries(scores)
        .filter(([athleteId]) => athleteToDateMap[athleteId]) // Only include athletes in displayed squads
        .map(([athleteId, rounds]) => ({
          athleteId,
          disciplineId: activeDiscipline,
          date: athleteToDateMap[athleteId],
          rounds: Object.entries(rounds).map(([round, targets]) => ({
            station: parseInt(round),
            targets,
            totalTargets: isSkeetOrTrap ? 25 : maxTargetsPerStation
          }))
        }))

      const response = await fetch(`/api/tournaments/${tournament.id}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores: scoresData })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save scores')
      }

      setSuccess(`Scores saved successfully! ${scoresData.length} athlete${scoresData.length !== 1 ? 's' : ''} updated.`)
      
      // Update completion tracking for the athletes who just got scores
      setAllDisciplineScores(prev => {
        const updated = { ...prev }
        scoresData.forEach(({ athleteId }) => {
          updated[athleteId] = true
        })
        return updated
      })
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
            <p className="text-gray-600 mt-1">Score Entry</p>
          </div>
          <Link
            href={`/tournaments/${tournament.id}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Back to Tournament
          </Link>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
            {success}
          </div>
        )}
      </div>

      {/* Discipline Tabs */}
      {disciplinesWithSquads.length > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Disciplines">
              {disciplinesWithSquads.map((discipline: any) => {
                const isActive = activeDiscipline === discipline.id
                return (
                  <button
                    key={discipline.id}
                    onClick={() => {
                      setActiveDiscipline(discipline.id)
                      setSelectedSquadId(null)
                      setScores({})
                    }}
                    className={`${
                      isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
                  >
                    {discipline.displayName}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Squad Selector */}
      {activeSquads.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Squad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* All Squads Option */}
            <button
              onClick={() => setSelectedSquadId('all')}
              className={`p-4 border-2 rounded-lg text-left transition ${
                selectedSquadId === 'all'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="font-semibold text-gray-900">📋 All Squads</div>
              <div className="text-sm text-gray-600 mt-1">
                View and score all squads at once
              </div>
              <div className="text-sm font-medium text-green-600 mt-2">
                {activeSquads.length} squad{activeSquads.length !== 1 ? 's' : ''}
              </div>
            </button>
            
            {/* Individual Squad Options */}
            {activeSquads.map((squad: any) => (
              <button
                key={squad.id}
                onClick={() => setSelectedSquadId(squad.id)}
                className={`p-4 border-2 rounded-lg text-left transition ${
                  selectedSquadId === squad.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : squad.isComplete
                    ? 'border-green-300 bg-green-50 hover:border-green-400'
                    : 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{squad.name}</div>
                  {squad.isComplete ? (
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
                      ✓ Complete
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                      ⚠️ {squad.completionPercentage}%
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {format(new Date(squad.timeSlot.date), 'PPP')} • {squad.timeSlot.startTime}
                </div>
                <div className="text-sm text-gray-600">
                  {squad.timeSlot.fieldNumber || squad.timeSlot.stationNumber}
                </div>
                <div className="text-sm font-medium text-gray-700 mt-2 flex items-center justify-between">
                  <span>
                    {squad.members.length} athlete{squad.members.length !== 1 ? 's' : ''}
                  </span>
                  {!squad.isComplete && (
                    <span className="text-xs text-gray-500">
                      {squad.membersWithScores}/{squad.members.length} scored
                    </span>
                  )}
                </div>
                
                {/* Progress bar for incomplete squads */}
                {!squad.isComplete && (
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-yellow-500 h-full transition-all"
                      style={{ width: `${squad.completionPercentage}%` }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Score Entry Tables */}
      {squadsToDisplay.length > 0 && (isSkeetOrTrap || isSportingClays || isFiveStand) && (
        <div className="space-y-6">
          {/* Save Button at Top */}
          <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedSquadId === 'all' ? 'All Squads' : squadsToDisplay[0]?.name} - {activeDisciplineData?.displayName}
              </h2>
              <p className="text-sm text-gray-600">
                {isSkeetOrTrap && 'Enter scores for each round (0-25 targets per round)'}
                {isSportingClays && 'Enter scores for each station (0-10 targets per station, 100 total)'}
                {isFiveStand && 'Enter scores for each station (0-25 targets per station)'}
              </p>
            </div>
            <button
              onClick={handleSaveScores}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Saving...' : 'Save Scores'}
            </button>
          </div>

          {/* Table for Each Squad */}
          {squadsToDisplay.map((squad: any) => (
            <div key={squad.id} className="bg-white rounded-lg shadow-md p-6">
              {/* Squad Header */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">{squad.name}</h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(squad.timeSlot.date), 'PPP')} • {squad.timeSlot.startTime} • {squad.timeSlot.fieldNumber || squad.timeSlot.stationNumber}
                </p>
              </div>

              {/* Score Entry Table */}
              <div className="overflow-x-auto border border-gray-300 rounded">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">
                        athlete
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap">
                        Team
                      </th>
                      {Array.from({ length: isSkeetOrTrap ? maxRounds : maxStations }, (_, i) => (
                        <th key={i} className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 whitespace-nowrap w-16">
                          {isSkeetOrTrap ? `R${i + 1}` : `S${i + 1}`}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 bg-indigo-100 whitespace-nowrap w-20">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {squad.members.map((member: any, idx: number) => (
                      <tr key={member.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 hover:bg-blue-50`}>
                        <td className="px-3 py-1.5 border-r border-gray-200 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {member.athlete.user.name}
                          </div>
                          {member.athlete.division && (
                            <div className="text-xs text-gray-500">
                              {member.athlete.division}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-sm text-gray-600 border-r border-gray-200 whitespace-nowrap">
                          {member.athlete.team?.name || '—'}
                        </td>
                        {Array.from({ length: isSkeetOrTrap ? maxRounds : maxStations }, (_, i) => (
                          <td key={i} className="px-1 py-1 text-center border-r border-gray-200">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={scores[member.athlete.id]?.[i + 1] ?? ''}
                              onChange={(e) => handleScoreChange(member.athlete.id, i + 1, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full h-8 px-1 text-center border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-yellow-50 text-base font-mono"
                              placeholder="-"
                              title={isSportingClays ? `Station ${i + 1} (max ${maxTargetsPerStation})` : ''}
                            />
                          </td>
                        ))}
                        <td className={`px-2 py-1 text-center border-l-2 ${
                          getathleteTotal(member.athlete.id) > maxPossibleScore
                            ? 'bg-red-100 border-red-400'
                            : 'bg-indigo-50 border-indigo-200'
                        }`}>
                          <div className={`text-base font-bold font-mono ${
                            getathleteTotal(member.athlete.id) > maxPossibleScore
                              ? 'text-red-700'
                              : 'text-indigo-900'
                          }`}>
                            {getathleteTotal(member.athlete.id)}
                          </div>
                          {getathleteTotal(member.athlete.id) > maxPossibleScore && (
                            <div className="text-xs text-red-600 font-semibold">
                              Max: {maxPossibleScore}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Save Button at Bottom */}
          <div className="bg-white rounded-lg shadow-md p-4 flex justify-end sticky bottom-0 z-10">
            <button
              onClick={handleSaveScores}
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-lg"
            >
              {loading ? 'Saving...' : 'Save Scores'}
            </button>
          </div>
        </div>
      )}

      {!selectedSquadId && activeSquads.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600">Select a squad above to enter scores</p>
        </div>
      )}

      {activeSquads.length === 0 && activeDiscipline && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600">No squads with athletes for this discipline yet</p>
        </div>
      )}
    </div>
  )
}

