-- Migration 011: Revenue Manager & Escrow Services

-- Escrow accounts
CREATE TABLE IF NOT EXISTS escrow_accounts (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mission_id               uuid        REFERENCES missions(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  amount_cents             bigint      NOT NULL DEFAULT 0,
  currency                 text        NOT NULL DEFAULT 'usd',
  status                   text        NOT NULL DEFAULT 'created'
                                       CHECK (status IN ('created','funded','locked','partially_released','fully_released','disputed','refunded')),
  release_condition        text        NOT NULL DEFAULT 'manual_approval'
                                       CHECK (release_condition IN ('mei_threshold','outcome_count','manual_approval','deadline_based','hybrid')),
  release_config           jsonb       NOT NULL DEFAULT '{}',
  funded_at                timestamptz,
  released_at              timestamptz,
  released_amount_cents    bigint      NOT NULL DEFAULT 0,
  dispute_reason           text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_accounts_tenant  ON escrow_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_mission ON escrow_accounts(mission_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_status  ON escrow_accounts(status);

ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_own_escrow"
  ON escrow_accounts FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE TRIGGER escrow_accounts_updated_at
  BEFORE UPDATE ON escrow_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Escrow transactions (audit trail)
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id           uuid        NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
  tenant_id           uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_type    text        NOT NULL
                                  CHECK (transaction_type IN ('fund','release','refund','dispute_hold')),
  amount_cents        bigint      NOT NULL,
  stripe_transfer_id  text,
  metadata            jsonb       NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_escrow ON escrow_transactions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_tenant ON escrow_transactions(tenant_id);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_own_escrow_tx"
  ON escrow_transactions FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Revenue records
CREATE TABLE IF NOT EXISTS revenue_records (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mission_id               uuid        REFERENCES missions(id) ON DELETE SET NULL,
  escrow_id                uuid        REFERENCES escrow_accounts(id) ON DELETE SET NULL,
  stripe_payment_intent_id text,
  category                 text        NOT NULL
                                       CHECK (category IN ('subscription','mission_fee','outcome_bonus','escrow_release','api_usage','professional_services')),
  amount_cents             bigint      NOT NULL,
  currency                 text        NOT NULL DEFAULT 'usd',
  description              text        NOT NULL DEFAULT '',
  period_start             timestamptz,
  period_end               timestamptz,
  recognized_at            timestamptz NOT NULL DEFAULT now(),
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_records_tenant     ON revenue_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_category   ON revenue_records(category);
CREATE INDEX IF NOT EXISTS idx_revenue_records_recognized ON revenue_records(recognized_at);

ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_own_revenue"
  ON revenue_records FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_invoice_id text,
  invoice_number    text        NOT NULL,
  status            text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','open','paid','void','uncollectible')),
  amount_cents      bigint      NOT NULL DEFAULT 0,
  currency          text        NOT NULL DEFAULT 'usd',
  line_items        jsonb       NOT NULL DEFAULT '[]',
  issued_at         timestamptz NOT NULL DEFAULT now(),
  due_at            timestamptz,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_own_invoices"
  ON invoices FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
