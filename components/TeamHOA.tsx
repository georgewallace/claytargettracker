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

  if (rows.length === 0) return <div>No team scores yet.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team</th>
          <th>Total Hits</th>
          <th>Total Targets</th>
          <th>Percent</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const pct =
            r.TargetsThrown > 0
              ? ((r.TargetsHit / r.TargetsThrown) * 100).toFixed(1)
              : "-";
          return (
            <tr key={r.Team}>
              <td>{i + 1}</td>
              <td>{r.Team}</td>
              <td>{r.TargetsHit}</td>
              <td>{r.TargetsThrown}</td>
              <td>{pct}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};