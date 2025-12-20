-- AlterTable: Add shooterId to Athlete
ALTER TABLE "Athlete" ADD COLUMN "shooterId" TEXT;
CREATE UNIQUE INDEX "Athlete_shooterId_key" ON "Athlete"("shooterId");

-- AlterTable: Update Score model to support both rounds and stations
-- Rename existing columns
ALTER TABLE "Score" RENAME COLUMN "station" TO "stationNumber";
ALTER TABLE "Score" RENAME COLUMN "totalTargets" TO "maxTargets";

-- Add roundNumber column
ALTER TABLE "Score" ADD COLUMN "roundNumber" INTEGER;

-- Drop old unique constraint and create new indexes
ALTER TABLE "Score" DROP CONSTRAINT IF EXISTS "Score_shootId_station_key";
CREATE INDEX "Score_shootId_idx" ON "Score"("shootId");
CREATE INDEX "Score_shootId_roundNumber_idx" ON "Score"("shootId", "roundNumber");
CREATE INDEX "Score_shootId_stationNumber_idx" ON "Score"("shootId", "stationNumber");
