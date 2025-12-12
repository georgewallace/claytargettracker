'use client'

import { isDemoMode, DEMO_NOTICE } from '@/lib/demoData'
import { useState, useEffect } from 'react'

export default function DemoModeNotice() {
  const [isVisible, setIsVisible] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || !isDemoMode() || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-2xl p-4 z-50 border-2 border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎭</span>
            <h3 className="font-bold text-lg">Demo Mode</h3>
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            This is a demonstration version. All data is simulated and changes won't be saved.
          </p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-white/80">
              <span className="font-semibold">Try logging in as:</span>
            </p>
            <ul className="text-xs text-white/80 mt-1 space-y-1">
              <li>• <span className="font-mono">admin@demo.com</span> (Admin)</li>
              <li>• <span className="font-mono">coach@demo.com</span> (Coach)</li>
              <li>• <span className="font-mono">athlete@demo.com</span> (athlete)</li>
            </ul>
            <p className="text-xs text-white/60 mt-2 italic">
              Password: "demo" for all accounts
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/70 hover:text-white transition flex-shrink-0"
          aria-label="Close demo notice"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

