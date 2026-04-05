-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "buscandoTrabajo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "filter_options" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "filter_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "filter_options_tipo_valor_key" ON "filter_options"("tipo", "valor");
