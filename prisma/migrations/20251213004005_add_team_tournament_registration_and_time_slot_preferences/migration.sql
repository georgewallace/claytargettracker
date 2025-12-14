-- CreateTable
CREATE TABLE "TeamTournamentRegistration" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "registeredBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamTournamentRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlotPreference" (
    "id" TEXT NOT NULL,
    "registrationDisciplineId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "preference" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeSlotPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamTournamentRegistration_teamId_idx" ON "TeamTournamentRegistration"("teamId");

-- CreateIndex
CREATE INDEX "TeamTournamentRegistration_tournamentId_idx" ON "TeamTournamentRegistration"("tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamTournamentRegistration_teamId_tournamentId_key" ON "TeamTournamentRegistration"("teamId", "tournamentId");

-- CreateIndex
CREATE INDEX "TimeSlotPreference_registrationDisciplineId_idx" ON "TimeSlotPreference"("registrationDisciplineId");

-- CreateIndex
CREATE INDEX "TimeSlotPreference_timeSlotId_idx" ON "TimeSlotPreference"("timeSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlotPreference_registrationDisciplineId_timeSlotId_key" ON "TimeSlotPreference"("registrationDisciplineId", "timeSlotId");

-- AddForeignKey
ALTER TABLE "TeamTournamentRegistration" ADD CONSTRAINT "TeamTournamentRegistration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamTournamentRegistration" ADD CONSTRAINT "TeamTournamentRegistration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlotPreference" ADD CONSTRAINT "TimeSlotPreference_registrationDisciplineId_fkey" FOREIGN KEY ("registrationDisciplineId") REFERENCES "RegistrationDiscipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlotPreference" ADD CONSTRAINT "TimeSlotPreference_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
