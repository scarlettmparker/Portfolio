-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateTable
CREATE TABLE "UserAnnotationInteraction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "annotationId" INTEGER NOT NULL,
    "type" "InteractionType" NOT NULL,

    CONSTRAINT "UserAnnotationInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAnnotationInteraction_userId_annotationId_key" ON "UserAnnotationInteraction"("userId", "annotationId");

-- AddForeignKey
ALTER TABLE "UserAnnotationInteraction" ADD CONSTRAINT "UserAnnotationInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnnotationInteraction" ADD CONSTRAINT "UserAnnotationInteraction_annotationId_fkey" FOREIGN KEY ("annotationId") REFERENCES "Annotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
