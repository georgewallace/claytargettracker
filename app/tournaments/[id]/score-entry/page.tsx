import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import ScoreEntryClient from './ScoreEntryClient'

export const dynamic = 'force-dynamic'

export default async function ScoreEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return notFound()
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      enableScores: true,
      awardStructureVersion: true,
      longRunDisciplines: true,
      tiebreakOrder: true,
      shootOffMaxPlace: true,
      disciplines: {
        select: {
          disciplineId: true,
          rounds: true,
          targets: true,
          stations: true,
          discipline: {
            select: { id: true, name: true, displayName: true }
          }
        }
      },
      timeSlots: {
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          fieldNumber: true,
          disciplineId: true,
          discipline: {
            select: { id: true, name: true, displayName: true }
          },
          squads: {
            select: {
              id: true,
              name: true,
              members: {
                select: {
                  id: true,
                  athleteId: true,
                  athlete: {
                    select: {
                      id: true,
                      division: true,
                      gender: true,
                      user: { select: { name: true } },
                      team: { select: { id: true, name: true } }
                    }
                  }
                }
              }
            },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
      }
    }
  })

  if (!tournament || !tournament.enableScores) {
    return notFound()
  }

  // Pre-compute score completion status per squad
  const shoots = await prisma.shoot.findMany({
    where: { tournamentId: id },
    select: { athleteId: true, disciplineId: true, scores: { select: { id: true } } }
  })

  // athleteId:disciplineId → score count
  const shootScoreCount: Record<string, number> = {}
  for (const s of shoots) {
    shootScoreCount[`${s.athleteId}:${s.disciplineId}`] = s.scores.length
  }

  // disciplineId → expected inputs (rounds or stations)
  const expectedInputs: Record<string, number> = {}
  for (const td of tournament.disciplines) {
    const name = td.discipline.name.toLowerCase()
    // five_stand uses rounds of 25 like trap, not per-station entry
    const isStation = name.includes('sporting') || name.includes('super_sport')
    const defaultRounds = name.includes('five_stand') || name.includes('5_stand') ? 2 : 1
    expectedInputs[td.disciplineId] = isStation ? (td.stations ?? 10) : (td.rounds ?? defaultRounds)
  }

  const squadScoreStatus: Record<string, 'complete' | 'partial' | 'empty'> = {}
  for (const ts of tournament.timeSlots) {
    for (const squad of ts.squads) {
      if (squad.members.length === 0) { squadScoreStatus[squad.id] = 'empty'; continue }
      const exp = expectedInputs[ts.disciplineId] ?? 1
      let filled = 0
      const total = squad.members.length * exp
      for (const m of squad.members) {
        filled += Math.min(shootScoreCount[`${m.athleteId}:${ts.disciplineId}`] ?? 0, exp)
      }
      squadScoreStatus[squad.id] = filled === 0 ? 'empty' : filled >= total ? 'complete' : 'partial'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-4">
          <Link
            href={`/tournaments/${id}`}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tournament
          </Link>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Score Entry</h1>
          <p className="text-gray-600 mt-1">{tournament.name}</p>
        </div>
        <ScoreEntryClient tournament={tournament} initialSquadStatus={squadScoreStatus} />
      </div>
    </div>
  )
}
