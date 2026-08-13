/*
  Warnings:

  - You are about to drop the column `phone` on the `OtpCode` table. All the data in the column will be lost.
  - Added the required column `email` to the `OtpCode` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OtpCode_phone_purpose_idx";

-- AlterTable
ALTER TABLE "OtpCode" DROP COLUMN "phone",
ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "OtpCode_email_purpose_idx" ON "OtpCode"("email", "purpose");
