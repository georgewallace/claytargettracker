-- Make roundNumber and stationNumber nullable in Score table
-- This allows round-based scores (Skeet/Trap) to have null stationNumber
-- and station-based scores (Sporting Clays) to have null roundNumber

ALTER TABLE "Score" ALTER COLUMN "roundNumber" DROP NOT NULL;
ALTER TABLE "Score" ALTER COLUMN "stationNumber" DROP NOT NULL;
