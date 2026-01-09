import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Athlete Tournament Registration - COYESS Help',
  description: 'How athletes can register for tournaments and select time slots',
}

export default function AthleteTournamentRegistrationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/help"
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Help Center
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Athlete Tournament Registration
          </h1>
          <p className="text-gray-600 text-lg">
            Step-by-step guide for registering for tournaments and managing your schedule
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 prose prose-indigo max-w-none">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Need Help?</strong> If you encounter any issues or have questions, please contact your tournament administrator.
            </p>
          </div>

          <p className="text-gray-700">
            This guide covers how to register for tournaments, select shooting time preferences, check your squad assignments, and view leaderboard results.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Step 1: Access Tournaments</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Log into the website</li>
            <li>If not already on the tournaments page, select <strong>"Tournaments"</strong> from the menu and choose <strong>"Browse Tournaments"</strong></li>
            <li>Find the tournament you want to enter</li>
            <li>Click the <strong>"Register"</strong> button (usually in the bottom right corner of the tournament card)</li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/tournament-registration/image1.png"
              alt="Tournament listing with Register button"
              className="w-full"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Step 2: Select Disciplines</h2>
          <p className="text-gray-700">
            You will be automatically selected for all events in the tournament.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>If you want to shoot all events, keep them all selected</li>
            <li>If you don't want to shoot certain events, uncheck the ones you want to skip</li>
          </ul>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/tournament-registration/image2.png"
              alt="Discipline selection with quick registration option"
              className="w-full"
            />
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
            <p className="text-sm text-yellow-900">
              <strong>Quick Registration:</strong> If your coach will pick your squads and shooting times, you can click the checkbox on the left and you'll be registered immediately without selecting time preferences.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Step 3: Select Time Preferences (Optional)</h2>
          <p className="text-gray-700">
            If you want to indicate your preferred shooting times or guide the tournament host on what times work best for you, click <strong>"Next"</strong> to continue.
          </p>

          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Pick the best times for each event that work for you and are still open</li>
            <li>You can select multiple time preferences for each discipline</li>
            <li>
              <strong>Note:</strong> Some flight times may already be full
            </li>
            <li>Select at least 1 time choice for each event you're registered for</li>
            <li>Click <strong>"Register"</strong> when done</li>
          </ol>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
            <p className="text-sm text-blue-900">
              <strong>Time Preferences vs. Final Schedule:</strong> These are preferences only. Your coach or tournament administrator will create the final squad assignments, which may not match your exact preferences but will try to accommodate them when possible.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Step 4: Confirm Registration</h2>
          <p className="text-gray-700">
            Once registered, you'll be returned to the main tournaments page. You should see that you are registered for the tournament.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Step 5: Check Your Squad Assignment</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Click on the tournament name to open your registration details</li>
            <li>Initially, you'll see that you are "not squadded yet"</li>
            <li>Check back regularly to see when your shooting times have been scheduled</li>
            <li>Your coach or tournament administrator will squad you no later than a day or two before the tournament</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Understanding Your Squad Details</h3>
          <p className="text-gray-700">
            Once you've been squadded, your tournament registration page will show:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Shooting time</strong> for each event</li>
            <li><strong>Field number</strong> you're shooting on</li>
            <li><strong>Squad name</strong> you're assigned to</li>
            <li><strong>Division</strong> you're competing in</li>
            <li><strong>Shooting position</strong> in the squad</li>
          </ul>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/tournament-registration/image7.png"
              alt="Tournament registration details showing squad assignments"
              className="w-full"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Viewing the Leaderboard</h2>

          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 my-4">
            <p className="text-sm text-indigo-900">
              <strong>Access Requirement:</strong> Only athletes and coaches with accounts can view tournament results. This helps protect privacy and keeps competition fair.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Accessing the Leaderboard</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>From your tournament registration page, click the <strong>"Leaderboard"</strong> button</li>
            <li>Or, click on the tournament name and select "Leaderboard" from the tournament page</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Using the Leaderboard</h3>
          <p className="text-gray-700">
            The leaderboard provides multiple views of tournament results:
          </p>

          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Auto-Rotation:</strong> The leaderboard automatically rotates between different score views</li>
            <li><strong>Pause:</strong> Click "Pause" in the top left corner to stop the rotation</li>
            <li><strong>Manual Navigation:</strong> Click the view buttons at the top to see different scores:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Divisions - Scores grouped by division (Varsity, JV, etc.)</li>
                <li>Classes - Scores grouped by classification (AA, A, B, etc.)</li>
                <li>Teams - Team scoring results</li>
                <li>Squads - Squad-level results</li>
                <li>HOA/HAA - High Over All and High All Around champions</li>
              </ul>
            </li>
            <li><strong>Discipline Filter:</strong> Use the secondary menu bar below the top menu to filter by specific discipline (Skeet, Trap, etc.)</li>
          </ul>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/tournament-registration/image8.png"
              alt="Leaderboard showing tournament results with multiple views"
              className="w-full"
            />
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
            <p className="text-sm text-green-900">
              <strong>During the Tournament:</strong> Use the leaderboard to check your scores against other shooters in real-time. Scores update as they are entered by coaches and administrators.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Important Notes</h2>

          <div className="space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
              <p className="text-sm font-semibold text-yellow-900">Registration Deadlines</p>
              <p className="text-sm text-yellow-700">Make sure to register before the tournament's registration deadline. Late registrations may not be accepted.</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
              <p className="text-sm font-semibold text-yellow-900">Changes After Registration</p>
              <p className="text-sm text-yellow-700">If you need to change your registration or withdraw, contact your coach or tournament administrator as soon as possible.</p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
              <p className="text-sm font-semibold text-yellow-900">Equipment and Safety</p>
              <p className="text-sm text-yellow-700">Remember to bring all required equipment and follow all safety rules at the tournament venue.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Related Guides</h2>
          <div className="space-y-3">
            <Link
              href="/help/athlete-account-creation"
              className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                ← Athlete Account Creation
              </h3>
              <p className="text-sm text-gray-600">
                Need to create an account or join a team first?
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
