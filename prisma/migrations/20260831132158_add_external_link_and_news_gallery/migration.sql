-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "externalLink" TEXT;

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "externalLink" TEXT,
ADD COLUMN     "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
