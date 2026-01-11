'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HelpContent() {
  const [searchQuery, setSearchQuery] = useState('')

  const guides = [
    {
      id: 'athlete-account-creation',
      title: 'Athlete Account Creation',
      description: 'Complete step-by-step instructions for athletes to create an account and join a team',
      icon: '🏃',
      color: 'green',
      pdfPath: '/help-pdfs/COYESS Athlete Account Creation Instructions.pdf'
    },
    {
      id: 'coach-account-team-creation',
      title: 'Coach Account & Team Creation',
      description: 'Instructions for coaches to create accounts, set up teams, and manage rosters',
      icon: '👨‍🏫',
      color: 'blue',
      pdfPath: '/help-pdfs/COYESS Coach Account-Team Creation Instructions.pdf'
    },
    {
      id: 'athlete-tournament-registration',
      title: 'Athlete Tournament Registration',
      description: 'How to register for tournaments, select time slots, and view leaderboards',
      icon: '🏆',
      color: 'purple',
      pdfPath: '/help-pdfs/COYESS Athlete Tournament Registration Instructions.pdf'
    },
    {
      id: 'team-tournament-registration',
      title: 'Team Tournament Registration',
      description: 'Team registration, athlete squadding, and reviewing scores during tournaments',
      icon: '👥',
      color: 'orange',
      pdfPath: '/help-pdfs/COYESS Team Tournament Registration Instructions.pdf'
    },
  ]

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
              <p className="mt-1 text-sm text-gray-600">
                Everything you need to know about COYESS Tournaments
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredGuides.map((guide) => {
            const colorClasses = {
              green: 'border-green-300 bg-green-50 hover:border-green-500 hover:shadow-green-200',
              blue: 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:shadow-blue-200',
              purple: 'border-purple-300 bg-purple-50 hover:border-purple-500 hover:shadow-purple-200',
              orange: 'border-orange-300 bg-orange-50 hover:border-orange-500 hover:shadow-orange-200',
            }[guide.color]

            const textColorClasses = {
              green: 'text-green-700',
              blue: 'text-blue-700',
              purple: 'text-purple-700',
              orange: 'text-orange-700',
            }[guide.color]

            return (
              <a
                key={guide.id}
                href={guide.pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-6 border-2 rounded-lg hover:shadow-xl transition-all ${colorClasses}`}
              >
                <div className="text-4xl mb-3">{guide.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {guide.title}
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  {guide.description}
                </p>
                <span className={`text-sm font-medium ${textColorClasses}`}>Download PDF →</span>
              </a>
            )
          })}
        </div>

        {filteredGuides.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No guides found matching your search.</p>
          </div>
        )}

        {/* Need More Help */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">📞</span>
            Need More Help?
          </h2>
          <p className="text-gray-700 mb-4">
            If you can't find the answer you're looking for in these guides, please contact your tournament administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

