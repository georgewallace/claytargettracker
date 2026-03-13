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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
        <ScoreEntryClient tournament={tournament} />
      </div>
    </div>
  )
}
