-- ── 016_messaging.sql ───────────────────────────────────────────────────────
-- XChat: WhatsApp-style communication layer
-- Conversations, members, messages, reactions, read receipts

-- ── Conversations ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text        NOT NULL CHECK (type IN ('direct', 'mission', 'team', 'organization', 'community')),
  name            text,
  description     text,
  avatar_url      text,
  mission_id      uuid        REFERENCES public.missions(id) ON DELETE SET NULL,
  tenant_id       uuid        REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_by      uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Conversation members ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role            text        NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin', 'owner')),
  last_read_at    timestamptz,
  is_muted        boolean     NOT NULL DEFAULT false,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

-- ── Messages ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  content         text,
  message_type    text        NOT NULL DEFAULT 'text'
                    CHECK (message_type IN ('text', 'image', 'file', 'voice', 'mission_share', 'system')),
  metadata        jsonb       NOT NULL DEFAULT '{}',
  reply_to_id     uuid        REFERENCES public.messages(id) ON DELETE SET NULL,
  is_deleted      boolean     NOT NULL DEFAULT false,
  edited_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Message reactions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid        NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  emoji      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

-- ── Read receipts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid        NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  read_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx
  ON public.conversations (last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx
  ON public.messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS conversation_members_user_id_idx
  ON public.conversation_members (user_id);

CREATE INDEX IF NOT EXISTS conversation_members_conversation_id_idx
  ON public.conversation_members (conversation_id);

-- ── Trigger: update last_message_at on conversations ─────────────────────────
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at      = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.update_conversation_last_message();

-- ── RPC: find direct conversation between two users ───────────────────────────
CREATE OR REPLACE FUNCTION public.find_direct_conversation(user_a uuid, user_b uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result_id uuid;
BEGIN
  SELECT c.id INTO result_id
  FROM public.conversations c
  JOIN public.conversation_members cm1
    ON cm1.conversation_id = c.id AND cm1.user_id = user_a
  JOIN public.conversation_members cm2
    ON cm2.conversation_id = c.id AND cm2.user_id = user_b
  WHERE c.type = 'direct'
  LIMIT 1;
  RETURN result_id;
END;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Conversations: only members can view
CREATE POLICY "conv_members_select"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = public.conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "conv_auth_insert"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "conv_admin_update"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = public.conversations.id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Conversation members
CREATE POLICY "conv_members_members_select"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = public.conversation_members.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "conv_members_insert"
  ON public.conversation_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conv_members_update_own"
  ON public.conversation_members FOR UPDATE
  USING (user_id = auth.uid());

-- Messages
CREATE POLICY "messages_members_select"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = public.messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_members_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = public.messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_sender_update"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Reactions
CREATE POLICY "reactions_members_select"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = public.message_reactions.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "reactions_members_insert"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = public.message_reactions.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "reactions_own_delete"
  ON public.message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- Read receipts
CREATE POLICY "receipts_members_select"
  ON public.message_read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = public.message_read_receipts.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "receipts_own_insert"
  ON public.message_read_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "receipts_own_update"
  ON public.message_read_receipts FOR UPDATE
  USING (user_id = auth.uid());
