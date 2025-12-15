"use client"

import React from "react";
import Link from "next/link";
import { useScoresTable } from "../lib/useScoresTable";
import { Leaderboard } from "./Leaderboard";
import { TeamHoa } from "./TeamHOA";
import { DisciplineBreakdown } from "./DisciplineBreakdown";
import { StationAnalytics } from "./StationAnalytics";

export const TournamentDashboard: React.FC = () => {
  const { data, loading, error } = useScoresTable();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournament results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="h-6 w-6 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Results</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900">No Results Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No tournament results have been imported yet.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/import-results"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall Leaderboard */}
      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Overall Leaderboard</h2>
          <p className="mt-1 text-sm text-gray-600">All disciplines and divisions</p>
        </div>
        <div className="p-6">
          <Leaderboard scores={data} />
        </div>
      </section>

      {/* Varsity Ladies Trap */}
      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Varsity Ladies Trap</h2>
          <p className="mt-1 text-sm text-gray-600">Top performers in this division</p>
        </div>
        <div className="p-6">
          <Leaderboard
            scores={data}
            discipline="Trap"
            division="Varsity"
            gender="Ladies"
          />
        </div>
      </section>

      {/* Team HOA */}
      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Team High Overall Average</h2>
          <p className="mt-1 text-sm text-gray-600">Top performing teams across all disciplines</p>
        </div>
        <div className="p-6">
          <TeamHoa scores={data} />
        </div>
      </section>

      {/* Discipline Breakdown */}
      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Discipline Breakdown</h2>
          <p className="mt-1 text-sm text-gray-600">Statistics by shooting discipline</p>
        </div>
        <div className="p-6">
          <DisciplineBreakdown scores={data} />
        </div>
      </section>

      {/* Station Analytics */}
      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Station Analytics (Trap)</h2>
          <p className="mt-1 text-sm text-gray-600">Performance breakdown by station</p>
        </div>
        <div className="p-6">
          <StationAnalytics scores={data} discipline="Trap" />
        </div>
      </section>
    </div>
  );
};
