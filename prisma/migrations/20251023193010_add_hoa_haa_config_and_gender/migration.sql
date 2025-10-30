-- AlterTable
ALTER TABLE "Shooter" ADD COLUMN     "gender" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "enableHAA" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "enableHOA" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "haaCoreDisciplines" TEXT,
ADD COLUMN     "haaExcludesDivision" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hoaExcludesHAA" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hoaSeparateGender" BOOLEAN NOT NULL DEFAULT false;
