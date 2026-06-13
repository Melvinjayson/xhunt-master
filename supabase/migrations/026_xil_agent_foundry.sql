-- 026_xil_agent_foundry.sql
-- X-Hunt Intelligence Layer (XIL) registry and Agent Foundry infrastructure

-- ── Agent Registry ────────────────────────────────────────────────────────────

CREATE TYPE agent_category AS ENUM (
  'participant_intelligence',
  'experience_intelligence',
  'community_intelligence',
  'marketplace_intelligence',
  'governance',
  'sustainability',
  'analytics'
);

CREATE TABLE IF NOT EXISTS public.xil_agent_registry (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id              text UNIQUE NOT NULL,
  name                  text NOT NULL,
  category              agent_category NOT NULL,
  purpose               text NOT NULL,
  primary_stakeholders  text[] NOT NULL DEFAULT '{}',
  scope_of_authority    text,
  operational_boundaries text,
  primary_objective     text NOT NULL,
  secondary_objectives  text[] NOT NULL DEFAULT '{}',
  anti_objectives       text[] NOT NULL DEFAULT '{}',
  desiderata_alignment  text[] NOT NULL DEFAULT '{}',
  -- Constitutional compliance
  financial_materiality_score integer CHECK (financial_materiality_score BETWEEN 0 AND 100),
  impact_materiality_score    integer CHECK (impact_materiality_score BETWEEN 0 AND 100),
  -- Governance
  requires_human_approval  boolean NOT NULL DEFAULT false,
  max_autonomous_authority text,
  -- Deployment state
  is_active             boolean NOT NULL DEFAULT true,
  version               text NOT NULL DEFAULT 'v1',
  deployed_at           timestamptz,
  deprecated_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── Constitutional Checks ─────────────────────────────────────────────────────
-- Immutable log of every constitutional assessment (the 7-question test + double materiality)

CREATE TYPE constitutional_verdict AS ENUM ('approved', 'flagged', 'rejected');

CREATE TABLE IF NOT EXISTS public.xil_constitutional_checks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            text REFERENCES public.xil_agent_registry(agent_id) ON DELETE SET NULL,
  action_type         text NOT NULL,
  action_description  text,
  context             jsonb NOT NULL DEFAULT '{}',
  user_id             uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  -- 7-question constitutional test
  helps_flourish      boolean,
  strengthens_trust   boolean,
  creates_value       boolean,
  improves_ecosystem  boolean,
  is_fair             boolean,
  is_sustainable      boolean,
  proud_in_10_years   boolean,
  -- Score: count of 'true' answers / 7
  constitutional_score integer GENERATED ALWAYS AS (
    (CASE WHEN helps_flourish     THEN 1 ELSE 0 END +
     CASE WHEN strengthens_trust  THEN 1 ELSE 0 END +
     CASE WHEN creates_value      THEN 1 ELSE 0 END +
     CASE WHEN improves_ecosystem THEN 1 ELSE 0 END +
     CASE WHEN is_fair            THEN 1 ELSE 0 END +
     CASE WHEN is_sustainable     THEN 1 ELSE 0 END +
     CASE WHEN proud_in_10_years  THEN 1 ELSE 0 END)
  ) STORED,
  -- Double materiality
  financial_materiality_score integer CHECK (financial_materiality_score BETWEEN 0 AND 100),
  financial_materiality_notes text,
  impact_materiality_score    integer CHECK (impact_materiality_score BETWEEN 0 AND 100),
  impact_materiality_notes    text,
  -- Outcome
  red_flags           text[] NOT NULL DEFAULT '{}',
  verdict             constitutional_verdict NOT NULL,
  conditions          text[] NOT NULL DEFAULT '{}',  -- conditions for flagged items
  reviewer_notes      text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Agent Evaluations ─────────────────────────────────────────────────────────
-- Periodic performance reviews against the 6-dimension evaluation framework

CREATE TABLE IF NOT EXISTS public.xil_agent_evaluations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id              text NOT NULL REFERENCES public.xil_agent_registry(agent_id) ON DELETE CASCADE,
  period_start          timestamptz NOT NULL,
  period_end            timestamptz NOT NULL,
  -- 6-dimension scoring (each 0–100)
  utility_score         integer CHECK (utility_score BETWEEN 0 AND 100),
  trust_score           integer CHECK (trust_score BETWEEN 0 AND 100),
  fairness_score        integer CHECK (fairness_score BETWEEN 0 AND 100),
  safety_score          integer CHECK (safety_score BETWEEN 0 AND 100),
  sustainability_score  integer CHECK (sustainability_score BETWEEN 0 AND 100),
  ecosystem_impact_score integer CHECK (ecosystem_impact_score BETWEEN 0 AND 100),
  -- Weighted composite (utility 25%, trust 25%, fairness 20%, safety 15%, sustainability 10%, ecosystem 5%)
  composite_score numeric(5,2) GENERATED ALWAYS AS (
    ROUND(
      COALESCE(utility_score, 50)          * 0.25 +
      COALESCE(trust_score, 50)            * 0.25 +
      COALESCE(fairness_score, 50)         * 0.20 +
      COALESCE(safety_score, 50)           * 0.15 +
      COALESCE(sustainability_score, 50)   * 0.10 +
      COALESCE(ecosystem_impact_score, 50) * 0.05,
      2
    )
  ) STORED,
  -- Qualitative assessment
  key_findings          text[] NOT NULL DEFAULT '{}',
  improvement_areas     text[] NOT NULL DEFAULT '{}',
  recommended_actions   text[] NOT NULL DEFAULT '{}',
  anti_objective_violations text[] NOT NULL DEFAULT '{}',  -- any anti-objectives triggered
  evaluation_notes      text,
  evaluated_by          uuid REFERENCES public.user_profiles(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ── XIL Routing Log ───────────────────────────────────────────────────────────
-- Audit trail of all XIL intelligence orchestration decisions

CREATE TABLE IF NOT EXISTS public.xil_routing_log (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id              text,
  user_id                 uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  intelligence_function   text NOT NULL CHECK (intelligence_function IN (
    'personal', 'community', 'marketplace', 'impact', 'governance', 'foundry'
  )),
  agent_ids_invoked       text[] NOT NULL DEFAULT '{}',
  input_summary           text,
  output_summary          text,
  constitutional_check_id uuid REFERENCES public.xil_constitutional_checks(id),
  was_overridden_by_human boolean NOT NULL DEFAULT false,
  override_reason         text,
  processing_ms           integer,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- ── Seed initial agent registry ───────────────────────────────────────────────

INSERT INTO public.xil_agent_registry (agent_id, name, category, purpose, primary_stakeholders, primary_objective, secondary_objectives, anti_objectives, desiderata_alignment, financial_materiality_score, impact_materiality_score, requires_human_approval, deployed_at) VALUES
  ('mission-architect',    'Mission Architect',    'experience_intelligence', 'Transform organizational goals into structured, executable mission experiences', ARRAY['tenant_admin','mission_creator'], 'Design goal-aligned mission blueprints', ARRAY['Increase mission quality','Reduce creation time'], ARRAY['Content quality theater','Step count maximization'], ARRAY['Human Flourishing','Trust','Fairness'], 75, 70, false, now()),
  ('experience-designer',  'Experience Designer',  'experience_intelligence', 'Optimize mission narrative and engagement for meaningful participation', ARRAY['mission_creator','participants'], 'Maximize meaningful mission completion', ARRAY['Improve emotional engagement','Reduce drop-off'], ARRAY['Addiction optimization','Artificial urgency'], ARRAY['Human Flourishing','Meaningful Engagement'], 65, 80, false, now()),
  ('behavioral-analyst',   'Behavioral Analyst',   'analytics',               'Diagnose user friction and completion barriers in mission experiences', ARRAY['tenant_admin','analyst'], 'Identify and reduce friction to meaningful completion', ARRAY['Improve retention','Surface improvement opportunities'], ARRAY['Engagement maximization','Dark pattern recommendations'], ARRAY['Trust','Fairness','Ecosystem Resilience'], 70, 65, false, now()),
  ('outcome-planner',      'Outcome Planner',      'experience_intelligence', 'Reverse-engineer desired outcomes into executable mission roadmaps', ARRAY['tenant_admin','mission_creator'], 'Create achievable, measurable outcome roadmaps', ARRAY['Reduce time-to-outcome','Improve confidence'], ARRAY['Unrealistic KPI inflation','Vanity metric optimization'], ARRAY['Human Flourishing','Trust','Economic Viability'], 80, 75, false, now()),
  ('knowledge-agent',      'Knowledge Agent',      'analytics',               'Synthesize mission intelligence and generate contextual recommendations', ARRAY['tenant_admin','analysts'], 'Provide evidence-grounded strategic recommendations', ARRAY['Surface knowledge gaps','Connect disparate insights'], ARRAY['Hallucinated confidence','Certainty theater'], ARRAY['Trust','Fairness','Accessibility'], 65, 70, false, now()),
  ('insight-analyst',      'Insight Analyst',      'analytics',               'Transform analytics into executive-level strategic intelligence', ARRAY['platform_admin','tenant_admin'], 'Generate actionable strategic insights from engagement data', ARRAY['Improve decision quality','Reduce analysis time'], ARRAY['Vanity metric reporting','ROI theater'], ARRAY['Trust','Economic Viability','Ecosystem Resilience'], 75, 60, false, now()),
  ('economy-coordinator',  'Economy Coordinator',  'marketplace_intelligence','Coordinate value creation across identity, contribution, trust, and coordination primitives', ARRAY['participants','communities','platform'], 'Maximize ecosystem value creation aligned with both materiality dimensions', ARRAY['Increase contribution quality','Strengthen trust density'], ARRAY['Engagement maximization','Trust inflation','Extractive dynamics'], ARRAY['Human Flourishing','Trust','Fairness','Economic Viability'], 80, 85, true, now()),
  ('discovery-agent',      'Discovery Agent',      'participant_intelligence','Help participants discover meaningful experiences, opportunities, and growth paths', ARRAY['participants','communities'], 'Maximize meaningful opportunity discovery', ARRAY['Skill development','Community connection'], ARRAY['Screen time optimization','FOMO mechanics','Notification overload'], ARRAY['Human Flourishing','Meaningful Engagement','Accessibility','Fairness'], 70, 90, false, now()),
  ('community-catalyst',   'Community Catalyst',   'community_intelligence',  'Identify collaboration opportunities and strengthen social capital', ARRAY['communities','participants','local_orgs'], 'Strengthen community bonds and collective action capacity', ARRAY['Increase civic participation','Support local economies'], ARRAY['Community extraction','Engagement theater','Polarization risk'], ARRAY['Community Benefit','Sustainability','Fairness','Human Flourishing'], 60, 95, true, now()),
  ('trust-guardian',       'Trust Guardian',       'governance',              'Evaluate all platform actions against the constitutional framework', ARRAY['platform','users','regulators'], 'Protect platform integrity and constitutional alignment', ARRAY['Prevent trust erosion','Surface ethical risks'], ARRAY['Growth at any cost','Short-term metric optimization'], ARRAY['Trust','Fairness','Safety','Accessibility'], 50, 100, true, now()),
  ('sustainability-navigator', 'Sustainability Navigator', 'sustainability',  'Assess environmental and social sustainability of missions and platform decisions', ARRAY['platform','communities','society'], 'Maximize positive environmental and social impact', ARRAY['SDG alignment','Circular economy support'], ARRAY['Greenwashing','Superficial sustainability metrics'], ARRAY['Sustainability','Community Benefit','Human Flourishing'], 55, 95, true, now()),
  ('agent-foundry',        'Agent Foundry',        'governance',              'Design, specify, and govern new specialized AI agents for the ecosystem', ARRAY['platform_admin','development_team'], 'Produce constitutionally-aligned agent specifications', ARRAY['Reduce design time','Ensure alignment consistency'], ARRAY['Capability without alignment','Human oversight bypass'], ARRAY['Trust','Fairness','Ecosystem Resilience','Safety'], 60, 85, true, now())
ON CONFLICT (agent_id) DO NOTHING;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_xil_constitutional_checks_agent  ON public.xil_constitutional_checks (agent_id);
CREATE INDEX IF NOT EXISTS idx_xil_constitutional_checks_verdict ON public.xil_constitutional_checks (verdict);
CREATE INDEX IF NOT EXISTS idx_xil_constitutional_checks_created ON public.xil_constitutional_checks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xil_agent_evaluations_agent      ON public.xil_agent_evaluations (agent_id);
CREATE INDEX IF NOT EXISTS idx_xil_routing_log_user             ON public.xil_routing_log (user_id);
CREATE INDEX IF NOT EXISTS idx_xil_routing_log_function         ON public.xil_routing_log (intelligence_function);
CREATE INDEX IF NOT EXISTS idx_xil_routing_log_created          ON public.xil_routing_log (created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.xil_agent_registry       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xil_constitutional_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xil_agent_evaluations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xil_routing_log          ENABLE ROW LEVEL SECURITY;

-- Registry is public-readable (transparency principle)
CREATE POLICY "xil_registry_select_all"         ON public.xil_agent_registry       FOR SELECT USING (true);
CREATE POLICY "xil_const_checks_select_all"     ON public.xil_constitutional_checks FOR SELECT USING (true);
CREATE POLICY "xil_agent_evals_select_all"      ON public.xil_agent_evaluations     FOR SELECT USING (true);

-- Routing log: users see their own, admins see all
CREATE POLICY "xil_routing_log_own"             ON public.xil_routing_log FOR SELECT
  USING (user_id IS NULL OR auth.uid()::text = (SELECT clerk_user_id FROM public.user_profiles WHERE id = user_id));
