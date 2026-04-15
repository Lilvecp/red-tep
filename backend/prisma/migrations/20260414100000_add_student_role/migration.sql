-- Migration: add_student_role
-- Adds STUDENT enum value and migrates existing student records

-- Add STUDENT to the Role enum (PostgreSQL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'STUDENT'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'STUDENT';
  END IF;
END
$$;
