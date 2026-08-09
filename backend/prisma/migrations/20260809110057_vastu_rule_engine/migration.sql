-- CreateEnum
CREATE TYPE "VastuPropertyType" AS ENUM ('LAND', 'HOME');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('POSITIVE', 'CAUTION', 'CONCERN');

-- CreateEnum
CREATE TYPE "RuleConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Facing" ADD VALUE 'NE';
ALTER TYPE "Facing" ADD VALUE 'SE';
ALTER TYPE "Facing" ADD VALUE 'SW';
ALTER TYPE "Facing" ADD VALUE 'NW';

-- CreateTable
CREATE TABLE "VastuRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "propertyType" "VastuPropertyType",
    "field" TEXT NOT NULL,
    "matchValues" TEXT[],
    "severity" "RuleSeverity" NOT NULL,
    "scoreWeight" INTEGER NOT NULL,
    "recommendation" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "tradition" TEXT NOT NULL DEFAULT 'General Vastu Shastra',
    "source" TEXT,
    "confidence" "RuleConfidence" NOT NULL DEFAULT 'MEDIUM',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VastuRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VastuAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "propertyId" TEXT,
    "type" "VastuPropertyType" NOT NULL,
    "input" JSONB NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "categoryScores" JSONB NOT NULL,
    "firedRules" JSONB NOT NULL,
    "aiExplanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VastuAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VastuRule_code_key" ON "VastuRule"("code");

-- CreateIndex
CREATE INDEX "VastuRule_category_idx" ON "VastuRule"("category");

-- CreateIndex
CREATE INDEX "VastuRule_propertyType_idx" ON "VastuRule"("propertyType");

-- CreateIndex
CREATE INDEX "VastuRule_field_idx" ON "VastuRule"("field");

-- CreateIndex
CREATE INDEX "VastuAnalysis_userId_idx" ON "VastuAnalysis"("userId");

-- CreateIndex
CREATE INDEX "VastuAnalysis_propertyId_idx" ON "VastuAnalysis"("propertyId");

-- CreateIndex
CREATE INDEX "VastuAnalysis_type_idx" ON "VastuAnalysis"("type");

-- AddForeignKey
ALTER TABLE "VastuAnalysis" ADD CONSTRAINT "VastuAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VastuAnalysis" ADD CONSTRAINT "VastuAnalysis_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
