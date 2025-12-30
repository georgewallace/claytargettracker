'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ApiKey {
  id: string
  name: string
  key: string
  fullKey?: string
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function ApiKeysPage() {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyExpireDays, setNewKeyExpireDays] = useState<string>('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/api-keys')
      if (!response.ok) {
        throw new Error('Failed to fetch API keys')
      }
      const data = await response.json()
      setApiKeys(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key')
      return
    }

    try {
      setCreating(true)
      setError('')

      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          expiresInDays: newKeyExpireDays ? parseInt(newKeyExpireDays) : null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create API key')
      }

      const newKey = await response.json()
      setNewlyCreatedKey(newKey)
      setShowNewKeyModal(false)
      setNewKeyName('')
      setNewKeyExpireDays('')
      await fetchApiKeys()
    } catch (err: any) {
      setError(err.message || 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle API key status')
      }

      await fetchApiKeys()
    } catch (err: any) {
      setError(err.message || 'Failed to update API key')
    }
  }

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      await fetchApiKeys()
    } catch (err: any) {
      setError(err.message || 'Failed to delete API key')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      alert('Failed to copy to clipboard')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage API keys for Excel publishing and external integrations
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Admin
              </Link>
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                + Create API Key
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Newly Created Key Modal */}
        {newlyCreatedKey && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full m-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                API Key Created Successfully!
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Important:</strong> Save this API key now. You won't be able to see it again!
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newlyCreatedKey.fullKey}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey.fullKey!)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {copySuccess ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong>
                  <br />
                  1. Copy the API key above
                  <br />
                  2. Open your TournamentTracker.xlsx file in Excel
                  <br />
                  3. Go to the "Publisher Settings" sheet
                  <br />
                  4. Paste this key in the AUTH_TOKEN field
                </p>
              </div>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Create Key Modal */}
        {showNewKeyModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New API Key
              </h3>
              <form onSubmit={handleCreateKey}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Excel Publisher - Tournament 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires In (Days) <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={newKeyExpireDays}
                    onChange={(e) => setNewKeyExpireDays(e.target.value)}
                    placeholder="Leave empty for no expiration"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewKeyModal(false)
                      setNewKeyName('')
                      setNewKeyExpireDays('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No API keys created yet.</p>
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-500"
              >
                Create your first API key
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {apiKeys.map((key) => (
                <li key={key.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {key.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            key.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Key:</span>{' '}
                          <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                            {key.key}
                          </code>
                        </p>
                        <p>
                          <span className="font-medium">Created:</span> {formatDate(key.createdAt)}
                        </p>
                        {key.lastUsedAt && (
                          <p>
                            <span className="font-medium">Last Used:</span> {formatDate(key.lastUsedAt)}
                          </p>
                        )}
                        {key.expiresAt && (
                          <p>
                            <span className="font-medium">Expires:</span> {formatDate(key.expiresAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(key.id, key.isActive)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          key.isActive
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {key.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        className="px-3 py-2 bg-red-100 text-red-800 rounded-md text-sm font-medium hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            How to Use API Keys
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Create an API key using the button above</li>
            <li>Copy the generated key (you'll only see it once!)</li>
            <li>Open your TournamentTracker.xlsx file in Excel</li>
            <li>Go to the "Publisher Settings" sheet</li>
            <li>Paste the API key in the AUTH_TOKEN field</li>
            <li>Save the Excel file and start publishing scores!</li>
          </ol>
          <p className="mt-4 text-sm text-blue-800">
            <strong>Security Note:</strong> API keys grant admin-level access. Keep them secure and don't share them publicly.
          </p>
        </div>
      </div>
    </div>
  )
}
