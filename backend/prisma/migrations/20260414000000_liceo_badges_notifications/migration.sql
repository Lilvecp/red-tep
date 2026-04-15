-- Migration: liceo_badges_notifications
-- Adds liceoValidado to workers, estado to insignias, and admin_notifications table

-- Add liceoValidado field to workers
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "liceoValidado" TEXT;

-- Add estado field to insignias (default APROBADA for backward compatibility)
ALTER TABLE "insignias" ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'APROBADA';

-- Add cvUrl field to workers (for uploaded PDF CV)
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "cvUrl" TEXT;

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS "admin_notifications" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "workerId" INTEGER NOT NULL,
    "workerNombre" TEXT NOT NULL DEFAULT '',
    "referenceId" INTEGER,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);
