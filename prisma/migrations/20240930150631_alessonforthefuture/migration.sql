/*
  Warnings:

  - Made the column `creationDate` on table `Annotation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Annotation` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accountCreationDate` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Annotation" DROP CONSTRAINT "Annotation_userId_fkey";

-- AlterTable
ALTER TABLE "Annotation" ALTER COLUMN "creationDate" SET NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "accountCreationDate" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
