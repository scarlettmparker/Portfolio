/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `MinecraftUsername` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "MinecraftUsername" DROP CONSTRAINT "MinecraftUsername_minecraftPlayerId_fkey";

-- DropIndex
DROP INDEX "MinecraftUsername_minecraftPlayerId_key";

-- AlterTable
ALTER TABLE "MinecraftUsername" ALTER COLUMN "minecraftPlayerId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MinecraftUsername_username_key" ON "MinecraftUsername"("username");

-- AddForeignKey
ALTER TABLE "MinecraftUsername" ADD CONSTRAINT "MinecraftUsername_minecraftPlayerId_fkey" FOREIGN KEY ("minecraftPlayerId") REFERENCES "MinecraftPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
