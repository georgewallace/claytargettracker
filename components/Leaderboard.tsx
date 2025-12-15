// Leaderboard.tsx
import React, { useMemo } from "react";
import { Score } from "../lib/models";

interface LeaderboardProps {
  scores: Score[];
  discipline?: string;
  division?: string;
  gender?: string;
  limit?: number;
}

interface ShooterAggregate {
  Shooter: string;
  Team: string;
  Gender: string;
  Division: string;
  Discipline: string;
  TargetsHit: number;
  TargetsThrown: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  scores,
  discipline,
  division,
  gender,
  limit = 20,
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

    const map = new Map<string, ShooterAggregate>();

    for (const s of filtered) {
      const key = s.Shooter;
      const existing = map.get(key) ?? {
        Shooter: s.Shooter,
        Team: s.Team,
        Gender: s.Gender,
        Division: s.Division,
        Discipline: discipline ?? "All",
        TargetsHit: 0,
        TargetsThrown: 0,
      };

      existing.TargetsHit += s.TargetsHit;
      existing.TargetsThrown += s.TargetsThrown;

      map.set(key, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.TargetsHit - a.TargetsHit
    ).slice(0, limit);
  }, [scores, discipline, division, gender, limit]);

  if (rows.length === 0) return <div>No scores yet.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Shooter</th>
          <th>Team</th>
          <th>Gender</th>
          <th>Division</th>
          <th>Hits</th>
          <th>Targets</th>
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
            <tr key={r.Shooter}>
              <td>{i + 1}</td>
              <td>{r.Shooter}</td>
              <td>{r.Team}</td>
              <td>{r.Gender}</td>
              <td>{r.Division}</td>
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