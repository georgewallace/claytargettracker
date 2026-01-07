-- AlterTable
ALTER TABLE "Squad" ADD COLUMN IF NOT EXISTS "teamId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Squad_teamId_idx" ON "Squad"("teamId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Squad_teamId_fkey'
  ) THEN
    ALTER TABLE "Squad" ADD CONSTRAINT "Squad_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
