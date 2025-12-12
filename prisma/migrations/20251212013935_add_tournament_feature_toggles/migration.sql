-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "enableLeaderboard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "enableScores" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "enableShootOffs" SET DEFAULT false;
