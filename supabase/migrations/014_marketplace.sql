-- Migration 014: Marketplace
-- Orgs can list their missions publicly. Participants can discover, preview,
-- and apply to missions from any tenant through the marketplace.

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id       uuid        NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by       uuid        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  -- Display
  tagline          text        NOT NULL DEFAULT '',
  highlight        text,                          -- one bold callout sentence
  featured_image   text,                          -- URL
  -- Pricing / discovery
  listing_type     text        NOT NULL DEFAULT 'free'
                               CHECK (listing_type IN ('free', 'paid', 'sponsored')),
  price_cents      integer     NOT NULL DEFAULT 0,
  currency         text        NOT NULL DEFAULT 'usd',
  -- Discovery signals
  category         text,
  sdg_goals        integer[]   NOT NULL DEFAULT '{}',
  impact_area      text,
  required_skills  text[]      NOT NULL DEFAULT '{}',
  -- State
  status           text        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  is_featured      boolean     NOT NULL DEFAULT false,
  featured_until   timestamptz,
  -- Stats (denormalized for fast browsing)
  view_count       integer     NOT NULL DEFAULT 0,
  apply_count      integer     NOT NULL DEFAULT 0,
  -- Timestamps
  published_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id)
);

CREATE INDEX IF NOT EXISTS idx_ml_tenant   ON public.marketplace_listings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ml_status   ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_ml_featured ON public.marketplace_listings(is_featured, featured_until) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_ml_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_ml_sdgs     ON public.marketplace_listings USING GIN (sdg_goals);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can read active listings
CREATE POLICY "ml_public_read"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'active');

-- Tenant admins/creators can manage their own listings
CREATE POLICY "ml_tenant_manage"
  ON public.marketplace_listings FOR ALL
  USING (
    tenant_id = public.my_tenant_id()
    AND public.my_role() IN ('tenant_admin', 'mission_creator', 'platform_admin')
  );

CREATE TRIGGER marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Marketplace applications: a participant expresses interest
CREATE TABLE IF NOT EXISTS public.marketplace_applications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id     uuid        NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  mission_id     uuid        NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id        uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  tenant_id      uuid        REFERENCES public.tenants(id) ON DELETE SET NULL,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  cover_note     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ma_listing  ON public.marketplace_applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_ma_user     ON public.marketplace_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ma_status   ON public.marketplace_applications(status);

ALTER TABLE public.marketplace_applications ENABLE ROW LEVEL SECURITY;

-- Users can manage their own applications
CREATE POLICY "ma_own_all"
  ON public.marketplace_applications FOR ALL
  USING (user_id = auth.uid());

-- Tenant admins can review applications for their missions
CREATE POLICY "ma_tenant_review"
  ON public.marketplace_applications FOR ALL
  USING (
    tenant_id = public.my_tenant_id()
    AND public.my_role() IN ('tenant_admin', 'mission_creator', 'platform_admin')
  );

CREATE TRIGGER marketplace_applications_updated_at
  BEFORE UPDATE ON public.marketplace_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Increment view_count safely
CREATE OR REPLACE FUNCTION public.increment_listing_views(p_listing_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.marketplace_listings
  SET view_count = view_count + 1
  WHERE id = p_listing_id;
$$;
