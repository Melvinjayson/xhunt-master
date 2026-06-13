-- Migration 013: Enterprise SSO Configuration
-- Stores SAML / OIDC provider settings per tenant.
-- Credentials (certificates, client secrets) are stored encrypted in the
-- config JSONB column. RLS ensures only tenant admins can read or write.

CREATE TABLE IF NOT EXISTS public.sso_configs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider_type   text        NOT NULL
                              CHECK (provider_type IN (
                                'saml', 'oidc',
                                'microsoft_entra', 'google_workspace', 'okta'
                              )),
  display_name    text        NOT NULL DEFAULT '',
  is_enabled      boolean     NOT NULL DEFAULT false,
  is_default      boolean     NOT NULL DEFAULT false,
  -- Provider-specific config:
  -- SAML:  { entity_id, sso_url, slo_url, certificate, attribute_mapping }
  -- OIDC:  { client_id, issuer_url, scopes[], attribute_mapping }
  -- Entra: { tenant_id, client_id, client_secret_hint }
  config          jsonb       NOT NULL DEFAULT '{}',
  -- Audit
  created_by      uuid        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  last_tested_at  timestamptz,
  last_login_at   timestamptz,
  login_count     integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider_type)
);

CREATE INDEX IF NOT EXISTS idx_sso_tenant   ON public.sso_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sso_enabled  ON public.sso_configs(is_enabled) WHERE is_enabled = true;

ALTER TABLE public.sso_configs ENABLE ROW LEVEL SECURITY;

-- Only tenant_admin and platform_admin can read/write SSO configs
CREATE POLICY "sso_admin_all"
  ON public.sso_configs FOR ALL
  USING (
    tenant_id = public.my_tenant_id()
    AND public.my_role() IN ('tenant_admin', 'platform_admin')
  );

CREATE TRIGGER sso_configs_updated_at
  BEFORE UPDATE ON public.sso_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SSO audit log: records every SSO-initiated login attempt
CREATE TABLE IF NOT EXISTS public.sso_audit_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sso_config_id   uuid        NOT NULL REFERENCES public.sso_configs(id) ON DELETE CASCADE,
  user_id         uuid        REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  event_type      text        NOT NULL
                              CHECK (event_type IN (
                                'login_success', 'login_failure', 'logout',
                                'config_test', 'session_refresh'
                              )),
  ip_address      text,
  user_agent      text,
  error_message   text,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sso_audit_tenant ON public.sso_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sso_audit_user   ON public.sso_audit_log(user_id, created_at DESC);

ALTER TABLE public.sso_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sso_audit_admin_read"
  ON public.sso_audit_log FOR SELECT
  USING (
    tenant_id = public.my_tenant_id()
    AND public.my_role() IN ('tenant_admin', 'platform_admin')
  );

CREATE POLICY "sso_audit_insert"
  ON public.sso_audit_log FOR INSERT
  WITH CHECK (tenant_id = public.my_tenant_id());
