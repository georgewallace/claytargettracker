-- CreateTable
CREATE TABLE "TeamCoach" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'coach',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamCoach_pkey" PRIMARY KEY ("id")
);

-- Migrate existing coach assignments from Team.coachId to TeamCoach
INSERT INTO "TeamCoach" ("id", "teamId", "userId", "role", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id" as "teamId",
    "coachId" as "userId",
    'head_coach' as "role",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Team"
WHERE "coachId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_coachId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Team_coachId_key";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN IF EXISTS "coachId";

-- CreateIndex
CREATE INDEX "TeamCoach_teamId_idx" ON "TeamCoach"("teamId");

-- CreateIndex
CREATE INDEX "TeamCoach_userId_idx" ON "TeamCoach"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamCoach_teamId_userId_key" ON "TeamCoach"("teamId", "userId");

-- AddForeignKey
ALTER TABLE "TeamCoach" ADD CONSTRAINT "TeamCoach_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamCoach" ADD CONSTRAINT "TeamCoach_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

