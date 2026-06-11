-- AlterTable
ALTER TABLE "CommitteeMember" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "termMonthAD" INTEGER,
ADD COLUMN     "termMonthBS" INTEGER,
ADD COLUMN     "termYearAD" INTEGER,
ADD COLUMN     "termYearBS" INTEGER;
