-- AddColumn modalidad, anioEgreso, egresadoSolicitado, pretensionRenta
ALTER TABLE "workers" ADD COLUMN "modalidad" TEXT;
ALTER TABLE "workers" ADD COLUMN "anioEgreso" INTEGER;
ALTER TABLE "workers" ADD COLUMN "egresadoSolicitado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "workers" ADD COLUMN "pretensionRenta" TEXT;

-- Data migration: convertir buscandoTrabajo a modalidad
UPDATE "workers" SET "modalidad" = 'BUSCANDO_TRABAJO' WHERE "buscandoTrabajo" = true;

-- Drop columna antigua
ALTER TABLE "workers" DROP COLUMN "buscandoTrabajo";
