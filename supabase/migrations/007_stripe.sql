-- ── 007_stripe.sql ───────────────────────────────────────────────────────────
-- Stripe subscription tracking fields on user_profiles

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_status text;

-- Unique index so we can look up a profile by Stripe customer
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_stripe_customer_id_idx
  ON public.user_profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
