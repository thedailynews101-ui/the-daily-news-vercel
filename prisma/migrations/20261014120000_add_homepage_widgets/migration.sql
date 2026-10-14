-- CreateEnum
CREATE TYPE "MiddleWidget" AS ENUM ('QUOTE', 'PUBLIC_OPINION');

-- CreateEnum
CREATE TYPE "PublicOpinionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "middleWidget" "MiddleWidget" NOT NULL DEFAULT 'QUOTE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicOpinion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" "PublicOpinionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicOpinion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicOpinionOption" (
    "id" TEXT NOT NULL,
    "opinionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicOpinionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicOpinionResponse" (
    "id" TEXT NOT NULL,
    "opinionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT,
    "voterKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicOpinionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quote_isActive_idx" ON "Quote"("isActive");

-- CreateIndex
CREATE INDEX "PublicOpinion_status_createdAt_idx" ON "PublicOpinion"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PublicOpinion_createdById_idx" ON "PublicOpinion"("createdById");

-- CreateIndex
CREATE INDEX "PublicOpinionOption_opinionId_position_idx" ON "PublicOpinionOption"("opinionId", "position");

-- CreateIndex
CREATE INDEX "PublicOpinionResponse_optionId_idx" ON "PublicOpinionResponse"("optionId");

-- CreateIndex
CREATE INDEX "PublicOpinionResponse_userId_idx" ON "PublicOpinionResponse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicOpinionResponse_opinionId_voterKey_key" ON "PublicOpinionResponse"("opinionId", "voterKey");

-- CreateIndex
CREATE UNIQUE INDEX "PublicOpinionResponse_opinionId_userId_key" ON "PublicOpinionResponse"("opinionId", "userId");

-- AddForeignKey
ALTER TABLE "PublicOpinion" ADD CONSTRAINT "PublicOpinion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicOpinionOption" ADD CONSTRAINT "PublicOpinionOption_opinionId_fkey" FOREIGN KEY ("opinionId") REFERENCES "PublicOpinion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicOpinionResponse" ADD CONSTRAINT "PublicOpinionResponse_opinionId_fkey" FOREIGN KEY ("opinionId") REFERENCES "PublicOpinion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicOpinionResponse" ADD CONSTRAINT "PublicOpinionResponse_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PublicOpinionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicOpinionResponse" ADD CONSTRAINT "PublicOpinionResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed singleton site setting
INSERT INTO "SiteSetting" ("id", "middleWidget", "updatedAt")
VALUES ('default', 'QUOTE', CURRENT_TIMESTAMP);
