// StationAnalytics.tsx
import React, { useMemo } from "react";
import { Score, stationHits } from "../lib/models";

interface StationAnalyticsProps {
  scores: Score[];
  discipline?: string; // optional
}

interface StationAgg {
  stationIndex: number;
  totalHits: number;
  count: number; // how many rows provided data
}

export const StationAnalytics: React.FC<StationAnalyticsProps> = ({
  scores,
  discipline,
}) => {
  const rows = useMemo(() => {
    const filtered = discipline
      ? scores.filter((s) => s.Discipline === discipline)
      : scores;

    const stations = new Map<number, StationAgg>();

    for (const s of filtered) {
      const hits = stationHits(s);
      hits.forEach((h, idx) => {
        const agg = stations.get(idx) ?? {
          stationIndex: idx,
          totalHits: 0,
          count: 0,
        };
        agg.totalHits += h;
        agg.count += 1;
        stations.set(idx, agg);
      });
    }

    return Array.from(stations.values()).sort(
      (a, b) => a.stationIndex - b.stationIndex
    );
  }, [scores, discipline]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No station data available. Station breakdown must be included in the imported data.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Station
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Hits
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rounds
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Performance
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((r) => {
            const avg = r.count > 0 ? (r.totalHits / r.count).toFixed(2) : "0.00";
            const avgNum = parseFloat(avg);
            const maxPossible = 5; // Assuming 5 targets per station
            const percentage = ((avgNum / maxPossible) * 100).toFixed(1);
            const isStrong = avgNum >= 4.5;
            const isWeak = avgNum < 3.5;

            return (
              <tr key={r.stationIndex} className={isStrong ? 'bg-green-50' : isWeak ? 'bg-red-50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Station {r.stationIndex + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">
                  {avg}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {r.count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isStrong ? 'bg-green-100 text-green-800' :
                    isWeak ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {percentage}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
