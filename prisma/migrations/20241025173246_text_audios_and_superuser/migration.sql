/*
  Warnings:

  - A unique constraint covering the columns `[audioId]` on the table `Text` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Text" ADD COLUMN     "audioId" INTEGER;

-- CreateTable
CREATE TABLE "SuperUser" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,

    CONSTRAINT "SuperUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audio" (
    "id" SERIAL NOT NULL,
    "audioFile" TEXT NOT NULL,
    "vttFile" TEXT NOT NULL,
    "submissionName" TEXT NOT NULL,
    "submissionLink" TEXT,

    CONSTRAINT "Audio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperUser_discordId_key" ON "SuperUser"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "Text_audioId_key" ON "Text"("audioId");

-- AddForeignKey
ALTER TABLE "SuperUser" ADD CONSTRAINT "SuperUser_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Text" ADD CONSTRAINT "Text_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
