'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('athlete')
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
      // Create the user account
      const payload: any = { firstName, lastName, email, password, role }

      // Add athlete-specific fields if role is athlete
      if (role === 'athlete') {
        payload.grade = grade
        payload.firstYearCompetition = firstYearCompetition
        payload.gender = gender

        // Parse birthdate if provided
        if (birthDate) {
          const date = new Date(birthDate)
          payload.birthMonth = date.getMonth() + 1 // JavaScript months are 0-indexed
          payload.birthDay = date.getDate()
          payload.birthYear = date.getFullYear()
        }
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
        setError('Account created but login failed. Please try logging in.')
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clay Target Tournaments</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
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
              Password
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

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              I am a
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="athlete">Athlete</option>
              <option value="coach">Coach</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {role === 'coach'
                ? 'Coaches can register multiple athletes for tournaments'
                : 'Athletes can register themselves for tournaments'
              }
            </p>
          </div>

          {role === 'athlete' && (
            <>
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Grade
                </label>
                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
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

              {['sophomore', 'junior', 'senior'].includes(grade) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is this your first year of competition?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="firstYearCompetition"
                        value="true"
                        checked={firstYearCompetition === true}
                        onChange={() => setFirstYearCompetition(true)}
                        className="mr-2"
                      />
                      <span className="text-gray-900">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="firstYearCompetition"
                        value="false"
                        checked={firstYearCompetition === false}
                        onChange={() => setFirstYearCompetition(false)}
                        className="mr-2"
                      />
                      <span className="text-gray-900">No</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="M"
                      checked={gender === 'M'}
                      onChange={(e) => setGender(e.target.value)}
                      className="mr-2"
                      required
                    />
                    <span className="text-gray-900">Male</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="F"
                      checked={gender === 'F'}
                      onChange={(e) => setGender(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-gray-900">Female</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  min="1950-01-01"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {division && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
                  <p className="text-sm font-medium text-indigo-900">
                    Division Assignment
                  </p>
                  <p className="text-lg font-semibold text-indigo-600 mt-1">
                    {division}
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Based on your grade{['sophomore', 'junior', 'senior'].includes(grade) && firstYearCompetition !== null ? ' and competition experience' : ''}
                  </p>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

