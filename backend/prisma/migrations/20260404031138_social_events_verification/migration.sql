-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "verificationRequested" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "evento_comments" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento_reactions" (
    "id" SERIAL NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '👍',

    CONSTRAINT "evento_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evento_reactions_eventoId_userId_key" ON "evento_reactions"("eventoId", "userId");
