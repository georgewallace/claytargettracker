// models.ts
export type Gender = "Men" | "Ladies";

export type Division =
  | "Novice"
  | "Intermediate"
  | "JV"
  | "Varsity"
  | "Collegiate";

export interface Score {
  Shooter: string;
  Team: string;
  Gender: Gender;
  Division: Division;
  Discipline: string;
  Round: number;
  TargetsThrown: number;
  TargetsHit: number;
  StationBreakdown?: string; // "5,5,4,4,5"
  Field?: string;
  Time?: string;
  Notes?: string;
}

export function parseScoreRow(row: any): Score {
  return {
    Shooter: row.Shooter,
    Team: row.Team,
    Gender: row.Gender,
    Division: row.Division,
    Discipline: row.Discipline,
    Round: Number(row.Round),
    TargetsThrown: Number(row.TargetsThrown),
    TargetsHit: Number(row.TargetsHit),
    StationBreakdown: row.StationBreakdown ?? "",
    Field: row.Field ?? "",
    Time: row.Time ?? "",
    Notes: row.Notes ?? "",
  };
}

export function stationHits(row: Score): number[] {
  if (!row.StationBreakdown) return [];
  return row.StationBreakdown.split(",").map((v) => Number(v.trim()) || 0);
}