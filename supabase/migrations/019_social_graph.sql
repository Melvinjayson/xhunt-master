-- ─── Migration 019: Social Graph ───────────────────────────────────────────
-- user_follows, post_comments, post_media, bio field on user_profiles

-- ─── Bio column on user_profiles ───────────────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS xp_balance integer DEFAULT 100;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS missions_completed integer DEFAULT 0;

-- ─── User follows ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id  uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS user_follows_follower_idx  ON user_follows (follower_id);
CREATE INDEX IF NOT EXISTS user_follows_following_idx ON user_follows (following_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_all"   ON user_follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_self"  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_self"  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ─── Post comments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid NOT NULL REFERENCES experience_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES user_profiles(id)   ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS post_comments_post_idx ON post_comments (post_id, created_at DESC);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_all"  ON post_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_self" ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_self" ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Post media attachments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_media (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id          uuid NOT NULL REFERENCES experience_posts(id) ON DELETE CASCADE,
  media_type       text NOT NULL CHECK (media_type IN ('image','video','audio','file')),
  storage_path     text NOT NULL,
  public_url       text,
  file_name        text,
  file_size        integer,
  duration_seconds integer,
  width            integer,
  height           integer,
  created_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS post_media_post_idx ON post_media (post_id);

ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_select_all" ON post_media FOR SELECT USING (true);
CREATE POLICY "media_insert_own" ON post_media FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM experience_posts WHERE id = post_id AND user_id = auth.uid())
  );

-- ─── Add comment_count + media columns to experience_posts ─────────────────
ALTER TABLE experience_posts ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;
ALTER TABLE experience_posts ADD COLUMN IF NOT EXISTS share_count   integer DEFAULT 0;
ALTER TABLE experience_posts ADD COLUMN IF NOT EXISTS is_following_only boolean DEFAULT false;

-- ─── Triggers to maintain denormalized counts ───────────────────────────────
CREATE OR REPLACE FUNCTION _inc_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE experience_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_insert ON post_comments;
CREATE TRIGGER trg_comment_insert
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION _inc_comment_count();

CREATE OR REPLACE FUNCTION _dec_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE experience_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_delete ON post_comments;
CREATE TRIGGER trg_comment_delete
  AFTER DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION _dec_comment_count();

-- Sync followers_count / following_count
CREATE OR REPLACE FUNCTION _sync_follow_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles SET followers_count  = followers_count  + 1 WHERE id = NEW.following_id;
    UPDATE user_profiles SET following_count  = following_count  + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles SET followers_count  = GREATEST(followers_count  - 1, 0) WHERE id = OLD.following_id;
    UPDATE user_profiles SET following_count  = GREATEST(following_count  - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follow_counts ON user_follows;
CREATE TRIGGER trg_follow_counts
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION _sync_follow_counts();
