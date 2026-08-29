-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "designationId" TEXT,
ADD COLUMN     "extraPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "systemRole" TEXT NOT NULL DEFAULT 'admin';

-- AlterTable
ALTER TABLE "MemberAssociation" ADD COLUMN     "designationId" TEXT;

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemRole" TEXT NOT NULL,
    "permissions" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Designation_associationId_idx" ON "Designation"("associationId");

-- AddForeignKey
ALTER TABLE "MemberAssociation" ADD CONSTRAINT "MemberAssociation_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;
