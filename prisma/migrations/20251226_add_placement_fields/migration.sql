-- Add placement fields to Shoot table for storing imported placement data
-- These fields store the official placements from Tournament Tracker imports

ALTER TABLE "Shoot" ADD COLUMN "concurrentPlace" INTEGER;
ALTER TABLE "Shoot" ADD COLUMN "classPlace" INTEGER;
ALTER TABLE "Shoot" ADD COLUMN "teamPlace" INTEGER;
ALTER TABLE "Shoot" ADD COLUMN "individualRank" INTEGER;
ALTER TABLE "Shoot" ADD COLUMN "teamRank" INTEGER;
ALTER TABLE "Shoot" ADD COLUMN "teamScore" INTEGER;
ALTER TABLE "Shoot" ADD COLUMN "haaIndividualPlace" INTEGER;
ALTER TABLE "Shoot" ADD COLUMN "haaConcurrent" TEXT;
