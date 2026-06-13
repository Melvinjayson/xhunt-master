-- Migration 028: Replace Clerk-era RLS policies with Supabase-native auth
-- auth.uid() returns the Supabase user UUID which maps directly to user_profiles.id
-- The old clerk_user_id = auth.uid()::text comparison never matched — fix it.

-- Drop the malformed Clerk-bridge policy from migration 027
DROP POLICY IF EXISTS "read_own_profile_by_clerk_id" ON public.user_profiles;

-- Ensure a clean read-own-profile policy using Supabase auth.uid()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles' AND policyname = 'users_read_own_profile'
  ) THEN
    CREATE POLICY "users_read_own_profile"
      ON public.user_profiles
      FOR SELECT
      USING (id = auth.uid());
  END IF;
END $$;

-- XIL routing log: replace the broken clerk_user_id lookup with direct UUID match
DROP POLICY IF EXISTS "xil_routing_log_own" ON public.xil_routing_log;

CREATE POLICY "xil_routing_log_own"
  ON public.xil_routing_log
  FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());
