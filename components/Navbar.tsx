'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface NavbarProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [tournamentsOpen, setTournamentsOpen] = useState(false)
  const [teamsOpen, setTeamsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" style={{color: 'rgb(255, 107, 53)'}}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-900">Clay Target Tournaments</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {/* Tournaments Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setTournamentsOpen(true)}
              onMouseLeave={() => setTournamentsOpen(false)}
            >
              <button className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition flex items-center">
                Tournaments
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {tournamentsOpen && (
                <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      href="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      Browse Tournaments
                    </Link>
                    {user && (
                      <>
                        {user.role === 'athlete' && (
                          <Link
                            href="/history"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            My History
                          </Link>
                        )}
                        {(user.role === 'coach' || user.role === 'admin') && (
                          <Link
                            href="/tournaments/create"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            Create Tournament
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Teams Dropdown */}
            {user && (
              <div 
                className="relative"
                onMouseEnter={() => setTeamsOpen(true)}
                onMouseLeave={() => setTeamsOpen(false)}
              >
                <button className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition flex items-center">
                  Teams
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {teamsOpen && (
                  <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        href="/teams"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        Browse Teams
                      </Link>
                      {(user.role === 'coach' || user.role === 'admin') && (
                        <>
                          <Link
                            href="/teams/my-team"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            My Team
                          </Link>
                          <Link
                            href="/teams/history"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            Team History
                          </Link>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <>
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            Admin Dashboard
                          </Link>
                          <Link
                            href="/admin/coaches"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            Manage Coaches
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    href="/profile"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/help"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    Help
                  </Link>
                </div>
                <div className="text-sm text-gray-700 hidden md:block">
                  <span>Welcome, {user.name}</span>
                  {(user.role === 'coach' || user.role === 'admin') && (
                    <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                      {user.role === 'coach' ? 'Coach' : 'Admin'}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Tournaments Section */}
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tournaments
            </div>
            <Link
              href="/"
              className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
            >
              Browse Tournaments
            </Link>
            {user && (
              <>
                <Link
                  href="/history"
                  className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  My History
                </Link>
                {(user.role === 'coach' || user.role === 'admin') && (
                  <Link
                    href="/tournaments/create"
                    className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    Create Tournament
                  </Link>
                )}
              </>
            )}

            {/* Teams Section */}
            {user && (
              <>
                <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Teams
                </div>
                <Link
                  href="/teams"
                  className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  Browse Teams
                </Link>
                {(user.role === 'coach' || user.role === 'admin') && (
                  <>
                    <Link
                      href="/teams/my-team"
                      className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      My Team
                    </Link>
                    <Link
                      href="/teams/history"
                      className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      Team History
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/admin"
                      className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/coaches"
                      className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      Manage Coaches
                    </Link>
                  </>
                )}
              </>
            )}

            {/* User Menu Section */}
            {user && (
              <>
                <div className="px-3 py-2 mt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Account
                </div>
                <Link
                  href="/profile"
                  className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  Profile
                </Link>
                <Link
                  href="/help"
                  className="block px-3 py-2 pl-6 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  Help
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

