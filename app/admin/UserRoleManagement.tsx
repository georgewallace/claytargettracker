'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function UserRoleManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)
  const [confirmResetModal, setConfirmResetModal] = useState<{
    show: boolean
    userId: string
    userName: string
  } | null>(null)
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    show: boolean
    password: string
    userName: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/promote-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole })
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(users.map(u => u.id === userId ? data.user : u))
        setMessage({ type: 'success', text: `Successfully updated ${data.user.name} to ${newRole}` })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update user role' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update user role' })
    } finally {
      setUpdating(null)
    }
  }

  const showResetConfirmation = (userId: string, userName: string) => {
    setConfirmResetModal({
      show: true,
      userId,
      userName
    })
  }

  const resetUserPassword = async () => {
    if (!confirmResetModal) return

    const { userId, userName } = confirmResetModal
    setConfirmResetModal(null) // Close confirmation modal
    setResettingPassword(userId)
    setMessage(null)
    setCopied(false) // Reset copied state

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        setResetPasswordModal({
          show: true,
          password: data.temporaryPassword,
          userName: data.user.name
        })
        setMessage({
          type: 'success',
          text: `Password reset for ${data.user.name}`
        })
      } else {
        const error = await response.json()
        setMessage({
          type: 'error',
          text: error.error || 'Failed to reset password'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to reset password'
      })
    } finally {
      setResettingPassword(null)
    }
  }

  const handleCopyPassword = () => {
    if (resetPasswordModal) {
      navigator.clipboard.writeText(resetPasswordModal.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    }
  }

  // Filter then paginate
  const filteredUsers = searchQuery.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">User Role Management</h2>
      <p className="text-sm text-gray-600 mb-6">
        Manage user roles and permissions. Admins have full access to all features.
      </p>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setCurrentPage(1) }} className="text-sm text-gray-500 hover:text-gray-700">
            Clear
          </button>
        )}
        <span className="text-sm text-gray-500">
          {filteredUsers.length} {searchQuery ? `of ${users.length}` : ''} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'coach' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2 items-center">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      disabled={updating === user.id}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="athlete">Athlete</option>
                      <option value="coach">Coach</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => showResetConfirmation(user.id, user.name)}
                      disabled={resettingPassword === user.id}
                      className="px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      title="Reset password"
                    >
                      {resettingPassword === user.id ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? `No users match "${searchQuery}"` : 'No users found'}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
            <span className="font-medium">{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
            <span className="font-medium">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? 's' : ''}
            {searchQuery && <span className="text-gray-500"> (filtered)</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-900 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmResetModal?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Confirm Password Reset
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to reset the password for <strong>{confirmResetModal.userName}</strong>?
              <br /><br />
              They will be forced to change their password on their next login.
            </p>
            <div className="flex gap-3">
              <button
                onClick={resetUserPassword}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
              >
                Yes, Reset Password
              </button>
              <button
                onClick={() => setConfirmResetModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetPasswordModal?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Password Reset for {resetPasswordModal.userName}
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This password is shown only once.
                  Copy it now and share it securely with the user.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporary Password
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resetPasswordModal.password}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={handleCopyPassword}
                  className={`px-4 py-2 rounded-md transition ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                The user will be required to change this password on their next login.
              </p>
            </div>

            <button
              onClick={() => setResetPasswordModal(null)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
