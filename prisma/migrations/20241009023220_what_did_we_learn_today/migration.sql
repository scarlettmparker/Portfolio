/*
  Warnings:

  - You are about to drop the column `expiration` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "expiration",
DROP COLUMN "sessionId";
