'use client'

import { useState } from 'react'

export interface ShootOffConfig {
  enableShootOffs: boolean
  shootOffTriggers: string[]
  shootOffFormat: 'sudden_death' | 'fixed_rounds' | 'progressive'
  shootOffTargetsPerRound: number
  shootOffStartStation: string
  shootOffRequiresPerfect: boolean
}

interface ShootOffSettingsProps {
  config: ShootOffConfig
  onChange: (config: ShootOffConfig) => void
}

const TRIGGER_OPTIONS = [
  { value: '1st', label: '1st Place', description: 'Tied for 1st place' },
  { value: '2nd', label: '2nd Place', description: 'Tied for 2nd place' },
  { value: '3rd', label: '3rd Place', description: 'Tied for 3rd place' },
  { value: 'top5', label: 'Top 5', description: 'Any ties in top 5 positions' },
  { value: 'top10', label: 'Top 10', description: 'Any ties in top 10 positions' },
  { value: 'perfect', label: 'Perfect Scores Only', description: 'Only when at least one athlete has perfect score' },
]

const FORMAT_OPTIONS = [
  { value: 'sudden_death', label: 'Sudden Death', description: 'Continue until one athlete misses' },
  { value: 'fixed_rounds', label: 'Fixed Rounds', description: 'Predetermined number of targets, highest wins' },
  { value: 'progressive', label: 'Progressive Difficulty', description: 'Increases difficulty if ties persist' },
]

export default function ShootOffSettings({ config, onChange }: ShootOffSettingsProps) {
  const handleTriggerToggle = (trigger: string) => {
    const triggers = config.shootOffTriggers.includes(trigger)
      ? config.shootOffTriggers.filter(t => t !== trigger)
      : [...config.shootOffTriggers, trigger]
    onChange({ ...config, shootOffTriggers: triggers })
  }

  const handleFormatChange = (format: string) => {
    onChange({ ...config, shootOffFormat: format as ShootOffConfig['shootOffFormat'] })
  }

  const handleTargetsChange = (targets: number) => {
    if (targets > 0 && targets <= 10) {
      onChange({ ...config, shootOffTargetsPerRound: targets })
    }
  }

  const handleStationChange = (station: string) => {
    onChange({ ...config, shootOffStartStation: station })
  }

  const handlePerfectChange = (requiresPerfect: boolean) => {
    onChange({ ...config, shootOffRequiresPerfect: requiresPerfect })
  }

  const handleEnableChange = (enabled: boolean) => {
    onChange({ ...config, enableShootOffs: enabled })
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Shoot-Off Configuration</h3>
        <p className="text-sm text-gray-600">
          Configure how tied scores should be resolved through shoot-offs
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enableShootOffs}
            onChange={(e) => handleEnableChange(e.target.checked)}
            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <div>
            <div className="text-sm font-medium text-gray-900">Enable Shoot-Offs</div>
            <div className="text-sm text-gray-500">Allow shoot-offs to resolve tied scores</div>
          </div>
        </label>
      </div>

      {config.enableShootOffs && (
        <div className="space-y-6 pl-8 border-l-2 border-indigo-200">
          {/* Trigger Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Trigger shoot-offs when tied for:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRIGGER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                    config.shootOffTriggers.includes(option.value)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={config.shootOffTriggers.includes(option.value)}
                      onChange={() => handleTriggerToggle(option.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Shoot-Off Format
            </label>
            <div className="space-y-2">
              {FORMAT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                    config.shootOffFormat === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="shootOffFormat"
                      value={option.value}
                      checked={config.shootOffFormat === option.value}
                      onChange={(e) => handleFormatChange(e.target.value)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Targets Per Round */}
          <div>
            <label htmlFor="targetsPerRound" className="block text-sm font-medium text-gray-700 mb-2">
              Targets Per Round
            </label>
            <input
              id="targetsPerRound"
              type="number"
              min="1"
              max="10"
              value={config.shootOffTargetsPerRound}
              onChange={(e) => handleTargetsChange(parseInt(e.target.value) || 2)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Number of targets each athlete will shoot per round (typically 1-5)
            </p>
          </div>

          {/* Start Station (Optional) */}
          <div>
            <label htmlFor="startStation" className="block text-sm font-medium text-gray-700 mb-2">
              Start Station <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              id="startStation"
              type="text"
              value={config.shootOffStartStation}
              onChange={(e) => handleStationChange(e.target.value)}
              placeholder="e.g., Station 4, Post 3"
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Specify a particular station for discipline-specific shoot-offs (e.g., "Station 4" for skeet)
            </p>
          </div>

          {/* Perfect Score Requirement */}
          <div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.shootOffRequiresPerfect}
                onChange={(e) => handlePerfectChange(e.target.checked)}
                className="mt-0.5 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Require Perfect Score</div>
                <div className="text-sm text-gray-500">
                  Only trigger shoot-offs if at least one tied athlete has a perfect score (e.g., 100/100).
                  Useful for championship rounds.
                </div>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">About Shoot-Offs</h4>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Shoot-offs are used to break ties in tournament standings, especially for podium positions.
                    Admins will be able to initiate and manage shoot-offs from the leaderboard once the tournament is complete.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

