-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "promoImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recapImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recapVideoUrl" TEXT;
