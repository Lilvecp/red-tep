-- Migration: progreso_formativo
-- Converts Insignia.tipo from TipoInsignia enum to TEXT,
-- adds ProgresoFormativo + ProgresoUsuario tables,
-- adds progresoFormativoId FK on insignias.

-- 1. Convert tipo column from enum to TEXT (preserves existing values as strings)
ALTER TABLE "insignias" ALTER COLUMN "tipo" TYPE TEXT USING "tipo"::text;

-- 2. Drop the now-unused TipoInsignia enum
DROP TYPE IF EXISTS "TipoInsignia";

-- 3. Create progreso_formativo table
CREATE TABLE IF NOT EXISTS "progreso_formativo" (
  "id"          SERIAL PRIMARY KEY,
  "nombre"      TEXT NOT NULL,
  "descripcion" TEXT,
  "activo"      BOOLEAN NOT NULL DEFAULT true,
  "orden"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create progreso_usuario table
CREATE TABLE IF NOT EXISTS "progreso_usuario" (
  "id"                  SERIAL PRIMARY KEY,
  "workerId"            INTEGER NOT NULL,
  "progresoFormativoId" INTEGER NOT NULL,
  "porcentaje"          INTEGER NOT NULL DEFAULT 0,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "progreso_usuario_workerId_fkey"
    FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE,
  CONSTRAINT "progreso_usuario_progresoFormativoId_fkey"
    FOREIGN KEY ("progresoFormativoId") REFERENCES "progreso_formativo"("id") ON DELETE CASCADE,
  CONSTRAINT "progreso_usuario_workerId_progresoFormativoId_key"
    UNIQUE ("workerId", "progresoFormativoId")
);

-- 5. Add progresoFormativoId column to insignias
ALTER TABLE "insignias"
  ADD COLUMN IF NOT EXISTS "progresoFormativoId" INTEGER;

ALTER TABLE "insignias"
  ADD CONSTRAINT "insignias_progresoFormativoId_fkey"
    FOREIGN KEY ("progresoFormativoId") REFERENCES "progreso_formativo"("id") ON DELETE SET NULL
    NOT VALID;

-- 6. Seed default progress sections (matches previous hardcoded frontend sections)
INSERT INTO "progreso_formativo" ("nombre", "descripcion", "orden") VALUES
  ('Perfil técnico',  'Especialidad, curso, disponibilidad y datos de contacto completos', 0),
  ('Habilidades',     'Habilidades técnicas y blandas registradas', 1),
  ('Prácticas',       'Experiencia práctica y descripción profesional', 2),
  ('Portafolio',      'Fotos y videos de trabajos prácticos subidos', 3)
ON CONFLICT DO NOTHING;
