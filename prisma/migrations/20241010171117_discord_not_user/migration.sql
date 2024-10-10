/*
  Warnings:

  - You are about to drop the column `userId` on the `BannedUser` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `RestrictedUser` table. All the data in the column will be lost.
  - Added the required column `discordId` to the `BannedUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discordId` to the `RestrictedUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BannedUser" DROP CONSTRAINT "BannedUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "RestrictedUser" DROP CONSTRAINT "RestrictedUser_userId_fkey";

-- AlterTable
ALTER TABLE "BannedUser" DROP COLUMN "userId",
ADD COLUMN     "discordId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RestrictedUser" DROP COLUMN "userId",
ADD COLUMN     "discordId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "RestrictedUser" ADD CONSTRAINT "RestrictedUser_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannedUser" ADD CONSTRAINT "BannedUser_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
