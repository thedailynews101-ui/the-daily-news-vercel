-- CreateEnum
CREATE TYPE "HomeSlot" AS ENUM ('HERO', 'MEGA', 'FEED', 'VISUAL', 'PINNED');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN "homeSlot" "HomeSlot",
ADD COLUMN "homeRank" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Article_homeSlot_homeRank_idx" ON "Article"("homeSlot", "homeRank");
