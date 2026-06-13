-- Migration 009: trial reminder tracking + pg_cron setup

-- Track whether we've sent the day-11 trial reminder for this user
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS trial_reminder_sent boolean NOT NULL DEFAULT false;

-- ── pg_cron: schedule daily trial reminder Edge Function ────────────────────
-- Requires pg_cron extension to be enabled in Supabase dashboard:
--   Settings → Database → Extensions → pg_cron
--
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY with actual values,
-- then uncomment and run this block.

/*
SELECT cron.schedule(
  'daily-trial-reminder',
  '0 9 * * *',   -- 9:00 AM UTC every day
  $$
    SELECT
      net.http_post(
        url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/trial-reminder',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
        ),
        body    := '{}'::jsonb
      )
    AS request_id;
  $$
);
*/
