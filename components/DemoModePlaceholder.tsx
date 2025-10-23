import Link from 'next/link'

export default function DemoModePlaceholder({ pageName }: { pageName: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/10 backdrop-blur rounded-lg shadow-2xl p-12 text-center">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">🎭 Demo Mode</h1>
            <p className="text-xl mb-6">You're viewing the static demo version</p>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 mb-8">
              <p className="text-lg text-yellow-200 mb-4">
                The <strong>{pageName}</strong> page requires a live database connection
                and cannot be displayed in the static demo.
              </p>
              <p className="text-sm text-yellow-300/80">
                To see the full functionality, please run the application locally with a database.
              </p>
            </div>
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
              >
                ← Back to Home
              </Link>
              <p className="text-gray-400 text-sm mt-4">
                This is a demonstration deployment showcasing the application's UI and basic navigation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

