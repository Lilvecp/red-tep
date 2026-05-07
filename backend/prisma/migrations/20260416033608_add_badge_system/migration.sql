-- CreateTable
CREATE TABLE "insignia_templates" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insignia_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insignia_awards" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "otorgadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insignia_awards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insignia_awards_templateId_userId_key" ON "insignia_awards"("templateId", "userId");

-- AddForeignKey
ALTER TABLE "insignia_awards" ADD CONSTRAINT "insignia_awards_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "insignia_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
