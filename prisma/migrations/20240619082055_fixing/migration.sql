/*
  Warnings:

  - You are about to drop the column `blackPlayer` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `whitePlayer` on the `Game` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "player0" BOOLEAN NOT NULL DEFAULT false,
    "player1" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Game" ("id") SELECT "id" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
