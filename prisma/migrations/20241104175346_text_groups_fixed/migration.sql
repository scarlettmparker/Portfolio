/*
  Warnings:

  - You are about to drop the column `textGroup` on the `TextObject` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Text" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "textGroupId" INTEGER;

-- AlterTable
ALTER TABLE "TextObject" DROP COLUMN "textGroup";

-- CreateTable
CREATE TABLE "TextGroup" (
    "id" SERIAL NOT NULL,
    "groupName" TEXT NOT NULL,
    "groupLink" TEXT,

    CONSTRAINT "TextGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Text" ADD CONSTRAINT "Text_textGroupId_fkey" FOREIGN KEY ("textGroupId") REFERENCES "TextGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Text" ADD CONSTRAINT "Text_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("discordId") ON DELETE SET NULL ON UPDATE CASCADE;
