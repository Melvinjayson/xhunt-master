-- ============================================================
-- Phase 2: Knowledge Graph, MEI Scoring, Outcome Events
-- ============================================================

-- Knowledge graph: nodes
CREATE TABLE IF NOT EXISTS kg_nodes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES tenants(id) ON DELETE CASCADE,
  node_type   text NOT NULL CHECK (node_type IN ('user','skill','mission','outcome','reward','organization','industry')),
  label       text NOT NULL,
  properties  jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kg_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_kg_nodes" ON kg_nodes
  USING (tenant_id = my_tenant_id() OR tenant_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_kg_nodes_tenant_type ON kg_nodes(tenant_id, node_type);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_label ON kg_nodes USING gin(to_tsvector('english', label));

-- Knowledge graph: edges (directed relationships)
CREATE TABLE IF NOT EXISTS kg_edges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  from_node_id  uuid NOT NULL REFERENCES kg_nodes(id) ON DELETE CASCADE,
  to_node_id    uuid NOT NULL REFERENCES kg_nodes(id) ON DELETE CASCADE,
  relationship  text NOT NULL,  -- 'completes', 'requires', 'develops', 'unlocks', 'leads_to', 'similar_to'
  weight        float NOT NULL DEFAULT 1.0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_node_id, to_node_id, relationship)
);

ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_kg_edges" ON kg_edges
  USING (tenant_id = my_tenant_id() OR tenant_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON kg_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON kg_edges(to_node_id);

-- Mission Effectiveness Index (MEI) — computed scores per mission
CREATE TABLE IF NOT EXISTS mission_scores (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id         uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  tenant_id          uuid REFERENCES tenants(id) ON DELETE CASCADE,
  completion_score   float NOT NULL DEFAULT 0 CHECK (completion_score >= 0 AND completion_score <= 100),
  engagement_score   float NOT NULL DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  retention_score    float NOT NULL DEFAULT 0 CHECK (retention_score >= 0 AND retention_score <= 100),
  outcome_score      float NOT NULL DEFAULT 0 CHECK (outcome_score >= 0 AND outcome_score <= 100),
  mei                float NOT NULL DEFAULT 0 CHECK (mei >= 0 AND mei <= 100),
  sample_size        int NOT NULL DEFAULT 0,
  computed_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id)
);

ALTER TABLE mission_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_scores" ON mission_scores
  FOR SELECT USING (tenant_id = my_tenant_id());

CREATE POLICY "tenant_upsert_scores" ON mission_scores
  FOR INSERT WITH CHECK (tenant_id = my_tenant_id());

CREATE POLICY "tenant_update_scores" ON mission_scores
  FOR UPDATE USING (tenant_id = my_tenant_id());

-- Outcome events — what actually happened as a result of missions
CREATE TABLE IF NOT EXISTS outcome_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES tenants(id) ON DELETE CASCADE,
  mission_id     uuid REFERENCES missions(id) ON DELETE SET NULL,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  outcome_type   text NOT NULL,  -- 'skill_acquired', 'task_completed', 'product_adopted', 'behavior_changed', 'custom'
  outcome_value  jsonb NOT NULL DEFAULT '{}',
  measured_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outcome_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_outcomes" ON outcome_events
  USING (tenant_id = my_tenant_id());

CREATE INDEX IF NOT EXISTS idx_outcome_events_mission ON outcome_events(mission_id);
CREATE INDEX IF NOT EXISTS idx_outcome_events_tenant ON outcome_events(tenant_id, measured_at DESC);

-- Outcome roadmaps — saved output from Outcome Planner agent
CREATE TABLE IF NOT EXISTS outcome_roadmaps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  desired_outcome text NOT NULL,
  roadmap         jsonb NOT NULL DEFAULT '{}',  -- OutcomePlannerOutput
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outcome_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_roadmaps" ON outcome_roadmaps
  USING (tenant_id = my_tenant_id());
