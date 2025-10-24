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
              <span className="text-2xl font-bold text-indigo-600">🎯</span>
              <span className="ml-2 text-xl font-bold text-gray-900">Clay Target Tracker</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Tournaments
            </Link>
            {user && (
              <>
                <Link
                  href="/history"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  My History
                </Link>
                {user.role === 'shooter' && (
                  <Link
                    href="/profile"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    My Profile
                  </Link>
                )}
                {(user.role === 'coach' || user.role === 'admin') && (
                  <>
                    <Link
                      href="/tournaments/create"
                      className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      Create Tournament
                    </Link>
                    <Link
                      href="/teams/my-team"
                      className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      My Team
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/admin/coaches"
                    className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    Manage Coaches
                  </Link>
                )}
                <Link
                  href="/teams"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Teams
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
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
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
            >
              Tournaments
            </Link>
            {user && (
              <>
                <Link
                  href="/history"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  My History
                </Link>
                {user.role === 'shooter' && (
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    My Profile
                  </Link>
                )}
                {(user.role === 'coach' || user.role === 'admin') && (
                  <>
                    <Link
                      href="/tournaments/create"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      Create Tournament
                    </Link>
                    <Link
                      href="/teams/my-team"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      My Team
                    </Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/admin/coaches"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  >
                    Manage Coaches
                  </Link>
                )}
                <Link
                  href="/teams"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  Teams
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

