-- DropForeignKey
ALTER TABLE "BannedUser" DROP CONSTRAINT "BannedUser_discordId_fkey";

-- DropForeignKey
ALTER TABLE "RestrictedUser" DROP CONSTRAINT "RestrictedUser_discordId_fkey";

-- AlterTable
ALTER TABLE "BannedUser" ALTER COLUMN "discordId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RestrictedUser" ALTER COLUMN "discordId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "RestrictedUser" ADD CONSTRAINT "RestrictedUser_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannedUser" ADD CONSTRAINT "BannedUser_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;
