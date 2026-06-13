-- Migration 020: Add clerk_user_id to profiles for Clerk authentication
-- Clerk manages auth sessions; profiles are looked up by clerk_user_id
-- using the service-role admin client (bypasses Supabase Auth RLS).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;

CREATE INDEX IF NOT EXISTS profiles_clerk_user_id_idx
  ON profiles (clerk_user_id);

-- Add clerk_user_id to message participants and conversation lookups
-- (allows server-side queries scoped to the requesting Clerk user)
COMMENT ON COLUMN profiles.clerk_user_id IS
  'Clerk user ID (user_*) — used for server-side identity when Supabase Auth session is not present';
