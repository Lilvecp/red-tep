-- DropForeignKey
ALTER TABLE "insignias" DROP CONSTRAINT "insignias_progresoFormativoId_fkey";

-- DropForeignKey
ALTER TABLE "progreso_usuario" DROP CONSTRAINT "progreso_usuario_progresoFormativoId_fkey";

-- DropForeignKey
ALTER TABLE "progreso_usuario" DROP CONSTRAINT "progreso_usuario_workerId_fkey";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "adminFeedback" TEXT;

-- AlterTable
ALTER TABLE "insignias" ADD COLUMN     "adminFeedback" TEXT;

-- AlterTable
ALTER TABLE "progreso_formativo" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "progreso_usuario" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "liceoFeedback" TEXT;

-- AddForeignKey
ALTER TABLE "insignias" ADD CONSTRAINT "insignias_progresoFormativoId_fkey" FOREIGN KEY ("progresoFormativoId") REFERENCES "progreso_formativo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_usuario" ADD CONSTRAINT "progreso_usuario_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_usuario" ADD CONSTRAINT "progreso_usuario_progresoFormativoId_fkey" FOREIGN KEY ("progresoFormativoId") REFERENCES "progreso_formativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
