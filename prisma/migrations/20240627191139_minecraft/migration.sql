-- CreateTable
CREATE TABLE "MinecraftPlayer" (
    "id" SERIAL NOT NULL,
    "username" TEXT[],
    "uuid" TEXT NOT NULL,

    CONSTRAINT "MinecraftPlayer_pkey" PRIMARY KEY ("id")
);
