import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all imported scores from database
    const importedScores = await prisma.importedScore.findMany({
      orderBy: [
        { discipline: 'asc' },
        { division: 'asc' },
        { shooter: 'asc' },
        { round: 'asc' },
      ],
    });

    // Transform to match the Score interface expected by components (uppercase property names)
    const scores = importedScores.map((score) => ({
      Shooter: score.shooter,
      Team: score.team,
      Gender: score.gender,
      Division: score.division,
      Discipline: score.discipline,
      Round: score.round,
      TargetsThrown: score.targetsThrown,
      TargetsHit: score.targetsHit,
      StationBreakdown: score.stationBreakdown || undefined,
      Field: score.field || undefined,
      Time: score.time || undefined,
      Notes: score.notes || undefined,
    }));

    return NextResponse.json(scores);
  } catch (error: any) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}
