-- AlterTable
ALTER TABLE "Team" ADD COLUMN "isIndividualTeam" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "tournamentId" TEXT;
