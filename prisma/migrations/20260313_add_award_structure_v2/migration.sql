-- AlterTable: Add award structure v2 fields to Tournament
-- All columns have defaults so existing rows are unaffected
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "awardStructureVersion" TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "hoaScope" TEXT NOT NULL DEFAULT 'combined';
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "hoaIncludesDivisions" TEXT NOT NULL DEFAULT '["Novice","Intermediate","JV","Varsity"]';
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "hoaHighLadyCanWinBoth" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "collegiateHOAEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "individualEventPlaces" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "teamEventPlaces" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "teamSizeDefault" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "trapTeamSize" INTEGER NOT NULL DEFAULT 5;
