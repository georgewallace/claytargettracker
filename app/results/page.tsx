import { TournamentDashboard } from '@/components/TournamentDashboard';

export const metadata = {
  title: 'Tournament Results - Clay Target Tournaments',
  description: 'Live tournament results and leaderboards from OneDrive',
};

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournament Results</h1>
              <p className="mt-2 text-sm text-gray-600">
                Live results powered by OneDrive integration (POC)
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-md">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-amber-800">Proof of Concept</span>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <TournamentDashboard />
      </div>
    </div>
  );
}
