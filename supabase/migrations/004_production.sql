-- ============================================================
-- Production Sprint: Event Pipeline, Mission Rewards Join,
-- Mission Outcomes, Progress Unique Constraint
-- ============================================================

-- Unique constraint on mission_progress so upserts work cleanly
ALTER TABLE mission_progress
  ADD CONSTRAINT uq_mission_progress_user_mission
  UNIQUE (user_id, mission_id);

-- mission_events: universal event pipeline
CREATE TABLE IF NOT EXISTS mission_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mission_id  uuid REFERENCES missions(id) ON DELETE CASCADE,
  step_id     int,
  event_type  text NOT NULL CHECK (event_type IN (
    'mission_viewed',
    'mission_started',
    'mission_resumed',
    'step_started',
    'step_completed',
    'step_skipped',
    'reward_viewed',
    'reward_claimed',
    'mission_completed',
    'mission_abandoned'
  )),
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_events" ON mission_events
  FOR SELECT USING (tenant_id = my_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "anyone_insert_events" ON mission_events
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_events_mission     ON mission_events(mission_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_tenant_time ON mission_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_time   ON mission_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type        ON mission_events(event_type, created_at DESC);

-- mission_rewards: link missions to reward configs
CREATE TABLE IF NOT EXISTS mission_rewards (
  mission_id  uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  reward_id   uuid NOT NULL REFERENCES reward_configs(id) ON DELETE CASCADE,
  PRIMARY KEY (mission_id, reward_id)
);

ALTER TABLE mission_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_mission_rewards" ON mission_rewards
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_id AND m.tenant_id = my_tenant_id()
    )
  );

-- mission_outcomes: enriched outcome summary (auto-computed)
CREATE TABLE IF NOT EXISTS mission_outcomes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id           uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  tenant_id            uuid REFERENCES tenants(id) ON DELETE CASCADE,
  completion_rate      float NOT NULL DEFAULT 0,
  dropoff_rate         float NOT NULL DEFAULT 0,
  reward_conversion    float NOT NULL DEFAULT 0,
  engagement_score     float NOT NULL DEFAULT 0,
  retention_score      float NOT NULL DEFAULT 0,
  outcome_score        float NOT NULL DEFAULT 0,
  mei_score            float NOT NULL DEFAULT 0,
  total_attempts       int NOT NULL DEFAULT 0,
  generated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mission_id)
);

ALTER TABLE mission_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_mission_outcomes" ON mission_outcomes
  USING (tenant_id = my_tenant_id());

-- Function: step-level drop-off analysis from events
CREATE OR REPLACE FUNCTION get_step_dropoffs(p_mission_id uuid)
RETURNS TABLE(step_id int, started bigint, completed bigint, dropoff bigint)
LANGUAGE sql STABLE AS $$
  SELECT
    e.step_id,
    COUNT(*) FILTER (WHERE e.event_type = 'step_started') AS started,
    COUNT(*) FILTER (WHERE e.event_type = 'step_completed') AS completed,
    COUNT(*) FILTER (WHERE e.event_type = 'step_started') -
      COUNT(*) FILTER (WHERE e.event_type = 'step_completed') AS dropoff
  FROM mission_events e
  WHERE e.mission_id = p_mission_id
    AND e.step_id IS NOT NULL
  GROUP BY e.step_id
  ORDER BY e.step_id;
$$;
