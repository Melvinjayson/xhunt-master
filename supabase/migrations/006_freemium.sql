-- ── 006_freemium.sql ─────────────────────────────────────────────────────────
-- Freemium subscription tier + rate limiting for consumer AI features

-- ── Extend user_profiles ──────────────────────────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier  text        NOT NULL DEFAULT 'free'
    CONSTRAINT user_profiles_subscription_tier_check
      CHECK (subscription_tier IN ('free', 'trial', 'pro')),
  ADD COLUMN IF NOT EXISTS trial_started_at   timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at      timestamptz,
  ADD COLUMN IF NOT EXISTS ai_requests_today  integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_requests_reset_at timestamptz NOT NULL DEFAULT now();

-- ── Rate-limit configuration (admin-managed, publicly readable) ──────────────
CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  tier                      text    PRIMARY KEY
    CHECK (tier IN ('free', 'trial', 'pro')),
  ai_requests_per_day       integer NOT NULL DEFAULT 0,
  can_access_premium_missions boolean NOT NULL DEFAULT false,
  model_id                  text    NOT NULL DEFAULT 'none',
  updated_at                timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.rate_limit_config
  (tier,    ai_requests_per_day, can_access_premium_missions, model_id)
VALUES
  ('free',  0,   false, 'none'),
  ('trial', 50,  true,  'llama-3.1-8b-instant'),
  ('pro',   500, true,  'llama-3.3-70b-versatile')
ON CONFLICT (tier) DO NOTHING;

-- RLS: anyone can read rate limit config (it's not sensitive)
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limit_config_public_read"
  ON public.rate_limit_config FOR SELECT USING (true);

-- ── Auto-expire trial on profile read/update ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_trial_if_needed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.subscription_tier = 'trial'
     AND NEW.trial_ends_at IS NOT NULL
     AND NEW.trial_ends_at < now() THEN
    NEW.subscription_tier := 'free';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expire_trial ON public.user_profiles;
CREATE TRIGGER trg_expire_trial
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.expire_trial_if_needed();

-- ── RLS: users can update their own rate-limit counters ──────────────────────
-- (existing "users can update own profile" policy covers this)
