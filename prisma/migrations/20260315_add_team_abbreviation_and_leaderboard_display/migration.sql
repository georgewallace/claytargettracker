ALTER TABLE "Team" ADD COLUMN "abbreviation" TEXT;
ALTER TABLE "Tournament" ADD COLUMN "leaderboardTeamDisplay" TEXT NOT NULL DEFAULT 'name';
