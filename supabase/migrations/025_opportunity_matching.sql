-- 025_opportunity_matching.sql
-- Opportunity Matching Engine: People↔Work, Skills↔Problems, Teams↔Missions, Agents↔Tasks

CREATE TYPE workflow_type AS ENUM (
  'human_only',
  'ai_assisted',
  'hybrid',
  'autonomous'
);

CREATE TYPE workflow_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled'
);

-- Match signals: user-level signals that inform the matching engine
CREATE TABLE IF NOT EXISTS public.match_signals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  signal_type  text NOT NULL CHECK (signal_type IN (
    'skill', 'interest', 'availability', 'location',
    'trust_threshold', 'contribution_level', 'collaboration_preference',
    'time_commitment', 'compensation_floor', 'domain_preference'
  )),
  value        text NOT NULL,
  weight       numeric(4,3) NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0 AND 1),
  source       text NOT NULL DEFAULT 'self_declared', -- 'self_declared', 'inferred', 'verified'
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Match results: pre-computed matches between users and missions
CREATE TABLE IF NOT EXISTS public.match_results (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id          uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  mission_id         uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  -- Dimension scores (0–100)
  skill_match        numeric(5,2) NOT NULL DEFAULT 0,
  trust_match        numeric(5,2) NOT NULL DEFAULT 0,
  availability_match numeric(5,2) NOT NULL DEFAULT 0,
  location_match     numeric(5,2) NOT NULL DEFAULT 0,
  interest_match     numeric(5,2) NOT NULL DEFAULT 0,
  contribution_match numeric(5,2) NOT NULL DEFAULT 0,
  -- Weighted composite
  composite_score    numeric(5,2) NOT NULL DEFAULT 0,
  match_rationale    text,
  skill_gaps         jsonb NOT NULL DEFAULT '[]',
  growth_opportunity numeric(5,2) DEFAULT 0,    -- how much this stretches the user beneficially
  algorithm_version  text NOT NULL DEFAULT 'v1',
  computed_at        timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  -- User action on this match
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'applied', 'dismissed', 'accepted')),
  UNIQUE (seeker_id, mission_id)
);

-- Coordination workflows: structured execution plans for human-AI collaboration
CREATE TABLE IF NOT EXISTS public.coordination_workflows (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id          uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  tenant_id           uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  workflow_type       workflow_type NOT NULL DEFAULT 'human_only',
  status              workflow_status NOT NULL DEFAULT 'draft',
  title               text NOT NULL,
  description         text,
  -- Structured step definitions
  steps               jsonb NOT NULL DEFAULT '[]',
  -- {step_id, title, assignee_type: human|ai|either, checkpoint: bool, dependencies: [], status, completed_at}
  assigned_agents     jsonb NOT NULL DEFAULT '[]',  -- [{agent_id, role, scope}]
  human_checkpoints   integer NOT NULL DEFAULT 0,   -- number of mandatory human review gates
  -- Governance
  governance_rules    jsonb NOT NULL DEFAULT '{}',  -- override conditions, escalation paths
  audit_trail         jsonb NOT NULL DEFAULT '[]',  -- append-only event log within workflow
  -- Performance
  estimated_hours     numeric(6,2),
  actual_hours        numeric(6,2),
  created_by          uuid REFERENCES public.user_profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Team formation: group recommendations for mission execution
CREATE TABLE IF NOT EXISTS public.team_formations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      uuid NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  workflow_id     uuid REFERENCES public.coordination_workflows(id) ON DELETE SET NULL,
  members         jsonb NOT NULL DEFAULT '[]',
  -- [{user_id, role, skill_contribution, trust_score, assigned_steps}]
  ai_members      jsonb NOT NULL DEFAULT '[]',
  -- [{agent_id, agent_type, task_scope, human_oversight_required}]
  team_score      numeric(5,2),               -- overall team compatibility/capability score
  coverage_gaps   jsonb NOT NULL DEFAULT '[]',
  status          text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'active', 'dissolved')),
  formed_at       timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Governance actions: transparent record of ranking/matching decisions
CREATE TABLE IF NOT EXISTS public.governance_actions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type     text NOT NULL CHECK (action_type IN (
    'ranking_override', 'match_suppression', 'trust_adjustment',
    'credential_revocation', 'dispute_resolution', 'policy_update',
    'agent_constraint_applied', 'human_escalation'
  )),
  actor_id        uuid REFERENCES public.user_profiles(id),  -- who triggered it (null = system)
  target_user_id  uuid REFERENCES public.user_profiles(id),
  target_mission_id uuid REFERENCES public.missions(id),
  rationale       text NOT NULL,
  before_state    jsonb,
  after_state     jsonb,
  is_reversible   boolean NOT NULL DEFAULT true,
  reversed_at     timestamptz,
  reviewed_by     uuid REFERENCES public.user_profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_match_signals_user         ON public.match_signals (user_id);
CREATE INDEX IF NOT EXISTS idx_match_signals_type         ON public.match_signals (signal_type);
CREATE INDEX IF NOT EXISTS idx_match_results_seeker       ON public.match_results (seeker_id);
CREATE INDEX IF NOT EXISTS idx_match_results_mission      ON public.match_results (mission_id);
CREATE INDEX IF NOT EXISTS idx_match_results_composite    ON public.match_results (composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_results_expires      ON public.match_results (expires_at);
CREATE INDEX IF NOT EXISTS idx_coordination_workflows_mission ON public.coordination_workflows (mission_id);
CREATE INDEX IF NOT EXISTS idx_team_formations_mission    ON public.team_formations (mission_id);
CREATE INDEX IF NOT EXISTS idx_governance_actions_type    ON public.governance_actions (action_type);
CREATE INDEX IF NOT EXISTS idx_governance_actions_created ON public.governance_actions (created_at DESC);

-- Function: compute composite match score
CREATE OR REPLACE FUNCTION compute_match_score(
  p_skill        numeric,
  p_trust        numeric,
  p_availability numeric,
  p_location     numeric,
  p_interest     numeric,
  p_contribution numeric
)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT ROUND(
    p_skill        * 0.30 +
    p_trust        * 0.25 +
    p_availability * 0.15 +
    p_location     * 0.10 +
    p_interest     * 0.15 +
    p_contribution * 0.05,
    2
  )
$$;

-- RLS
ALTER TABLE public.match_signals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordination_workflows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_formations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_actions      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_signals_own"         ON public.match_signals FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_user_id FROM public.user_profiles WHERE id = user_id));
CREATE POLICY "match_signals_insert_own"  ON public.match_signals FOR INSERT
  WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM public.user_profiles WHERE id = user_id));

CREATE POLICY "match_results_own"         ON public.match_results FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_user_id FROM public.user_profiles WHERE id = seeker_id));

CREATE POLICY "coordination_workflows_select" ON public.coordination_workflows FOR SELECT USING (true);
CREATE POLICY "team_formations_select"        ON public.team_formations        FOR SELECT USING (true);
CREATE POLICY "governance_actions_select"     ON public.governance_actions     FOR SELECT USING (true);
