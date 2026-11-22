-- AlterTable
ALTER TABLE "Article" ADD COLUMN "coverImagePublicId" TEXT;

-- Clear legacy cover image URLs; new uploads go through Cloudinary.
UPDATE "Article" SET "coverImageUrl" = NULL;
