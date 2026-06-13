-- Migration 008: Timeline, live sessions, experience sharing

-- ── Experience posts (user shares of completions / moments) ──────────────────
CREATE TABLE IF NOT EXISTS public.experience_posts (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid         NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  mission_id     uuid         REFERENCES public.missions(id) ON DELETE SET NULL,
  tenant_id      uuid         REFERENCES public.tenants(id) ON DELETE SET NULL,
  post_type      text         NOT NULL CHECK (post_type IN ('completion', 'moment', 'highlight')),
  caption        text,
  media_url      text,
  metadata       jsonb        NOT NULL DEFAULT '{}',
  reaction_count integer      NOT NULL DEFAULT 0,
  is_public      boolean      NOT NULL DEFAULT true,
  created_at     timestamptz  NOT NULL DEFAULT now()
);

-- ── Live sessions (hosted real-time missions) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id             uuid         NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  mission_id          uuid         REFERENCES public.missions(id) ON DELETE SET NULL,
  tenant_id           uuid         REFERENCES public.tenants(id) ON DELETE SET NULL,
  title               text         NOT NULL,
  description         text,
  status              text         NOT NULL DEFAULT 'scheduled'
                                   CHECK (status IN ('scheduled', 'live', 'ended')),
  current_step_index  integer      NOT NULL DEFAULT 0,
  total_steps         integer      NOT NULL DEFAULT 1,
  viewer_count        integer      NOT NULL DEFAULT 0,
  is_pro_only         boolean      NOT NULL DEFAULT false,
  started_at          timestamptz,
  ended_at            timestamptz,
  scheduled_for       timestamptz,
  created_at          timestamptz  NOT NULL DEFAULT now()
);

-- Required for Supabase Realtime UPDATE events to include new row values
ALTER TABLE public.live_sessions REPLICA IDENTITY FULL;

-- ── Reactions on posts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_reactions (
  post_id    uuid         NOT NULL REFERENCES public.experience_posts(id) ON DELETE CASCADE,
  user_id    uuid         NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  emoji      text         NOT NULL DEFAULT '🔥',
  created_at timestamptz  NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.experience_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions    ENABLE ROW LEVEL SECURITY;

-- experience_posts
CREATE POLICY "ep_public_read"   ON public.experience_posts FOR SELECT USING (is_public = true);
CREATE POLICY "ep_user_insert"   ON public.experience_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ep_user_delete"   ON public.experience_posts FOR DELETE USING (auth.uid() = user_id);

-- live_sessions
CREATE POLICY "ls_public_read"   ON public.live_sessions FOR SELECT USING (true);
CREATE POLICY "ls_host_insert"   ON public.live_sessions FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "ls_host_update"   ON public.live_sessions FOR UPDATE USING (auth.uid() = host_id);

-- post_reactions
CREATE POLICY "pr_public_read"   ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "pr_user_insert"   ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pr_user_delete"   ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ep_created    ON public.experience_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ep_user       ON public.experience_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_ep_mission    ON public.experience_posts (mission_id);
CREATE INDEX IF NOT EXISTS idx_ls_status     ON public.live_sessions (status);
CREATE INDEX IF NOT EXISTS idx_ls_host       ON public.live_sessions (host_id);
CREATE INDEX IF NOT EXISTS idx_ls_scheduled  ON public.live_sessions (scheduled_for NULLS LAST);
