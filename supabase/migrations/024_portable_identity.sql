-- 024_portable_identity.sql
-- Portable Identity: verifiable credentials, skill verifications, and identity export infrastructure

CREATE TYPE credential_type AS ENUM (
  'skill',
  'outcome',
  'contribution',
  'community_role',
  'cross_platform',
  'educational',
  'professional'
);

CREATE TYPE proficiency_level AS ENUM ('1', '2', '3', '4', '5');

-- Verifiable credentials: signed claims about the user
CREATE TABLE IF NOT EXISTS public.identity_credentials (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  credential_type   credential_type NOT NULL,
  title             text NOT NULL,
  description       text,
  issuer            text NOT NULL,            -- 'xhunt', 'peer', 'tenant:<id>', 'external:<platform>'
  issuer_user_id    uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  payload           jsonb NOT NULL DEFAULT '{}',  -- credential body (skill, level, evidence, etc.)
  verification_hash text UNIQUE NOT NULL,      -- SHA-256 of (user_id||type||payload||issued_at)
  signature         text,                     -- future: cryptographic signature
  issued_at         timestamptz NOT NULL DEFAULT now(),
  valid_until       timestamptz,
  is_revoked        boolean NOT NULL DEFAULT false,
  revocation_reason text,
  -- Portability: can be exported as W3C Verifiable Credential JSON-LD
  vc_context        jsonb DEFAULT '["https://www.w3.org/2018/credentials/v1"]',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Skill verifications: verified skill claims backed by evidence
CREATE TABLE IF NOT EXISTS public.skill_verifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  skill_name        text NOT NULL,
  domain            text,
  proficiency       proficiency_level NOT NULL DEFAULT '1',
  verified_by       text NOT NULL,            -- 'self', 'peer', 'mission_completion', 'ai_inference', 'external'
  verifier_user_id  uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  evidence_count    integer NOT NULL DEFAULT 0,
  evidence_refs     jsonb NOT NULL DEFAULT '[]',  -- [{type, url, description}]
  mission_ids       uuid[] DEFAULT '{}',          -- missions that validated this skill
  contribution_ids  uuid[] DEFAULT '{}',          -- contributions that demonstrated this skill
  is_active         boolean NOT NULL DEFAULT true,
  verified_at       timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz,
  UNIQUE (user_id, skill_name, verified_by)
);

-- Identity export log: audit trail of portable identity exports
CREATE TABLE IF NOT EXISTS public.identity_exports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  export_format   text NOT NULL CHECK (export_format IN ('json', 'did_document', 'verifiable_presentation', 'pdf_report')),
  included_scopes jsonb NOT NULL DEFAULT '[]',  -- which parts were included
  payload_hash    text,                          -- hash of exported payload
  destination     text,                          -- where it was sent (null = download)
  requested_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz
);

-- DID (Decentralized Identifier) anchors: maps user to a DID
CREATE TABLE IF NOT EXISTS public.identity_dids (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  did        text NOT NULL UNIQUE,            -- e.g. did:xhunt:base58encodedPublicKey
  did_doc    jsonb NOT NULL DEFAULT '{}',
  method     text NOT NULL DEFAULT 'xhunt',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_identity_credentials_user    ON public.identity_credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_identity_credentials_type    ON public.identity_credentials (credential_type);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_user     ON public.skill_verifications (user_id);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_skill    ON public.skill_verifications (skill_name);
CREATE INDEX IF NOT EXISTS idx_identity_exports_user        ON public.identity_exports (user_id);

-- Function: generate a W3C-compatible Verifiable Presentation for a user
CREATE OR REPLACE FUNCTION get_verifiable_presentation(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_did text;
  v_credentials jsonb;
  v_result jsonb;
BEGIN
  SELECT did INTO v_did FROM public.identity_dids WHERE user_id = p_user_id;
  v_did := COALESCE(v_did, 'did:xhunt:' || p_user_id::text);

  SELECT jsonb_agg(jsonb_build_object(
    '@context', vc_context,
    'type', ARRAY['VerifiableCredential'],
    'id', 'urn:xhunt:credential:' || id::text,
    'issuer', issuer,
    'issuanceDate', issued_at,
    'expirationDate', valid_until,
    'credentialSubject', payload || jsonb_build_object('id', v_did)
  ))
  INTO v_credentials
  FROM public.identity_credentials
  WHERE user_id = p_user_id AND is_revoked = false
    AND (valid_until IS NULL OR valid_until > now());

  v_result := jsonb_build_object(
    '@context', ARRAY['https://www.w3.org/2018/credentials/v1'],
    'type', ARRAY['VerifiablePresentation'],
    'holder', v_did,
    'verifiableCredential', COALESCE(v_credentials, '[]'::jsonb),
    'proof', jsonb_build_object('type', 'xhunt_internal_v1', 'created', now())
  );

  RETURN v_result;
END;
$$;

-- RLS
ALTER TABLE public.identity_credentials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_verifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_exports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_dids         ENABLE ROW LEVEL SECURITY;

-- Credentials are public (verifiable by anyone), but writable only by owner or service role
CREATE POLICY "credentials_select_all"   ON public.identity_credentials FOR SELECT USING (true);
CREATE POLICY "skill_verif_select_all"   ON public.skill_verifications   FOR SELECT USING (true);
CREATE POLICY "identity_dids_select_all" ON public.identity_dids         FOR SELECT USING (true);

CREATE POLICY "identity_exports_own"     ON public.identity_exports FOR SELECT
  USING (auth.uid()::text = (SELECT clerk_user_id FROM public.user_profiles WHERE id = user_id));
