"use client"

// useScoresTable.ts
import { useEffect, useState } from "react";
import { Score } from "./models";

interface UseScoresTableResult {
  data: Score[];
  loading: boolean;
  error: string | null;
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
        // Fetch imported scores from database
        const response = await fetch('/api/scores');
        if (!response.ok) {
          throw new Error(`Failed to load scores: ${response.status} ${response.statusText}`);
        }

        const scores = await response.json();

        if (!cancelled) {
          setData(scores);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Error loading scores:", e);
          setError(e.message ?? "Unknown error loading scores");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
