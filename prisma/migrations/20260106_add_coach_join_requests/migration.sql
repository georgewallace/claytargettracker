-- CreateTable
CREATE TABLE IF NOT EXISTS "CoachJoinRequest" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoachJoinRequest_teamId_idx" ON "CoachJoinRequest"("teamId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoachJoinRequest_userId_idx" ON "CoachJoinRequest"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoachJoinRequest_status_idx" ON "CoachJoinRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CoachJoinRequest_teamId_userId_key" ON "CoachJoinRequest"("teamId", "userId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CoachJoinRequest_teamId_fkey'
  ) THEN
    ALTER TABLE "CoachJoinRequest" ADD CONSTRAINT "CoachJoinRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CoachJoinRequest_userId_fkey'
  ) THEN
    ALTER TABLE "CoachJoinRequest" ADD CONSTRAINT "CoachJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
