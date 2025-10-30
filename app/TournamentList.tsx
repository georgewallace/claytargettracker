'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Tournament {
  id: string
  name: string
  location: string
  startDate: Date
  endDate: Date
  status: string
  description: string | null
  isRegistered: boolean
  createdBy: {
    name: string
  }
  disciplines: Array<{
    id: string
    discipline: {
      displayName: string
    }
  }>
  _count: {
    registrations: number
    shoots: number
  }
}

interface TournamentListProps {
  tournaments: Tournament[]
  isShooter: boolean
}

export default function TournamentList({ tournaments, isShooter }: TournamentListProps) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      finalizing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return badges[status as keyof typeof badges] || badges.upcoming
  }

  return (
    <>
      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg transition ${
              viewMode === 'card'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg transition ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border border-gray-200 hover:border-indigo-300 relative"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-900 flex-1 mr-4">
                  {tournament.name}
                </h3>
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tournament.status)}`}>
                    {tournament.status}
                  </span>
                  {/* Registration Badge for Shooters */}
                  {isShooter && tournament.isRegistered && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-300">
                      ✓ Registered
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium mr-2">📍</span>
                  {tournament.location}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">📅</span>
                  {format(new Date(tournament.startDate), 'PPP')}
                  {tournament.startDate !== tournament.endDate && (
                    <> - {format(new Date(tournament.endDate), 'PPP')}</>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">👥</span>
                  {tournament._count.registrations} registered shooters
                </div>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0" style={{color: 'rgb(255, 107, 53)'}}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  {tournament.disciplines.map(td => (
                    <span 
                      key={td.id}
                      className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                    >
                      {td.discipline.displayName}
                    </span>
                  ))}
                </div>
              </div>

              {tournament.description && (
                <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                  {tournament.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created by {tournament.createdBy.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tournament
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disciplines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shooters
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {isShooter && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tournaments.map((tournament) => (
                <tr 
                  key={tournament.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => window.location.href = `/tournaments/${tournament.id}`}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {tournament.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      by {tournament.createdBy.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(tournament.startDate), 'MMM d, yyyy')}
                    {tournament.startDate !== tournament.endDate && (
                      <> - {format(new Date(tournament.endDate), 'MMM d')}</>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {tournament.location}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {tournament.disciplines.map(td => (
                        <span 
                          key={td.id}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                        >
                          {td.discipline.displayName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {tournament._count.registrations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tournament.status)}`}>
                      {tournament.status}
                    </span>
                  </td>
                  {isShooter && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {tournament.isRegistered ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-300">
                          ✓ Registered
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

