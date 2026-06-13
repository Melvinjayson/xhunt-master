-- Migration 010: Outcome Validation tables
-- Supports the Outcomes Intelligence & Validation Module

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Outcome validations
CREATE TABLE IF NOT EXISTS outcome_validations (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mission_id         uuid        REFERENCES missions(id) ON DELETE SET NULL,
  user_id            uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  outcome_event_id   uuid        REFERENCES outcome_events(id) ON DELETE SET NULL,
  status             text        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','under_review','approved','rejected','requires_evidence')),
  validation_type    text        NOT NULL DEFAULT 'self_reported'
                                 CHECK (validation_type IN ('self_reported','peer_verified','automated','manager_verified')),
  evidence           jsonb       NOT NULL DEFAULT '[]',
  reviewer_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes     text,
  confidence_score   numeric(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  submitted_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcome_validations_tenant  ON outcome_validations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outcome_validations_mission ON outcome_validations(mission_id);
CREATE INDEX IF NOT EXISTS idx_outcome_validations_user    ON outcome_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_outcome_validations_status  ON outcome_validations(status);

ALTER TABLE outcome_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_own_validations"
  ON outcome_validations FOR ALL
  USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE TRIGGER outcome_validations_updated_at
  BEFORE UPDATE ON outcome_validations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
