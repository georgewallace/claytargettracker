-- CreateTable
CREATE TABLE "ShooterAverage" (
    "id" TEXT NOT NULL,
    "shooterId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "average" DOUBLE PRECISION NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShooterAverage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShooterAverage_shooterId_idx" ON "ShooterAverage"("shooterId");

-- CreateIndex
CREATE INDEX "ShooterAverage_disciplineId_idx" ON "ShooterAverage"("disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "ShooterAverage_shooterId_disciplineId_key" ON "ShooterAverage"("shooterId", "disciplineId");

-- AddForeignKey
ALTER TABLE "ShooterAverage" ADD CONSTRAINT "ShooterAverage_shooterId_fkey" FOREIGN KEY ("shooterId") REFERENCES "Shooter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShooterAverage" ADD CONSTRAINT "ShooterAverage_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "TournamentDiscipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
