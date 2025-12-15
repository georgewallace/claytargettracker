// DisciplineBreakdown.tsx
import React, { useMemo } from "react";
import { Score } from "../lib/models";

interface DisciplineBreakdownProps {
  scores: Score[];
}

interface DisciplineAggregate {
  Discipline: string;
  Rounds: number;
  Shooters: number;
  TargetsHit: number;
  TargetsThrown: number;
}

export const DisciplineBreakdown: React.FC<DisciplineBreakdownProps> = ({
  scores,
}) => {
  const rows = useMemo(() => {
    const byDisc = new Map<string, DisciplineAggregate>();
    const shootersByDisc = new Map<string, Set<string>>();

    for (const s of scores) {
      const key = s.Discipline;
      const agg = byDisc.get(key) ?? {
        Discipline: key,
        Rounds: 0,
        Shooters: 0,
        TargetsHit: 0,
        TargetsThrown: 0,
      };
      agg.Rounds += 1;
      agg.TargetsHit += s.TargetsHit;
      agg.TargetsThrown += s.TargetsThrown;
      byDisc.set(key, agg);

      const set = shootersByDisc.get(key) ?? new Set<string>();
      set.add(s.Shooter);
      shootersByDisc.set(key, set);
    }

    for (const [disc, set] of shootersByDisc.entries()) {
      const agg = byDisc.get(disc)!;
      agg.Shooters = set.size;
    }

    return Array.from(byDisc.values()).sort((a, b) =>
      a.Discipline.localeCompare(b.Discipline),
    );
  }, [scores]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No discipline data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Discipline
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shooters
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rounds
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Hits
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Targets
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Hits/Round
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((r) => {
            const avgHits =
              r.Rounds > 0 ? (r.TargetsHit / r.Rounds).toFixed(1) : "0.0";
            const percentage =
              r.TargetsThrown > 0
                ? ((r.TargetsHit / r.TargetsThrown) * 100).toFixed(1)
                : "0.0";

            return (
              <tr key={r.Discipline} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {r.Discipline}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {r.Shooters}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {r.Rounds}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  {r.TargetsHit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {r.TargetsThrown}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div className="font-semibold text-indigo-600">{avgHits}</div>
                  <div className="text-xs text-gray-500">({percentage}%)</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
