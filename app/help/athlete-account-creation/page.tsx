import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Athlete Account Creation - COYESS Help',
  description: 'Step-by-step guide for athletes to create an account and join a team',
}

export default function AthleteAccountCreationPage() {
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
            Athlete Account Creation
          </h1>
          <p className="text-gray-600 text-lg">
            Step-by-step guide for athletes to create an account and join a team
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
            Follow these instructions to create your athlete account on the COYESS Tournament website. This guide covers:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-6">
            <li>Creating your athlete account</li>
            <li>Updating your profile</li>
            <li>Searching for available teams</li>
            <li>Requesting to join a team</li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> If you plan to compete only as an individual, you do not need to complete the team request section. Even if assigned to a team, you can always register for tournaments as an individual.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Step 1: Access the Website</h2>
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

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Step 2: Create Your Account</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Click the <strong>"Sign Up"</strong> button in the top right corner</li>
            <li>Click <strong>"Sign up as Athlete"</strong></li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/athlete-account/image2.png"
              alt="Sign up page showing athlete and coach options"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={3}>
            <li>Enter your information:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Name</li>
                <li>Email address</li>
                <li>Secure password</li>
                <li>Any other required details</li>
              </ul>
            </li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/athlete-account/image3.png"
              alt="Athlete account creation form"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={4}>
            <li>Click <strong>"Create Athlete Account"</strong> at the bottom</li>
          </ol>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Step 3: Update Your Profile</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>At the top of the page, select the <strong>"Profile"</strong> link</li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/athlete-account/image4.png"
              alt="Profile link in navigation"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={2}>
            <li>Complete any missing profile details</li>
            <li>
              <strong className="text-red-600">Important:</strong> Enter your phone number so we can contact you during tournaments
            </li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/athlete-account/image5.png"
              alt="Profile details form"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={4}>
            <li>If you know your classifications and membership numbers for national shooting organizations (ATA, NSSA, NSCA), you can enter them</li>
            <li>Click <strong>"Save Profile"</strong> to record your changes</li>
          </ol>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
            <p className="text-sm text-green-900">
              <strong>Success!</strong> At this point, you are registered as an individual athlete and can proceed to registering for tournaments.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Finding and Joining a Team (Optional)</h2>
          <p className="text-gray-700">
            Use this section to review available teams, determine coaches, and request to join a team.
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
            <p className="text-sm text-yellow-900">
              <strong>Recommendation:</strong> Do not request to join a team until you have contacted the head coach and they verbally agree you can join. Alternatively, let your coach know you're in the system and they can assign you to the team.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Browse Teams</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Hover over the <strong>"Teams"</strong> menu at the top of the page</li>
            <li>Click <strong>"Browse Teams"</strong> from the dropdown</li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/athlete-account/image8.png"
              alt="Teams menu with Browse Teams option"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={3}>
            <li>Look for your team by:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Team name</li>
                <li>Coaches listed</li>
                <li>Teammates who have already joined</li>
              </ul>
            </li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/athlete-account/image9.png"
              alt="Team listing with Request to Join button"
              className="w-full"
            />
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <p className="text-sm text-red-900">
              <strong>Can't find your team?</strong> Stop and contact your coach separately. Continue only after they confirm the team has been created.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Request to Join a Team</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Once you've found your team, click the <strong>"Request to Join"</strong> button</li>
            <li>You'll be prompted to send a request
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>You can enter an optional message to the coach</li>
              </ul>
            </li>
          </ol>

          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <img
              src="/help-images/athlete-account/image10.png"
              alt="Request to join team modal"
              className="w-full"
            />
          </div>

          <ol className="list-decimal list-inside space-y-3 text-gray-700" start={3}>
            <li>Click <strong>"Send Request"</strong></li>
            <li>Notify your coach that you've requested to join so they can approve it</li>
          </ol>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">After Requesting</h3>
          <p className="text-gray-700">
            The Teams page will update and you should see your pending request listed above the team list. Once your coach approves the request, you'll see the status change to "Approved" and you'll be officially part of the team.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Next Steps</h2>
          <div className="space-y-3">
            <Link
              href="/help/athlete-tournament-registration"
              className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                → Athlete Tournament Registration
              </h3>
              <p className="text-sm text-gray-600">
                Learn how to register for tournaments and select time slots
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
