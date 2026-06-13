-- ── 017_e2e_encryption.sql ──────────────────────────────────────────────────
-- End-to-end encryption support for XChat
-- Stores public keys + per-message IVs; ciphertext lives in messages.content.

-- ── Public key per user ───────────────────────────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS public_key text;

-- ── Per-member session key (encrypted AES-256-GCM key, base64) ───────────────
-- The client can store/retrieve this to seed their IndexedDB if they switch devices.
-- NOTE: storing the key here is a server-assisted key-backup mechanism.
--       True E2E clients can ignore this column and rely solely on IndexedDB.
ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS session_key text;

-- ── Per-message IV ────────────────────────────────────────────────────────────
-- The content field stores base64(ciphertext) when is_encrypted = true.
-- The IV needed to decrypt it lives here.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_encrypted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS iv           text;

-- ── Onboarding rate limit tracking (server-side, per userId) ─────────────────
-- Augments the in-memory IP limiter with a persistent per-user counter.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboard_requests_today  integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboard_requests_reset_at timestamptz NOT NULL DEFAULT now();

-- Index for key lookups
CREATE INDEX IF NOT EXISTS user_profiles_public_key_idx
  ON public.user_profiles (id)
  WHERE public_key IS NOT NULL;
