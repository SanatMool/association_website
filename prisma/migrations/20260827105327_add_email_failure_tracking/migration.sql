-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailFailedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MemberAccount" ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailFailedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MembershipApplication" ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailFailedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TicketRegistration" ADD COLUMN     "emailError" TEXT,
ADD COLUMN     "emailFailedAt" TIMESTAMP(3);
