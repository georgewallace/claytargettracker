-- ROLLBACK: Rename Athlete back to Shooter and AthleteAverage back to ShooterAverage
-- Use this ONLY if the migration fails and you need to revert

-- Step 1: Rename foreign key constraints back
ALTER TABLE "SquadMember" DROP CONSTRAINT "SquadMember_athleteId_fkey";
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_shooterId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Registration" DROP CONSTRAINT "Registration_athleteId_fkey";
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_shooterId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Shoot" DROP CONSTRAINT "Shoot_athleteId_fkey";
ALTER TABLE "Shoot" ADD CONSTRAINT "Shoot_shooterId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamJoinRequest" DROP CONSTRAINT "TeamJoinRequest_athleteId_fkey";
ALTER TABLE "TeamJoinRequest" ADD CONSTRAINT "TeamJoinRequest_shooterId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AthleteAverage" DROP CONSTRAINT "AthleteAverage_athleteId_fkey";
ALTER TABLE "AthleteAverage" ADD CONSTRAINT "ShooterAverage_shooterId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: Rename unique constraints back
ALTER INDEX "AthleteAverage_athleteId_disciplineId_key" RENAME TO "ShooterAverage_shooterId_disciplineId_key";
ALTER INDEX "Registration_tournamentId_athleteId_key" RENAME TO "Registration_tournamentId_shooterId_key";
ALTER INDEX "Shoot_tournamentId_athleteId_disciplineId_key" RENAME TO "Shoot_tournamentId_shooterId_disciplineId_key";
ALTER INDEX "SquadMember_squadId_athleteId_key" RENAME TO "SquadMember_squadId_shooterId_key";
ALTER INDEX "TeamJoinRequest_teamId_athleteId_key" RENAME TO "TeamJoinRequest_teamId_shooterId_key";

-- Step 3: Rename indexes back
ALTER INDEX "SquadMember_athleteId_idx" RENAME TO "SquadMember_shooterId_idx";
ALTER INDEX "Registration_athleteId_idx" RENAME TO "Registration_shooterId_idx";
ALTER INDEX "TeamJoinRequest_athleteId_idx" RENAME TO "TeamJoinRequest_shooterId_idx";
ALTER INDEX "AthleteAverage_athleteId_idx" RENAME TO "ShooterAverage_shooterId_idx";
ALTER INDEX "AthleteAverage_disciplineId_idx" RENAME TO "ShooterAverage_disciplineId_idx";

-- Step 4: Rename columns back to shooterId
ALTER TABLE "SquadMember" RENAME COLUMN "athleteId" TO "shooterId";
ALTER TABLE "Registration" RENAME COLUMN "athleteId" TO "shooterId";
ALTER TABLE "Shoot" RENAME COLUMN "athleteId" TO "shooterId";
ALTER TABLE "TeamJoinRequest" RENAME COLUMN "athleteId" TO "shooterId";
ALTER TABLE "AthleteAverage" RENAME COLUMN "athleteId" TO "shooterId";

-- Step 5: Rename tables back
ALTER TABLE "AthleteAverage" RENAME TO "ShooterAverage";
ALTER TABLE "Athlete" RENAME TO "Shooter";
