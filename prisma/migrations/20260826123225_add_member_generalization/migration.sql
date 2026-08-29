-- AlterTable
ALTER TABLE "CommitteeMember" ADD COLUMN     "memberId" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "phones" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "MemberAssociation" ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showPhone" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MemberGroup" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNe" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberGroupLink" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "memberGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberGroupLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberGroup_associationId_idx" ON "MemberGroup"("associationId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberGroupLink_memberId_memberGroupId_key" ON "MemberGroupLink"("memberId", "memberGroupId");

-- AddForeignKey
ALTER TABLE "CommitteeMember" ADD CONSTRAINT "CommitteeMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberGroup" ADD CONSTRAINT "MemberGroup_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberGroupLink" ADD CONSTRAINT "MemberGroupLink_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberGroupLink" ADD CONSTRAINT "MemberGroupLink_memberGroupId_fkey" FOREIGN KEY ("memberGroupId") REFERENCES "MemberGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
