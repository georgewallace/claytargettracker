import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coach Account & Team Creation - COYESS Help',
  description: 'Instructions for coaches to create accounts and set up teams',
}

export default function CoachAccountTeamCreationPage() {
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
            Coach Account & Team Creation
          </h1>
          <p className="text-gray-600 text-lg">
            Step-by-step guide for coaches to create accounts and manage teams
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
            This guide covers how to create your head coach account, create a team, and manage your roster. It also includes instructions for assistant coaches to join teams.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Head Coach Account Setup</h2>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 1: Access the Website</h3>
          <p className="text-gray-700">
            Go to the COYESS website at{' '}
            <a href="https://co.usayess.org/" className="text-indigo-600 hover:underline">
              Colorado Youth Education in Shooting Sports
            </a>
            {' '}and select the "Events" link, then select "Register for Tournaments".
          </p>
          <p className="text-gray-700">
            Or go directly to:{' '}
            <a href="https://www.coyess.net/" className="text-indigo-600 hover:underline">
              COYESS Tournaments
            </a>
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 2: Create Your Coach Account</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Click the <strong>"Sign Up"</strong> button in the top right corner</li>
            <li>Click <strong>"Sign up as Coach"</strong></li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/coach-account/image2.png"
              alt="Sign up page"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={3}>
            <li>Enter your information including a secure password</li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/coach-account/image3.png"
              alt="Coach account creation form"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={4}>
            <li>Click <strong>"Create Coach Account"</strong> at the bottom</li>
            <li>You'll be redirected to the main page after account creation</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 3: Update Your Profile</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Click the <strong>"Profile"</strong> link in the top right corner</li>
            <li>Update any remaining profile details</li>
            <li>You can also change your password from this page</li>
            <li>Click <strong>"Save"</strong> to save your changes</li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Creating Your Team</h2>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 4: Navigate to Teams</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Hover over the <strong>"Teams"</strong> menu at the top</li>
            <li>Select <strong>"Browse Teams"</strong> from the dropdown</li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/coach-account/image7.png"
              alt="Teams menu"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={3}>
            <li>Click the <strong>"+ Create New Team"</strong> button in the upper right corner</li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/coach-account/image8.png"
              alt="Teams page with Create New Team button"
              className="w-full"
            />
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 5: Fill in Team Information</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Enter your team name and information</li>
            <li>Fill in the head coach information (should match your profile)</li>
            <li>
              <strong className="text-red-600">Important:</strong> Enter a valid phone number (preferably cell) and your address:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>We need your phone to contact you in emergencies during tournaments</li>
                <li>We need your address in case we need to mail awards after tournaments</li>
              </ul>
            </li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/coach-account/image9.png"
              alt="Team creation form"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={4}>
            <li>Click <strong>"Create Team"</strong></li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Managing Your Team</h2>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 6: Access Team Management</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>After creating your team, you'll be redirected to a page showing your team</li>
            <li>Click the <strong>"Manage Team"</strong> button</li>
            <li>From here you can:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Upload a team logo</li>
                <li>Add coaches and athletes</li>
                <li>Manage join requests</li>
                <li>View your roster</li>
              </ul>
            </li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Managing Coach Requests</h3>
          <p className="text-gray-700">
            Once other coaches have created accounts, they can request to join your team. You'll see pending coach requests on the Manage Team page.
          </p>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Go to <strong>"Teams" → "My Team"</strong></li>
            <li>You'll see any pending coach join requests</li>
            <li>Click <strong>"Approve"</strong> or <strong>"Reject"</strong> for each request</li>
          </ol>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Once a coach is added to your team, they have the same rights as you. They can assign athletes, register the team for tournaments, squad athletes, and perform other administrative tasks.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Adding Athletes to Your Team</h3>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
            <p className="text-sm text-yellow-900">
              <strong>Before adding athletes:</strong> Athletes must first create their own individual accounts. We recommend asking your athletes to create accounts before attempting to add them to your team.
            </p>
          </div>

          <p className="text-gray-700">
            There are two ways athletes can join your team:
          </p>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Option 1: Athletes Request to Join</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Athletes create their accounts</li>
            <li>They browse teams and find yours</li>
            <li>They click "Request to Join"</li>
            <li>You see their request in "Manage Team" and approve it</li>
          </ol>

          <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Option 2: You Add Athletes Directly</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to <strong>"Teams" → "My Team"</strong></li>
            <li>Scroll to the <strong>"Add Athletes"</strong> section</li>
            <li>You'll see a list of athletes who have registered but aren't on a team</li>
            <li>Select the athletes you want to add</li>
            <li>Click <strong>"Add to Team"</strong></li>
          </ol>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <p className="text-sm text-red-900">
              <strong>Important:</strong> Please do not add athletes who are not part of your formal team.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Viewing Your Roster</h3>
          <p className="text-gray-700">
            After accepting requests or adding athletes, your roster will update in the "Current Roster" section of the Manage Team page, showing all athletes assigned to your team.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Assistant Coach Setup</h2>

          <p className="text-gray-700">
            Assistant coaches follow similar steps but don't need to create a team.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 1: Create Account</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Follow the same account creation steps as head coaches</li>
            <li>Sign up as a Coach</li>
            <li>Complete and save your profile</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 2: Request to Join Team</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Go to <strong>"Teams" → "Browse Teams"</strong></li>
            <li>Find the team you want to join</li>
            <li>Click <strong>"Request to Join as Coach"</strong></li>
            <li>Wait for the head coach to approve your request</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Step 3: Access Your Team</h3>
          <p className="text-gray-700">
            Once approved, go to <strong>"Teams" → "My Team"</strong> to access your team's management page. You'll have the same permissions as the head coach.
          </p>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
            <p className="text-sm text-green-900">
              <strong>Setup Complete!</strong> You've successfully created your coach account and team. You can now manage your roster, register for tournaments, and squad your athletes.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Next Steps</h2>
          <div className="space-y-3">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Team Management
              </h3>
              <p className="text-sm text-gray-600">
                Register your team for tournaments, manage your roster, and squad your athletes for events
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
