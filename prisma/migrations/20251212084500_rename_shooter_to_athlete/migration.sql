-- Rename Shooter to Athlete and ShooterAverage to AthleteAverage
-- This migration preserves all existing data

-- Step 1: Rename the Shooter table to Athlete
ALTER TABLE "Shooter" RENAME TO "Athlete";

-- Step 2: Rename the ShooterAverage table to AthleteAverage
ALTER TABLE "ShooterAverage" RENAME TO "AthleteAverage";

-- Step 3: Rename shooterId column to athleteId in dependent tables
ALTER TABLE "SquadMember" RENAME COLUMN "shooterId" TO "athleteId";
ALTER TABLE "Registration" RENAME COLUMN "shooterId" TO "athleteId";
ALTER TABLE "Shoot" RENAME COLUMN "shooterId" TO "athleteId";
ALTER TABLE "TeamJoinRequest" RENAME COLUMN "shooterId" TO "athleteId";
ALTER TABLE "AthleteAverage" RENAME COLUMN "shooterId" TO "athleteId";

-- Step 4: Rename indexes to match new column names
-- SquadMember indexes
ALTER INDEX "SquadMember_shooterId_idx" RENAME TO "SquadMember_athleteId_idx";

-- Registration indexes
ALTER INDEX "Registration_shooterId_idx" RENAME TO "Registration_athleteId_idx";

-- Shoot indexes (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Shoot_shooterId_idx'
  ) THEN
    ALTER INDEX "Shoot_shooterId_idx" RENAME TO "Shoot_athleteId_idx";
  END IF;
END $$;

-- TeamJoinRequest indexes
ALTER INDEX "TeamJoinRequest_shooterId_idx" RENAME TO "TeamJoinRequest_athleteId_idx";

-- AthleteAverage indexes
ALTER INDEX "ShooterAverage_shooterId_idx" RENAME TO "AthleteAverage_athleteId_idx";
ALTER INDEX "ShooterAverage_disciplineId_idx" RENAME TO "AthleteAverage_disciplineId_idx";

-- Step 5: Rename unique constraints
ALTER INDEX "ShooterAverage_shooterId_disciplineId_key" RENAME TO "AthleteAverage_athleteId_disciplineId_key";
ALTER INDEX "Registration_tournamentId_shooterId_key" RENAME TO "Registration_tournamentId_athleteId_key";
ALTER INDEX "Shoot_tournamentId_shooterId_disciplineId_key" RENAME TO "Shoot_tournamentId_athleteId_disciplineId_key";
ALTER INDEX "SquadMember_squadId_shooterId_key" RENAME TO "SquadMember_squadId_athleteId_key";
ALTER INDEX "TeamJoinRequest_teamId_shooterId_key" RENAME TO "TeamJoinRequest_teamId_athleteId_key";

-- Step 6: Rename foreign key constraints
-- Note: PostgreSQL foreign key constraint names are auto-generated
-- We'll drop and recreate them with the new column names

-- SquadMember foreign key
ALTER TABLE "SquadMember" DROP CONSTRAINT "SquadMember_shooterId_fkey";
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Registration foreign key
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_shooterId_fkey";
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Shoot foreign key
ALTER TABLE "Shoot" DROP CONSTRAINT "Shoot_shooterId_fkey";
ALTER TABLE "Shoot" ADD CONSTRAINT "Shoot_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TeamJoinRequest foreign key
ALTER TABLE "TeamJoinRequest" DROP CONSTRAINT "TeamJoinRequest_shooterId_fkey";
ALTER TABLE "TeamJoinRequest" ADD CONSTRAINT "TeamJoinRequest_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AthleteAverage foreign key
ALTER TABLE "AthleteAverage" DROP CONSTRAINT "ShooterAverage_shooterId_fkey";
ALTER TABLE "AthleteAverage" ADD CONSTRAINT "AthleteAverage_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
