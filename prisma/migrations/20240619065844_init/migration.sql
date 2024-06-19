-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "whitePlayer" BOOLEAN NOT NULL DEFAULT false,
    "blackPlayer" BOOLEAN NOT NULL DEFAULT false
);
