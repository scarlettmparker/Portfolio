/*
  Warnings:

  - A unique constraint covering the columns `[discordId]` on the table `BannedUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[discordId]` on the table `RestrictedUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BannedUser_discordId_key" ON "BannedUser"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "RestrictedUser_discordId_key" ON "RestrictedUser"("discordId");
