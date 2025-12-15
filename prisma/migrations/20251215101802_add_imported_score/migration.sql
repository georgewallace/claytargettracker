-- CreateTable
CREATE TABLE "ImportedScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shooter" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "targetsThrown" INTEGER NOT NULL,
    "targetsHit" INTEGER NOT NULL,
    "stationBreakdown" TEXT,
    "field" TEXT,
    "time" TEXT,
    "notes" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "ImportedScore_shooter_idx" ON "ImportedScore"("shooter");

-- CreateIndex
CREATE INDEX "ImportedScore_team_idx" ON "ImportedScore"("team");

-- CreateIndex
CREATE INDEX "ImportedScore_discipline_idx" ON "ImportedScore"("discipline");

-- CreateIndex
CREATE INDEX "ImportedScore_division_idx" ON "ImportedScore"("division");

-- CreateIndex
CREATE INDEX "ImportedScore_gender_idx" ON "ImportedScore"("gender");
