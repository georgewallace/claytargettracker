export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" style={{color: 'rgb(255, 107, 53)'}}>
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              Clay Target Tracker
            </h3>
            <p className="text-sm text-gray-600">
              Track tournaments, manage scores, and compete with shooters from around the region.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/" className="hover:text-indigo-600 transition">
                  Tournaments
                </a>
              </li>
              <li>
                <a href="/teams" className="hover:text-indigo-600 transition">
                  Teams
                </a>
              </li>
              <li>
                <a href="/tournaments/create" className="hover:text-indigo-600 transition">
                  Create Tournament
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">About</h4>
            <p className="text-sm text-gray-600">
              Built with Next.js, TypeScript, and Tailwind CSS. 
              Open source and ready for customization.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Clay Target Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

