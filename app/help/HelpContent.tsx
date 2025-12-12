'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HelpContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const TargetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'rgb(255, 107, 53)', display: 'inline'}}>
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  )

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'user-roles', title: 'User Roles', icon: '👥' },
    { id: 'tournaments', title: 'Tournaments', icon: '🏆' },
    { id: 'disciplines', title: 'Disciplines', icon: <TargetIcon /> },
    { id: 'registration', title: 'Registration', icon: '📝' },
    { id: 'teams', title: 'Teams', icon: '👨‍👩‍👧‍👦' },
    { id: 'squad-management', title: 'Squad Management', icon: '📋' },
    { id: 'score-entry', title: 'Score Entry', icon: '✏️' },
    { id: 'leaderboards', title: 'Leaderboards', icon: '📊' },
    { id: 'athlete-profiles--history', title: 'Profiles & History', icon: '📈' },
    { id: 'coach-features', title: 'Coach Features', icon: '🎓' },
    { id: 'admin-features', title: 'Admin Features', icon: '⚙️' },
  ]

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-32">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Topics</h2>
              <nav className="space-y-1">
                {filteredSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      setActiveSection(section.id)
                      document.getElementById(section.id)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      })
                    }}
                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="prose prose-indigo max-w-none">
                {/* Getting Started */}
                <section id="getting-started" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">🚀</span>
                    Getting Started
                  </h2>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Creating an Account</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Click <strong>"Sign Up"</strong> in the navigation bar</li>
                    <li>Enter your information:
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li><strong>Name</strong>: Your full name</li>
                        <li><strong>Email</strong>: Your email address</li>
                        <li><strong>Password</strong>: Choose a secure password</li>
                        <li><strong>Role</strong>: Select your role (athlete, Coach, or Admin)</li>
                      </ul>
                    </li>
                    <li>Click <strong>"Sign Up"</strong></li>
                    <li>You'll be automatically logged in</li>
                  </ol>

                  <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Logging In</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Click <strong>"Login"</strong> in the navigation bar</li>
                    <li>Enter your email and password</li>
                    <li>Click <strong>"Login"</strong></li>
                  </ol>
                </section>

                {/* User Roles */}
                <section id="user-roles" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">👥</span>
                    User Roles
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">athlete</h3>
                      <p className="text-sm text-green-800 mb-2"><strong>Can do:</strong></p>
                      <ul className="list-disc list-inside text-sm text-green-700 space-y-1 ml-4">
                        <li>Register for tournaments</li>
                        <li>Join teams</li>
                        <li>View their shooting history and statistics</li>
                        <li>Update their profile information</li>
                        <li>View leaderboards</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Coach</h3>
                      <p className="text-sm text-blue-800 mb-2"><strong>Can do:</strong></p>
                      <ul className="list-disc list-inside text-sm text-blue-700 space-y-1 ml-4">
                        <li>Everything a athlete can do</li>
                        <li>Manage their team roster (add/remove athletes)</li>
                        <li>Bulk register athletes for tournaments</li>
                        <li>Enter scores for all athletes</li>
                        <li>View team history and statistics</li>
                        <li>Manage squads for tournaments</li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-purple-900 mb-2">Admin</h3>
                      <p className="text-sm text-purple-800 mb-2"><strong>Can do:</strong></p>
                      <ul className="list-disc list-inside text-sm text-purple-700 space-y-1 ml-4">
                        <li>Everything a coach can do</li>
                        <li>Create and edit tournaments</li>
                        <li>Manage all teams</li>
                        <li>Delete registrations</li>
                        <li>Access all administrative features</li>
                      </ul>
                      <p className="text-sm text-purple-800 mt-2"><strong>Full control</strong> over the application</p>
                    </div>
                  </div>
                </section>

                {/* Quick Links for Other Sections */}
                <section id="tournaments" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">🏆</span>
                    Tournaments
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Tournaments are the main events where athletes compete. Admins can create tournaments with multiple disciplines,
                    set up schedules, and manage registrations.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-900">
                      <strong>📖 For complete tournament documentation</strong>, including creating, editing, and managing tournaments,
                      please refer to the comprehensive help guide or contact your administrator.
                    </p>
                  </div>
                </section>

                <section id="disciplines" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3" style={{color: 'rgb(255, 107, 53)'}}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="6"></circle>
                      <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                    Disciplines
                  </h2>
                  <p className="text-gray-700 mb-4">
                    The application supports four shooting disciplines:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2" style={{color: 'rgb(255, 107, 53)'}}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="6"></circle>
                          <circle cx="12" cy="12" r="2"></circle>
                        </svg>
                        Trap
                      </h4>
                      <p className="text-sm text-gray-700">Athletes stand 16 yards behind a trap house. 25 targets per round, up to 4 rounds.</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2" style={{color: 'rgb(255, 107, 53)'}}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="6"></circle>
                          <circle cx="12" cy="12" r="2"></circle>
                        </svg>
                        Skeet
                      </h4>
                      <p className="text-sm text-gray-700">8 stations in a semi-circle. 25 targets per round, up to 4 rounds.</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2" style={{color: 'rgb(255, 107, 53)'}}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="6"></circle>
                          <circle cx="12" cy="12" r="2"></circle>
                        </svg>
                        Sporting Clays
                      </h4>
                      <p className="text-sm text-gray-700">Various stations simulating hunting. 50-100 targets across 5-20 stations.</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2" style={{color: 'rgb(255, 107, 53)'}}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="6"></circle>
                          <circle cx="12" cy="12" r="2"></circle>
                        </svg>
                        5-Stand
                      </h4>
                      <p className="text-sm text-gray-700">Five shooting stations. 25-100 targets.</p>
                    </div>
                  </div>
                </section>

                {/* Continue with other sections... */}
                <section id="registration" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">📝</span>
                    Registration
                  </h2>
                  <p className="text-gray-700">
                    Athletes can register themselves for tournaments, or coaches can register their entire team at once.
                    Select which disciplines you want to compete in during registration.
                  </p>
                </section>

                <section id="teams" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">👨‍👩‍👧‍👦</span>
                    Teams
                  </h2>
                  <p className="text-gray-700">
                    Teams allow athletes to compete together and coaches to manage their roster. Teams can be created by any user,
                    and athletes can join or leave teams at any time.
                  </p>
                </section>

                <section id="squad-management" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">📋</span>
                    Squad Management
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Squads organize athletes into groups for specific time slots. Coaches and admins can create squads,
                    assign athletes using drag-and-drop, or use the auto-assign feature.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Auto-Assign Features:</h4>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1 ml-4">
                      <li>Keep teams together in squads</li>
                      <li>Group by division (skill level)</li>
                      <li>Keep teams close in time slots</li>
                      <li>Respect discipline-specific rules</li>
                      <li>Include or exclude athletes without teams/divisions</li>
                    </ul>
                  </div>
                </section>

                <section id="score-entry" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">✏️</span>
                    Score Entry
                  </h2>
                  <p className="text-gray-700">
                    Coaches and admins can enter scores for athletes using a spreadsheet-style interface.
                    Scores are entered by squad, making it easy to record results for multiple athletes at once.
                  </p>
                </section>

                <section id="leaderboards" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">📊</span>
                    Leaderboards
                  </h2>
                  <p className="text-gray-700">
                    View tournament results filtered by discipline. Top 3 performers receive medals (🥇🥈🥉).
                    Leaderboards update automatically as scores are entered.
                  </p>
                </section>

                <section id="athlete-profiles--history" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">📈</span>
                    Profiles & History
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Athletes can view their complete shooting history, track performance over time, and update their profile information.
                    Profiles include statistics, performance graphs, and division comparisons.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Profile Features:</h4>
                    <ul className="list-disc list-inside text-sm text-green-700 space-y-1 ml-4">
                      <li>Performance trends with graphs</li>
                      <li>Division average comparisons</li>
                      <li>Filter by discipline and time range</li>
                      <li>Update personal information and classifications</li>
                    </ul>
                  </div>
                </section>

                <section id="coach-features" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">🎓</span>
                    Coach Features
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Coaches have access to team management tools, bulk registration, squad management, and score entry.
                  </p>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                      <p className="text-sm font-semibold text-blue-900">Team Roster Management</p>
                      <p className="text-sm text-blue-700">Add and remove athletes from your team roster</p>
                    </div>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                      <p className="text-sm font-semibold text-blue-900">Bulk Registration</p>
                      <p className="text-sm text-blue-700">Register multiple team members for tournaments at once</p>
                    </div>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                      <p className="text-sm font-semibold text-blue-900">Team History</p>
                      <p className="text-sm text-blue-700">View performance statistics and trends for your entire team</p>
                    </div>
                  </div>
                </section>

                <section id="admin-features" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">⚙️</span>
                    Admin Features
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Admins have full control over the application, including tournament creation, coach management, and system configuration.
                  </p>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">Admin Capabilities:</h4>
                    <ul className="list-disc list-inside text-sm text-purple-700 space-y-1 ml-4">
                      <li>Create and edit tournaments with discipline configurations</li>
                      <li>Manage coaches and team assignments</li>
                      <li>Remove registrations and manage scores</li>
                      <li>Access all coach and athlete features</li>
                      <li>Configure tournament schedules and time slots</li>
                    </ul>
                  </div>
                </section>

                {/* Tips & Troubleshooting */}
                <section id="tips" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">💡</span>
                    Tips & Troubleshooting
                  </h2>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Common Issues</h3>
                  <div className="space-y-3">
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                      <p className="text-sm font-semibold text-yellow-900">Can't see certain features?</p>
                      <p className="text-sm text-yellow-700">Check your user role. Some features are only available to coaches and admins.</p>
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                      <p className="text-sm font-semibold text-yellow-900">Changes not showing?</p>
                      <p className="text-sm text-yellow-700">Try refreshing the page or clearing your browser cache.</p>
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
                      <p className="text-sm font-semibold text-yellow-900">Auto-assign not working?</p>
                      <p className="text-sm text-yellow-700">Ensure you have enough time slots and check the feedback message for details.</p>
                    </div>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">📞</span>
                    Need More Help?
                  </h2>
                  <p className="text-gray-700 mb-4">
                    If you can't find the answer you're looking for, please contact your system administrator or tournament organizer.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-900">
                      <strong>Version 2.0</strong> • Last Updated: October 2025
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

