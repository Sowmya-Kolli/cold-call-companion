-- ============================================================
-- Migration: Add optional is_demo column to calls table
--
-- PURPOSE:
-- Safely distinguish evaluator/sample demo records from genuine production records
-- directly in Supabase PostgreSQL without breaking existing API queries.
--
-- BACKWARD COMPATIBILITY:
-- 1. `DEFAULT FALSE` ensures all existing calls automatically have is_demo = false.
-- 2. `NOT NULL` prevents NULL tri-state logic bugs.
-- 3. Does NOT alter any existing columns, constraints, or foreign keys.
-- 4. An index `idx_calls_is_demo` is created for efficient filtering of real vs demo calls.
--
-- HOW TO APPLY (Non-destructive):
-- 1. Open Supabase Dashboard → SQL Editor → New Query.
-- 2. Paste and run this script.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calls' AND column_name = 'is_demo'
  ) THEN
    ALTER TABLE calls ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Index for high-performance separation of real and demo records
CREATE INDEX IF NOT EXISTS idx_calls_is_demo ON calls (is_demo);
