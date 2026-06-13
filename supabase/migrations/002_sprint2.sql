-- ============================================================
-- Sprint 2: Audience, Rewards, Governance, Audit
-- ============================================================

-- Audience segments
CREATE TABLE IF NOT EXISTS audience_segments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  filters      jsonb NOT NULL DEFAULT '{}',
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_audience" ON audience_segments
  USING (tenant_id = my_tenant_id());

-- Mission ↔ Audience segment join
CREATE TABLE IF NOT EXISTS mission_audience (
  mission_id  uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  segment_id  uuid NOT NULL REFERENCES audience_segments(id) ON DELETE CASCADE,
  PRIMARY KEY (mission_id, segment_id)
);

ALTER TABLE mission_audience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_mission_audience" ON mission_audience
  USING (
    EXISTS (
      SELECT 1 FROM missions m
      WHERE m.id = mission_id AND m.tenant_id = my_tenant_id()
    )
  );

-- Reward configs
CREATE TABLE IF NOT EXISTS reward_configs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('points', 'badge', 'coupon', 'experience', 'benefit')),
  value       jsonb NOT NULL DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reward_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_rewards" ON reward_configs
  USING (tenant_id = my_tenant_id());

-- Audit log (append-only; no UPDATE/DELETE policies)
CREATE TABLE IF NOT EXISTS audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action         text NOT NULL,
  resource_type  text NOT NULL,
  resource_id    text,
  metadata       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_audit" ON audit_log
  FOR SELECT USING (tenant_id = my_tenant_id());

CREATE POLICY "tenant_insert_audit" ON audit_log
  FOR INSERT WITH CHECK (tenant_id = my_tenant_id());

-- Mission approvals
CREATE TABLE IF NOT EXISTS mission_approvals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id   uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mission_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_approvals" ON mission_approvals
  USING (tenant_id = my_tenant_id());

-- Add 'published' and 'paused' to mission status enum (extend existing check)
-- NOTE: In production Supabase you would use an ALTER TABLE or enum migration.
-- For the MVP we handle these values in the application layer via text column.
-- The existing missions.status column is type text — no migration needed.

-- Helper: auto-update updated_at on audience_segments
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audience_updated_at
  BEFORE UPDATE ON audience_segments
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_reward_updated_at
  BEFORE UPDATE ON reward_configs
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_approvals_updated_at
  BEFORE UPDATE ON mission_approvals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
