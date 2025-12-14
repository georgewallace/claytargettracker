-- AlterTable
ALTER TABLE "Team" ADD COLUMN "affiliation" TEXT;

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN "divisionOverride" TEXT;
ALTER TABLE "Athlete" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
