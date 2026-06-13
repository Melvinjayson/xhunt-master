-- 022_contribution_ledger.sql
-- Contribution Ledger: captures all value-producing actions with impact weighting and collaborative attribution

CREATE TYPE contribution_type AS ENUM (
  'work_output',
  'knowledge_creation',
  'coordination_effort',
  'creative_innovation',
  'community_contribution',
  'ai_assisted_creation'
);

CREATE TYPE ai_role AS ENUM (
  'none',
  'assisted',
  'co_created',
  'ai_primary'
);

CREATE TYPE attribution_role AS ENUM (
  'author',
  'reviewer',
  'collaborator',
  'ai_assistant',
  'coordinator'
);

-- Core ledger: one row per discrete contribution event
CREATE TABLE IF NOT EXISTS public.contribution_ledger (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  tenant_id              uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  mission_id             uuid REFERENCES public.missions(id) ON DELETE SET NULL,
  contribution_type      contribution_type NOT NULL,
  title                  text NOT NULL,
  description            text,
  -- Quantified value
  value_points           integer NOT NULL DEFAULT 0 CHECK (value_points >= 0),
  impact_weight          numeric(4,3) NOT NULL DEFAULT 1.0 CHECK (impact_weight BETWEEN 0.001 AND 5.0),
  -- AI attribution
  ai_role                ai_role NOT NULL DEFAULT 'none',
  ai_model               text,                   -- which model assisted, if any
  -- Validation state
  peer_validations       integer NOT NULL DEFAULT 0,
  confidence_score       numeric(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
  -- Portability hash for cross-platform verification
  verification_hash      text UNIQUE,
  -- Arbitrary structured metadata (deliverable URLs, evidence links, etc.)
  metadata               jsonb NOT NULL DEFAULT '{}',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Attribution: who contributed how much to a given contribution (supports joint work)
CREATE TABLE IF NOT EXISTS public.contribution_attribution (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id   uuid NOT NULL REFERENCES public.contribution_ledger(id) ON DELETE CASCADE,
  contributor_id    uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role              attribution_role NOT NULL DEFAULT 'author',
  weight            numeric(4,3) NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 1),
  verified          boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contribution_id, contributor_id)
);

-- Peer validation events: captures who validated what and when
CREATE TABLE IF NOT EXISTS public.contribution_validations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id   uuid NOT NULL REFERENCES public.contribution_ledger(id) ON DELETE CASCADE,
  validator_id      uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  verdict           text NOT NULL CHECK (verdict IN ('approved', 'rejected', 'needs_revision')),
  note              text,
  confidence_pct    integer CHECK (confidence_pct BETWEEN 0 AND 100),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contribution_id, validator_id)
);

-- Denormalized summary per user (refreshed by triggers / cron)
CREATE TABLE IF NOT EXISTS public.contribution_summaries (
  user_id            uuid PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  total_points       integer NOT NULL DEFAULT 0,
  total_contributions integer NOT NULL DEFAULT 0,
  by_type            jsonb NOT NULL DEFAULT '{}',   -- {work_output: 40, knowledge_creation: 20, ...}
  top_domains        jsonb NOT NULL DEFAULT '[]',   -- [{domain: "education", points: 120}, ...]
  avg_confidence     numeric(5,2),
  ai_collaboration_pct numeric(5,2),               -- % of contributions that had AI role != none
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contribution_ledger_user    ON public.contribution_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_ledger_mission ON public.contribution_ledger (mission_id);
CREATE INDEX IF NOT EXISTS idx_contribution_ledger_type    ON public.contribution_ledger (contribution_type);
CREATE INDEX IF NOT EXISTS idx_contribution_ledger_created ON public.contribution_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contribution_attribution_contributor
  ON public.contribution_attribution (contributor_id);

-- Trigger: keep contribution_summaries up to date
CREATE OR REPLACE FUNCTION update_contribution_summary()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.contribution_summaries (user_id, total_points, total_contributions, updated_at)
  VALUES (NEW.user_id, NEW.value_points, 1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_points        = contribution_summaries.total_points + NEW.value_points,
        total_contributions = contribution_summaries.total_contributions + 1,
        updated_at          = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_contribution_summary
  AFTER INSERT ON public.contribution_ledger
  FOR EACH ROW EXECUTE FUNCTION update_contribution_summary();

-- RLS
ALTER TABLE public.contribution_ledger         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_attribution    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_validations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_summaries      ENABLE ROW LEVEL SECURITY;

-- Users can read any contribution (public ledger), write their own
CREATE POLICY "contributions_select_all"  ON public.contribution_ledger FOR SELECT USING (true);
CREATE POLICY "contributions_insert_own"  ON public.contribution_ledger FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM public.user_profiles WHERE id = user_id));
CREATE POLICY "contributions_update_own"  ON public.contribution_ledger FOR UPDATE
  USING (auth.uid()::text = (SELECT clerk_user_id FROM public.user_profiles WHERE id = user_id));

CREATE POLICY "attribution_select_all"    ON public.contribution_attribution FOR SELECT USING (true);
CREATE POLICY "validations_select_all"    ON public.contribution_validations FOR SELECT USING (true);
CREATE POLICY "summaries_select_all"      ON public.contribution_summaries   FOR SELECT USING (true);
