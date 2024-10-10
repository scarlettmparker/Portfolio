/*
  Warnings:

  - You are about to drop the column `banned` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `restricted` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "banned",
DROP COLUMN "restricted";

-- CreateTable
CREATE TABLE "RestrictedUser" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "RestrictedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannedUser" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "BannedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestrictedUser_discordId_key" ON "RestrictedUser"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "BannedUser_discordId_key" ON "BannedUser"("discordId");

-- AddForeignKey
ALTER TABLE "RestrictedUser" ADD CONSTRAINT "RestrictedUser_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannedUser" ADD CONSTRAINT "BannedUser_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;
