-- AlterTable
ALTER TABLE "Squad" ADD COLUMN IF NOT EXISTS "division" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Squad_division_idx" ON "Squad"("division");
