// TeamHoa.tsx
import React, { useMemo } from "react";
import { Score } from "../lib/models";

interface TeamHoaProps {
  scores: Score[];
  discipline?: string; // optional, for overall or per-discipline HOA
  division?: string;
  gender?: string;
  limit?: number;
}

interface TeamAggregate {
  Team: string;
  TargetsHit: number;
  TargetsThrown: number;
}

export const TeamHoa: React.FC<TeamHoaProps> = ({
  scores,
  discipline,
  division,
  gender,
  limit = 10,
}) => {
  const rows = useMemo(() => {
    let filtered = scores;

    if (discipline) {
      filtered = filtered.filter((s) => s.Discipline === discipline);
    }
    if (division) {
      filtered = filtered.filter((s) => s.Division === division);
    }
    if (gender) {
      filtered = filtered.filter((s) => s.Gender === gender);
    }

    const map = new Map<string, TeamAggregate>();

    for (const s of filtered) {
      const key = s.Team;
      const existing = map.get(key) ?? {
        Team: s.Team,
        TargetsHit: 0,
        TargetsThrown: 0,
      };

      existing.TargetsHit += s.TargetsHit;
      existing.TargetsThrown += s.TargetsThrown;

      map.set(key, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.TargetsHit - a.TargetsHit)
      .slice(0, limit);
  }, [scores, discipline, division, gender, limit]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No team scores available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Team
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Hits
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Targets
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Percent
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((r, i) => {
            const pct =
              r.TargetsThrown > 0
                ? ((r.TargetsHit / r.TargetsThrown) * 100).toFixed(1)
                : "0.0";
            const isTopThree = i < 3;

            return (
              <tr key={`${r.Team}-${i}`} className={isTopThree ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {i === 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">🥇 1st</span>}
                  {i === 1 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">🥈 2nd</span>}
                  {i === 2 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">🥉 3rd</span>}
                  {i > 2 && <span className="font-medium">{i + 1}</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {r.Team}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {r.TargetsHit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {r.TargetsThrown}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">
                  {pct}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};