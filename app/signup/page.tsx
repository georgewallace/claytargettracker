'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to athlete signup after a brief moment to show the page
    const timer = setTimeout(() => {
      router.push('/signup/athlete')
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Account Type</h1>
        <p className="text-gray-600 mb-6">Select how you want to sign up</p>

        <div className="space-y-4">
          <Link
            href="/signup/athlete"
            className="block w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            🎯 Sign up as Athlete
          </Link>

          <Link
            href="/signup/coach"
            className="block w-full px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
          >
            👥 Sign up as Coach
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
