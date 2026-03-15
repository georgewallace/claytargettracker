-- Add long run tiebreaker fields to Shoot
ALTER TABLE "Shoot" ADD COLUMN "longRunFront" INTEGER;
ALTER TABLE "Shoot" ADD COLUMN "longRunBack" INTEGER;

-- Add long run discipline config and tiebreak order to Tournament
ALTER TABLE "Tournament" ADD COLUMN "longRunDisciplines" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Tournament" ADD COLUMN "tiebreakOrder" TEXT NOT NULL DEFAULT '["lrf","lrb","shootoff"]';
