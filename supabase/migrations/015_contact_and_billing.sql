-- ── 015_contact_and_billing.sql ───────────────────────────────────────────────
-- Contact form submissions + billing subscription status tracking

-- ── Contact submissions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type  text        NOT NULL,
  name          text        NOT NULL,
  email         text        NOT NULL,
  org           text,
  message       text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  handled_at    timestamptz,
  handled_by    uuid        REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- Prevent RLS bypass — anon inserts OK (public contact form), admin reads only
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_public_insert"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contact_admin_read"
  ON public.contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Stripe: subscription_status column on user_profiles ───────────────────────
-- Distinct from subscription_tier — records the raw Stripe status string
-- (active, past_due, canceled, trialing, etc.) for billing portal display.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_status text;

-- Index for webhook lookups by stripe_customer_id (already in 007, ensured here)
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_stripe_customer_id_idx
  ON public.user_profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
