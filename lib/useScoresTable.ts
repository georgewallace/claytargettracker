"use client"

// useScoresTable.ts
import { useEffect, useState } from "react";
import { graphGet } from "./graphClient";
import { Score, parseScoreRow } from "./models";

export interface ScoreRow {
  [key: string]: any; // we’ll refine in section 3
}

interface UseScoresTableResult {
  data: Score[];
  loading: boolean;
  error: string | null;
}

const workbookPath = "/Tournaments/2025/Scores.xlsx";
const tableName = "ScoresTable";

function mapGraphRowsToObjects(headers: string[], rows: any[]): ScoreRow[] {
  return rows.map((row: any) => {
    const obj: ScoreRow = {};
    row.values[0].forEach((value: any, i: number) => {
      obj[headers[i]] = value;
    });
    return obj;
  });
}

export function useScoresTable(): UseScoresTableResult {
  const [data, setData] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headerUrl = `/me/drive/root:${workbookPath}:/workbook/tables('${tableName}')/headerRowRange`;
        const rowsUrl = `/me/drive/root:${workbookPath}:/workbook/tables('${tableName}')/rows`;

        const [headerJson, rowsJson] = await Promise.all([
          graphGet<any>(headerUrl),
          graphGet<any>(rowsUrl),
        ]);

        const headers: string[] = headerJson.values[0];
        const rows = rowsJson.value;

        const mapped = mapGraphRowsToObjects(headers, rows).map(parseScoreRow);

        if (!cancelled) {
          setData(mapped);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}