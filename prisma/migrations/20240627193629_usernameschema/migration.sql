/*
  Warnings:

  - You are about to drop the column `username` on the `MinecraftPlayer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MinecraftPlayer" DROP COLUMN "username";

-- CreateTable
CREATE TABLE "MinecraftUsername" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "minecraftPlayerId" INTEGER NOT NULL,

    CONSTRAINT "MinecraftUsername_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MinecraftUsername_minecraftPlayerId_key" ON "MinecraftUsername"("minecraftPlayerId");

-- AddForeignKey
ALTER TABLE "MinecraftUsername" ADD CONSTRAINT "MinecraftUsername_minecraftPlayerId_fkey" FOREIGN KEY ("minecraftPlayerId") REFERENCES "MinecraftPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
