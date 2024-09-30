-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "levels" INTEGER[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
