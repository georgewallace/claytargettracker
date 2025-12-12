-- CORRECTED: Rename Shooter to Athlete and ShooterAverage to AthleteAverage
-- This migration only renames indexes that actually exist in the database

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
ALTER TABLE "ShootOffParticipant" RENAME COLUMN "shooterId" TO "athleteId";

-- Step 4: Rename indexes to match new column names (ONLY ONES THAT EXIST)
-- SquadMember indexes
ALTER INDEX "SquadMember_shooterId_idx" RENAME TO "SquadMember_athleteId_idx";
ALTER INDEX "SquadMember_squadId_shooterId_key" RENAME TO "SquadMember_squadId_athleteId_key";

-- TeamJoinRequest indexes
ALTER INDEX "TeamJoinRequest_shooterId_idx" RENAME TO "TeamJoinRequest_athleteId_idx";
ALTER INDEX "TeamJoinRequest_teamId_shooterId_key" RENAME TO "TeamJoinRequest_teamId_athleteId_key";

-- ShooterAverage -> AthleteAverage indexes
ALTER INDEX "ShooterAverage_shooterId_idx" RENAME TO "AthleteAverage_athleteId_idx";
ALTER INDEX "ShooterAverage_disciplineId_idx" RENAME TO "AthleteAverage_disciplineId_idx";
ALTER INDEX "ShooterAverage_shooterId_disciplineId_key" RENAME TO "AthleteAverage_athleteId_disciplineId_key";

-- ShootOffParticipant indexes
ALTER INDEX "ShootOffParticipant_shooterId_idx" RENAME TO "ShootOffParticipant_athleteId_idx";
ALTER INDEX "ShootOffParticipant_shootOffId_shooterId_key" RENAME TO "ShootOffParticipant_shootOffId_athleteId_key";

-- Step 5: Rename unique constraints (that actually exist)
ALTER INDEX "Registration_tournamentId_shooterId_key" RENAME TO "Registration_tournamentId_athleteId_key";
ALTER INDEX "Shoot_tournamentId_shooterId_disciplineId_key" RENAME TO "Shoot_tournamentId_athleteId_disciplineId_key";

-- Step 6: Rename Shooter table indexes
ALTER INDEX "Shooter_pkey" RENAME TO "Athlete_pkey";
ALTER INDEX "Shooter_userId_key" RENAME TO "Athlete_userId_key";

-- Step 7: Rename ShooterAverage table primary key
ALTER INDEX "ShooterAverage_pkey" RENAME TO "AthleteAverage_pkey";

-- Step 8: Rename foreign key constraints
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

-- ShootOffParticipant foreign key
ALTER TABLE "ShootOffParticipant" DROP CONSTRAINT "ShootOffParticipant_shooterId_fkey";
ALTER TABLE "ShootOffParticipant" ADD CONSTRAINT "ShootOffParticipant_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;
