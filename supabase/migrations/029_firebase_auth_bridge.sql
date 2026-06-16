-- Migration 029: Firebase Auth Bridge
-- Fixes FK references from auth.users → user_profiles(id) for Firebase UID compatibility.
-- Adds missing columns to outcome_validations, reward_events, and user_profiles.
-- Creates platform_events table for the routing bus event spine.

BEGIN;

-- ─── outcome_validations ───────────────────────────────────────────────────────

-- Drop existing FK on user_id pointing to auth.users (if any)
ALTER TABLE outcome_validations
  DROP CONSTRAINT IF EXISTS outcome_validations_user_id_fkey;

-- Re-add FK pointing to user_profiles(id) which holds the internal UUID
ALTER TABLE outcome_validations
  ADD CONSTRAINT outcome_validations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Add missing columns (idempotent via IF NOT EXISTS)
ALTER TABLE outcome_validations
  ADD COLUMN IF NOT EXISTS progress_id   UUID REFERENCES mission_progress(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verdict       JSONB,
  ADD COLUMN IF NOT EXISTS verified_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes         TEXT,
  ADD COLUMN IF NOT EXISTS constitutional_check_id TEXT;

-- ─── mission_events ────────────────────────────────────────────────────────────

ALTER TABLE mission_events
  DROP CONSTRAINT IF EXISTS mission_events_user_id_fkey;

ALTER TABLE mission_events
  ADD CONSTRAINT mission_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- ─── reward_events ─────────────────────────────────────────────────────────────

ALTER TABLE reward_events
  DROP CONSTRAINT IF EXISTS reward_events_user_id_fkey;

ALTER TABLE reward_events
  ADD CONSTRAINT reward_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE reward_events
  ADD COLUMN IF NOT EXISTS validation_id     UUID REFERENCES outcome_validations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS base_reward       NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_amount      NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_payout      NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_awarded        INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escrow_check      TEXT DEFAULT 'clear',
  ADD COLUMN IF NOT EXISTS release_immediately BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS released_at       TIMESTAMPTZ;

-- ─── user_profiles ─────────────────────────────────────────────────────────────

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS hunter_score       NUMERIC(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hunter_tier        TEXT DEFAULT 'Explorer',
  ADD COLUMN IF NOT EXISTS missions_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_xp           INT DEFAULT 0;

-- ─── platform_events ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS platform_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT NOT NULL,
  target      TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;

-- Platform admins can read all events; service role bypasses RLS
CREATE POLICY IF NOT EXISTS "platform_events_service_all"
  ON platform_events FOR ALL
  USING (true)
  WITH CHECK (true);

COMMIT;
