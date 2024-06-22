-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "player0" BOOLEAN NOT NULL DEFAULT false,
    "player1" BOOLEAN NOT NULL DEFAULT false,
    "state" JSONB[],

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piece" (
    "id" TEXT NOT NULL,
    "skin" INTEGER[],

    CONSTRAINT "Piece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoveSet" (
    "id" SERIAL NOT NULL,
    "moves" INTEGER[],

    CONSTRAINT "MoveSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceMoveSet" (
    "pieceId" TEXT NOT NULL,
    "moveSetId" INTEGER NOT NULL,

    CONSTRAINT "PieceMoveSet_pkey" PRIMARY KEY ("pieceId","moveSetId")
);

-- AddForeignKey
ALTER TABLE "PieceMoveSet" ADD CONSTRAINT "PieceMoveSet_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "Piece"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceMoveSet" ADD CONSTRAINT "PieceMoveSet_moveSetId_fkey" FOREIGN KEY ("moveSetId") REFERENCES "MoveSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
