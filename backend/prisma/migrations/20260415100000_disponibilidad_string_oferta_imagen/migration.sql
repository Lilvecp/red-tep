-- Migrate disponibilidad from enum to text on workers
ALTER TABLE "workers" ALTER COLUMN "disponibilidad" TYPE TEXT USING "disponibilidad"::TEXT;

-- Migrate disponibilidad from enum to text on ofertas
ALTER TABLE "ofertas" ALTER COLUMN "disponibilidad" TYPE TEXT USING "disponibilidad"::TEXT;

-- Add imagenUrl to ofertas
ALTER TABLE "ofertas" ADD COLUMN "imagenUrl" TEXT;

-- Drop the enum type (only after columns no longer reference it)
DROP TYPE IF EXISTS "Disponibilidad";
