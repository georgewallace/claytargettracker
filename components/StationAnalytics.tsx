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

  if (rows.length === 0) return <div>No station data.</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Station</th>
          <th>Avg Hits</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const avg = r.count > 0 ? (r.totalHits / r.count).toFixed(2) : "-";
          return (
            <tr key={r.stationIndex}>
              <td>{r.stationIndex + 1}</td>
              <td>{avg}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
