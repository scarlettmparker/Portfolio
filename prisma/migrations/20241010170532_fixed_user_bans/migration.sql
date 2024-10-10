/*
  Warnings:

  - You are about to drop the column `discordId` on the `BannedUser` table. All the data in the column will be lost.
  - You are about to drop the column `discordId` on the `RestrictedUser` table. All the data in the column will be lost.
  - Added the required column `userId` to the `BannedUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `RestrictedUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BannedUser" DROP CONSTRAINT "BannedUser_discordId_fkey";

-- DropForeignKey
ALTER TABLE "RestrictedUser" DROP CONSTRAINT "RestrictedUser_discordId_fkey";

-- DropIndex
DROP INDEX "BannedUser_discordId_key";

-- DropIndex
DROP INDEX "RestrictedUser_discordId_key";

-- AlterTable
ALTER TABLE "BannedUser" DROP COLUMN "discordId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RestrictedUser" DROP COLUMN "discordId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "RestrictedUser" ADD CONSTRAINT "RestrictedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannedUser" ADD CONSTRAINT "BannedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
