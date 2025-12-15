"use client"

// TournamentDashboard.tsx
import React from "react";
import { useScoresTable } from "../lib/useScoresTable";
import { Leaderboard } from "./Leaderboard";
import { TeamHoa } from "./TeamHOA";
import { DisciplineBreakdown } from "./DisciplineBreakdown";
import { StationAnalytics } from "./StationAnalytics";

export const TournamentDashboard: React.FC = () => {
  const { data, loading, error } = useScoresTable();

  if (loading) return <div>Loading scores…</div>;
  if (error) return <div>Error: {error}</div>;
  if (data.length === 0) return <div>No scores found.</div>;

  return (
    <div style={{ display: "grid", gap: "2rem" }}>
      <section>
        <h2>Overall Leaderboard (All Disciplines)</h2>
        <Leaderboard scores={data} />
      </section>

      <section>
        <h2>Varsity Ladies Trap</h2>
        <Leaderboard
          scores={data}
          discipline="Trap"
          division="Varsity"
          gender="Ladies"
        />
      </section>

      <section>
        <h2>Team HOA (All Disciplines)</h2>
        <TeamHoa scores={data} />
      </section>

      <section>
        <h2>Discipline Breakdown</h2>
        <DisciplineBreakdown scores={data} />
      </section>

      <section>
        <h2>Station Analytics (Trap)</h2>
        <StationAnalytics scores={data} discipline="Trap" />
      </section>
    </div>
  );
};
