'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function AthleteSignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Athlete-specific fields
  const [grade, setGrade] = useState('')
  const [firstYearCompetition, setFirstYearCompetition] = useState<boolean | null>(null)
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')

  // Calculate division based on grade and first year status
  const calculateDivision = (): string => {
    if (!grade) return ''

    // Novice: 5th and 6th grade
    if (grade === '5th' || grade === '6th') {
      return 'Novice'
    }

    // Intermediate: 7th and 8th grade
    if (grade === '7th' || grade === '8th') {
      return 'Intermediate'
    }

    // High school (9th-12th)
    if (['freshman', 'sophomore', 'junior', 'senior'].includes(grade)) {
      // JV: Freshman (always) OR 10-12th grade first year
      if (grade === 'freshman') {
        return 'Junior Varsity'
      }
      if (['sophomore', 'junior', 'senior'].includes(grade) && firstYearCompetition === true) {
        return 'Junior Varsity'
      }
      // Varsity: 10-12th grade not first year
      if (['sophomore', 'junior', 'senior'].includes(grade) && firstYearCompetition === false) {
        return 'Varsity'
      }
    }

    // College/Trade School
    if (grade === 'college') {
      return 'Collegiate'
    }

    return ''
  }

  const division = calculateDivision()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: any = {
        firstName,
        lastName,
        email,
        password,
        role: 'athlete',
        grade,
        firstYearCompetition,
        gender
      }

      // Parse birthdate if provided
      if (birthDate) {
        const date = new Date(birthDate)
        payload.birthMonth = date.getMonth() + 1
        payload.birthDay = date.getDate()
        payload.birthYear = date.getFullYear()
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      // Sign in the newly created user
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but sign in failed. Please try signing in.')
        return
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Athlete Sign Up</h1>
          <p className="text-gray-600 mt-2">Create your athlete account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Account Fields */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {/* Athlete-Specific Fields */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Athlete Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Birth Date *
                </label>
                <input
                  id="birthDate"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                Current Grade *
              </label>
              <select
                id="grade"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select grade</option>
                <option value="5th">5th Grade</option>
                <option value="6th">6th Grade</option>
                <option value="7th">7th Grade</option>
                <option value="8th">8th Grade</option>
                <option value="freshman">9th Grade (Freshman)</option>
                <option value="sophomore">10th Grade (Sophomore)</option>
                <option value="junior">11th Grade (Junior)</option>
                <option value="senior">12th Grade (Senior)</option>
                <option value="college">College/Trade School</option>
              </select>
            </div>

            {/* First Year Competition - Only show for high school */}
            {['sophomore', 'junior', 'senior'].includes(grade) && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Is this your first year competing? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="firstYear"
                      required
                      checked={firstYearCompetition === true}
                      onChange={() => setFirstYearCompetition(true)}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-gray-900 font-medium">Yes</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="firstYear"
                      required
                      checked={firstYearCompetition === false}
                      onChange={() => setFirstYearCompetition(false)}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-gray-900 font-medium">No</span>
                  </label>
                </div>
              </div>
            )}

            {/* Show calculated division */}
            {division && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                <p className="text-sm text-indigo-900">
                  <strong>Your Division:</strong> {division}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Creating account...' : 'Create Athlete Account'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Are you a coach?{' '}
            <Link href="/signup/coach" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign up as a coach
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
