-- ============================================================
-- Cold Call Companion — Supabase PostgreSQL Schema
-- Version: 1.0.0
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- SAFE TO RE-RUN: uses CREATE TABLE IF NOT EXISTS and DO blocks
-- for constraint/policy additions.
-- DESTRUCTIVE NOTE: Does NOT drop any existing tables.
-- ============================================================

-- Enable uuid generation (available by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────────
-- ENUM-LIKE domain: valid call outcomes
-- Using a CHECK constraint rather than a PG ENUM so we can
-- add values in future without ALTER TYPE locks.
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'call_outcome'
  ) THEN
    CREATE TYPE call_outcome AS ENUM (
      'not_interested',
      'agreed_to_receive_report',
      'follow_up',
      'not_logged',
      'next_step_agreed',
      'do_not_call',
      'wrong_person',
      'interested',
      'moved_company',
      'call_again'
    );
  END IF;
END
$$;

-- ──────────────────────────────────────────────────────────────
-- TABLE: calls
-- One row per cold call session.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Caller info (the FDE making the call)
  caller_name          TEXT          NOT NULL DEFAULT 'FDE',

  -- Prospect / company info
  prospect_name        TEXT          NOT NULL,
  company              TEXT          NOT NULL DEFAULT '',
  prospect_role        TEXT          NOT NULL DEFAULT '',

  -- Additional contact fields (stored for display; not required)
  prospect_phone       TEXT          NOT NULL DEFAULT '',
  prospect_email       TEXT          NOT NULL DEFAULT '',
  prospect_location    TEXT          NOT NULL DEFAULT '',
  company_type         TEXT          NOT NULL DEFAULT '',

  -- Call lifecycle
  status               TEXT          NOT NULL DEFAULT 'in_progress'
                         CHECK (status IN ('in_progress', 'closed')),
  furthest_stage       INTEGER       NOT NULL DEFAULT 1
                         CHECK (furthest_stage BETWEEN 1 AND 8),
  is_demo              BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Outcome fields (NULL while call is in_progress)
  outcome              call_outcome,
  next_step            TEXT          NOT NULL DEFAULT '',
  summary              TEXT          NOT NULL DEFAULT '',
  summary_source       TEXT          NOT NULL DEFAULT 'none'
                         CHECK (summary_source IN ('ai', 'manual', 'fallback', 'none')),

  -- AI advisory fields — advisory only, never overrides caller's choice
  llm_suggested_outcome  TEXT,
  llm_suggested_next_step TEXT,
  llm_suggestion_reason   TEXT,

  -- Timestamps
  started_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  closed_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Safe addition of is_demo column if table already existed prior to this version
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

-- Constraint: closed calls must have an outcome
ALTER TABLE calls
  DROP CONSTRAINT IF EXISTS calls_closed_requires_outcome;

ALTER TABLE calls
  ADD CONSTRAINT calls_closed_requires_outcome
  CHECK (
    status = 'in_progress'
    OR (status = 'closed' AND outcome IS NOT NULL)
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calls_status         ON calls (status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at     ON calls (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_prospect_name  ON calls (prospect_name);
CREATE INDEX IF NOT EXISTS idx_calls_is_demo        ON calls (is_demo);

-- Auto-update updated_at via trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_calls_updated_at ON calls;
CREATE TRIGGER set_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ──────────────────────────────────────────────────────────────
-- TABLE: stage_results
-- One row per (call, stage) pair.
-- Notes are preserved across forward/backward navigation
-- via upsert (INSERT ... ON CONFLICT DO UPDATE).
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stage_results (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id        UUID          NOT NULL
                   REFERENCES calls (id) ON DELETE CASCADE,
  stage_number   INTEGER       NOT NULL
                   CHECK (stage_number BETWEEN 1 AND 8),

  -- What happened at this stage (array of action chip IDs stored as JSON text)
  what_happened  TEXT,        -- JSON array string e.g. '["right_person","gatekeeper"]'

  -- The prospect's verbatim words at this stage
  prospect_words TEXT,

  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Enforce one result row per call per stage
  CONSTRAINT uq_stage_results_call_stage UNIQUE (call_id, stage_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stage_results_call_id ON stage_results (call_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS set_stage_results_updated_at ON stage_results;
CREATE TRIGGER set_stage_results_updated_at
  BEFORE UPDATE ON stage_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- RLS is enabled but NO public policies are created.
-- All access goes through the backend using the service_role
-- (secret) key, which bypasses RLS entirely.
-- This prevents direct browser access to the database even if
-- the anon/public key were exposed.
-- ──────────────────────────────────────────────────────────────
ALTER TABLE calls         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_results ENABLE ROW LEVEL SECURITY;

-- No public SELECT/INSERT/UPDATE/DELETE policies.
-- Backend uses SUPABASE_SECRET_KEY (service_role) — bypasses RLS.
-- When auth is added in a future phase, create user-scoped policies here.

-- ──────────────────────────────────────────────────────────────
-- DONE
-- To verify: SELECT table_name FROM information_schema.tables
--            WHERE table_schema = 'public';
-- ──────────────────────────────────────────────────────────────
