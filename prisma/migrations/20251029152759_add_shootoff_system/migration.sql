-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "enableShootOffs" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shootOffFormat" TEXT NOT NULL DEFAULT 'sudden_death',
ADD COLUMN     "shootOffRequiresPerfect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shootOffStartStation" TEXT,
ADD COLUMN     "shootOffTargetsPerRound" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "shootOffTriggers" TEXT;

-- CreateTable
CREATE TABLE "ShootOff" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "disciplineId" TEXT,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "format" TEXT NOT NULL,
    "description" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShootOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShootOffParticipant" (
    "id" TEXT NOT NULL,
    "shootOffId" TEXT NOT NULL,
    "shooterId" TEXT NOT NULL,
    "tiedScore" INTEGER NOT NULL,
    "finalPlace" INTEGER,
    "eliminated" BOOLEAN NOT NULL DEFAULT false,
    "eliminatedInRound" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShootOffParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShootOffRound" (
    "id" TEXT NOT NULL,
    "shootOffId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "targets" INTEGER NOT NULL,
    "station" TEXT,
    "difficulty" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShootOffRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShootOffScore" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "targetsHit" INTEGER NOT NULL,
    "totalTargets" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShootOffScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShootOff_tournamentId_idx" ON "ShootOff"("tournamentId");

-- CreateIndex
CREATE INDEX "ShootOff_status_idx" ON "ShootOff"("status");

-- CreateIndex
CREATE INDEX "ShootOffParticipant_shootOffId_idx" ON "ShootOffParticipant"("shootOffId");

-- CreateIndex
CREATE INDEX "ShootOffParticipant_shooterId_idx" ON "ShootOffParticipant"("shooterId");

-- CreateIndex
CREATE UNIQUE INDEX "ShootOffParticipant_shootOffId_shooterId_key" ON "ShootOffParticipant"("shootOffId", "shooterId");

-- CreateIndex
CREATE INDEX "ShootOffRound_shootOffId_idx" ON "ShootOffRound"("shootOffId");

-- CreateIndex
CREATE UNIQUE INDEX "ShootOffRound_shootOffId_roundNumber_key" ON "ShootOffRound"("shootOffId", "roundNumber");

-- CreateIndex
CREATE INDEX "ShootOffScore_roundId_idx" ON "ShootOffScore"("roundId");

-- CreateIndex
CREATE INDEX "ShootOffScore_participantId_idx" ON "ShootOffScore"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "ShootOffScore_roundId_participantId_key" ON "ShootOffScore"("roundId", "participantId");

-- AddForeignKey
ALTER TABLE "ShootOff" ADD CONSTRAINT "ShootOff_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootOff" ADD CONSTRAINT "ShootOff_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootOff" ADD CONSTRAINT "ShootOff_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Shooter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootOffParticipant" ADD CONSTRAINT "ShootOffParticipant_shootOffId_fkey" FOREIGN KEY ("shootOffId") REFERENCES "ShootOff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootOffParticipant" ADD CONSTRAINT "ShootOffParticipant_shooterId_fkey" FOREIGN KEY ("shooterId") REFERENCES "Shooter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootOffRound" ADD CONSTRAINT "ShootOffRound_shootOffId_fkey" FOREIGN KEY ("shootOffId") REFERENCES "ShootOff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootOffScore" ADD CONSTRAINT "ShootOffScore_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ShootOffRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootOffScore" ADD CONSTRAINT "ShootOffScore_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ShootOffParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
