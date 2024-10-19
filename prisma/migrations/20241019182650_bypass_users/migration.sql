-- CreateTable
CREATE TABLE "BypassUser" (
    "id" SERIAL NOT NULL,
    "discordId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "BypassUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BypassUser_discordId_key" ON "BypassUser"("discordId");

-- AddForeignKey
ALTER TABLE "BypassUser" ADD CONSTRAINT "BypassUser_discordId_fkey" FOREIGN KEY ("discordId") REFERENCES "User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;
