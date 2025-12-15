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

  if (rows.length === 0) return <div>No discipline data.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Discipline</th>
          <th>Shooters</th>
          <th>Rounds</th>
          <th>Total Hits</th>
          <th>Total Targets</th>
          <th>Avg Hits/Round</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const avgHits =
            r.Rounds > 0 ? (r.TargetsHit / r.Rounds).toFixed(1) : "-";
          return (
            <tr key={r.Discipline}>
              <td>{r.Discipline}</td>
              <td>{r.Shooters}</td>
              <td>{r.Rounds}</td>
              <td>{r.TargetsHit}</td>
              <td>{r.TargetsThrown}</td>
              <td>{avgHits}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
