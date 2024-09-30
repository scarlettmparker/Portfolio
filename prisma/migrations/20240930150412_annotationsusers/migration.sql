/*
  Warnings:

  - Added the required column `creationDate` to the `Annotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Annotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountCreationDate` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Annotation" ADD COLUMN     "creationDate" INTEGER NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountCreationDate" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
