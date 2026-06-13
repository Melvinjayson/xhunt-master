'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Radio, Eye, Flame, Share2, MessageCircle, Repeat2,
  X, Play, Sparkles, Clock, Plus, CheckCircle2,
  Trophy, MoreHorizontal, Bookmark, Zap,
  Image, Video, Music, Paperclip, Send, UserPlus, Users,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const T = {
  bg: '#050816', panel: '#07101F', card: '#0A1226', elev: '#0D1530',
  line: 'rgba(255,255,255,.07)', line2: 'rgba(255,255,255,.12)',
  txt: '#F0F4FF', muted: '#8B9CC0', dim: '#4A5578', faint: '#2A3550',
  green: '#22FFAA', red: '#FF5C7A', amber: '#FFB84D', live: '#ff3b30', ai: '#6D5DFD',
} as const;

/* ─── Types ─── */
interface LiveSession {
  id: string; title: string; status: 'scheduled' | 'live' | 'ended';
  current_step_index: number; total_steps: number; viewer_count: number;
  is_pro_only: boolean; started_at: string | null; scheduled_for: string | null;
  host_display_name: string; host_avatar_url: string | null; mission_title: string | null;
}

interface ExperiencePost {
  id: string; post_type: 'completion' | 'moment' | 'highlight';
  caption: string | null; reaction_count: number; reacted?: boolean;
  comment_count: number; share_count: number;
  metadata: Record<string, unknown>; created_at: string;
  user_display_name: string; user_avatar_url: string | null; mission_title: string | null;
}

interface Comment {
  id: string; content: string; created_at: string;
  user_id: string; display_name: string; avatar_url: string | null;
}

interface SuggestedPerson {
  id: string; display_name: string; avatar_url: string | null;
  followers_count: number; is_following: boolean;
}

/* ─── Helpers ─── */
function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}
function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
function handle(name: string): string {
  return '@' + name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
}

const TYPE_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completion: { label: 'Completed', color: T.green,  icon: <CheckCircle2 size={11} /> },
  highlight:  { label: 'Highlight', color: T.amber,  icon: <Trophy size={11} />       },
  moment:     { label: 'Moment',    color: T.ai,     icon: <Sparkles size={11} />     },
};

/* ─── Avatar ─── */
function Avatar({ name, url, size = 40, ring }: { name: string; url: string | null; size?: number; ring?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: url ? undefined : 'linear-gradient(135deg,rgba(34,255,170,.18),rgba(109,93,253,.18))',
      border: ring ? `2px solid ${ring}` : '1px solid rgba(255,255,255,.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: T.green, overflow: 'hidden',
      boxShadow: ring ? `0 0 12px ${ring}55` : 'none',
    }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(name)
      }
    </div>
  );
}

/* ─── Live Story Bubble ─── */
function StoryBubble({ session, onClick }: { session: LiveSession; onClick: () => void }) {
  const live = session.status === 'live';
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', padding: 2,
          background: live ? `conic-gradient(${T.live}, #ff6b5b, ${T.live})` : `conic-gradient(${T.amber}, #ffd180, ${T.amber})`,
          boxShadow: live ? `0 0 18px rgba(255,59,48,.45)` : 'none',
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `2px solid ${T.bg}`, overflow: 'hidden', background: T.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: T.green }}>
            {session.host_avatar_url
              ? <img src={session.host_avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials(session.host_display_name)
            }
          </div>
        </div>
        {live && (
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', background: T.live, color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 6, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>LIVE</div>
        )}
      </div>
      <span style={{ fontSize: 10, color: T.muted, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {session.host_display_name.split(' ')[0]}
      </span>
    </button>
  );
}

/* ─── Post Card (Twitter-style) ─── */
function PostCard({ post, onReact, onRepost }: {
  post: ExperiencePost;
  onReact: (id: string) => void;
  onRepost: (post: ExperiencePost) => void;
}) {
  const meta = TYPE_BADGE[post.post_type] ?? TYPE_BADGE.moment;
  const xp = typeof post.metadata?.xp === 'number' ? post.metadata.xp : null;
  const [reposted, setReposted]         = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]         = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [localCommentCount, setLocalCount] = useState(post.comment_count ?? 0);

  async function openComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      const res = await fetch(`/api/timeline/comment?post_id=${post.id}`);
      if (res.ok) {
        const d = await res.json() as { comments: Comment[] };
        setComments(d.comments ?? []);
      }
      setCommentsLoaded(true);
    }
  }

  async function submitComment() {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/timeline/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, content: commentText.trim() }),
      });
      if (res.ok) {
        const d = await res.json() as { comment: Comment };
        setComments(prev => [...prev, { ...d.comment, display_name: 'You', avatar_url: null }]);
        setLocalCount(c => c + 1);
        setCommentText('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: post.user_display_name, text: post.caption ?? '', url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div style={{ borderBottom: `1px solid ${T.line}` }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', gap: 12 }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          <Avatar name={post.user_display_name} url={post.user_avatar_url} size={40} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>{post.user_display_name}</span>
            <span style={{ fontSize: 13, color: T.dim }}>{handle(post.user_display_name)}</span>
            <span style={{ fontSize: 12, color: T.dim }}>·</span>
            <span style={{ fontSize: 12, color: T.dim }}>{timeAgo(post.created_at)}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: meta.color, background: `${meta.color}12`, border: `1px solid ${meta.color}20`, borderRadius: 6, padding: '2px 7px' }}>
              {meta.icon}<span style={{ marginLeft: 3 }}>{meta.label}</span>
            </div>
          </div>

          {/* Post text */}
          {post.caption && (
            <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.55, marginBottom: 10, wordBreak: 'break-word' }}>{post.caption}</p>
          )}

          {/* Mission chip */}
          {post.mission_title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 12px', borderRadius: 12, background: T.card, border: `1px solid ${T.line}` }}>
              <span style={{ fontSize: 13 }}>🎯</span>
              <span style={{ fontSize: 12, color: T.muted, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.mission_title}</span>
              {xp && <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, whiteSpace: 'nowrap', flexShrink: 0 }}>+{xp} XP</span>}
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 6 }}>
            {/* Flame */}
            <button onClick={() => onReact(post.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: post.reacted ? T.amber : T.dim, fontSize: 13, padding: '6px 10px 6px 0', borderRadius: 8, transition: 'color .15s' }}>
              <Flame size={16} style={{ fill: post.reacted ? T.amber : 'none', transition: 'fill .15s' }} />
              <span>{post.reaction_count}</span>
            </button>

            {/* Comments */}
            <button onClick={openComments} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: showComments ? T.green : T.dim, fontSize: 13, padding: '6px 10px', borderRadius: 8, transition: 'color .15s' }}>
              <MessageCircle size={15} style={{ fill: showComments ? `${T.green}22` : 'none' }} />
              {localCommentCount > 0 && <span>{localCommentCount}</span>}
            </button>

            {/* Repost */}
            <button onClick={() => { setReposted(r => !r); onRepost(post); }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: reposted ? T.green : T.dim, fontSize: 13, padding: '6px 10px', borderRadius: 8, transition: 'color .15s' }}>
              <Repeat2 size={15} />
            </button>

            {/* Share */}
            <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 13, padding: '6px 10px', borderRadius: 8 }}>
              <Share2 size={15} />
            </button>

            {/* Bookmark */}
            <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: T.dim, fontSize: 13, padding: '6px 8px', borderRadius: 8, marginLeft: 'auto' }}>
              <Bookmark size={15} />
            </button>

            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: '6px 4px' }}>
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Comment section ─── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 12px 68px', borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
              {/* Existing comments */}
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <Avatar name={c.display_name} url={c.avatar_url} size={28} />
                  <div style={{ flex: 1, background: T.elev, borderRadius: 12, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.txt }}>{c.display_name}</span>
                      <span style={{ fontSize: 10, color: T.faint }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: T.dim, lineHeight: 1.45 }}>{c.content}</p>
                  </div>
                </div>
              ))}

              {commentsLoaded && comments.length === 0 && (
                <p style={{ fontSize: 12, color: T.faint, marginBottom: 10 }}>Be the first to comment…</p>
              )}

              {/* Comment input */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: T.elev, border: `1px solid ${T.line2}`, borderRadius: 12, padding: '8px 12px' }}>
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitComment(); } }}
                    placeholder="Write a comment…"
                    maxLength={500}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: T.txt, fontSize: 13, fontFamily: 'inherit' }}
                  />
                </div>
                <button
                  onClick={submitComment}
                  disabled={!commentText.trim() || submitting}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: commentText.trim() ? 'pointer' : 'default',
                    background: commentText.trim() ? T.green : T.elev,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .15s', flexShrink: 0,
                  }}
                >
                  <Send size={15} style={{ color: commentText.trim() ? '#050816' : T.faint }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Live Post Card (large) ─── */
function LiveCard({ session, onJoin }: { session: LiveSession; onJoin: () => void }) {
  const live = session.status === 'live';
  const progress = session.total_steps > 0 ? ((session.current_step_index + 1) / session.total_steps) * 100 : 0;

  return (
    <div style={{ borderBottom: `1px solid ${T.line}`, padding: '14px 16px', display: 'flex', gap: 12 }}>
      <div style={{ flexShrink: 0 }}>
        <Avatar name={session.host_display_name} url={session.host_avatar_url} size={40} ring={live ? T.live : T.amber} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>{session.host_display_name}</span>
          <span style={{ fontSize: 12, color: T.dim }}>·</span>
          {live ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: T.live }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: T.live, textTransform: 'uppercase', letterSpacing: '.06em' }}>Live</span>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: T.amber, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> Scheduled</span>
          )}
          {session.is_pro_only && (
            <span style={{ fontSize: 10, fontWeight: 700, color: T.amber, background: 'rgba(255,184,77,.12)', border: '1px solid rgba(255,184,77,.2)', borderRadius: 6, padding: '1px 6px' }}>PRO</span>
          )}
          {live && <span style={{ fontSize: 12, color: T.dim, display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}><Eye size={12} />{session.viewer_count}</span>}
        </div>

        <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.5, marginBottom: 10, fontWeight: 600 }}>{session.title}</p>
        {session.mission_title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 10px', borderRadius: 10, background: T.card, border: `1px solid ${T.line}` }}>
            <span style={{ fontSize: 11 }}>🎯</span>
            <span style={{ fontSize: 12, color: T.muted }}>{session.mission_title}</span>
          </div>
        )}

        {live && session.total_steps > 1 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: T.muted }}>Step {session.current_step_index + 1} of {session.total_steps}</span>
              <span style={{ fontSize: 11, color: T.dim }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 3, borderRadius: 3, background: T.elev }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                style={{ height: '100%', borderRadius: 3, background: T.live }} />
            </div>
          </div>
        )}

        <button onClick={onJoin} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '9px 16px', borderRadius: 20, border: `1px solid ${live ? T.live + '50' : 'rgba(255,184,77,.3)'}`,
          background: live ? 'rgba(255,59,48,.1)' : 'rgba(255,184,77,.08)',
          color: live ? T.live : T.amber,
          fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {live ? <><Play size={13} fill="currentColor" /> Watch Live</> : <><Clock size={13} /> Notify Me</>}
        </button>
      </div>
    </div>
  );
}

/* ─── Go Live Modal ─── */
function GoLiveModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const router = useRouter();
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [proOnly, setProOnly]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleStart() {
    if (!title.trim()) { setError('Give your session a title.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/live/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim(), description: desc.trim() || undefined, is_pro_only: proOnly }) });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? data.error ?? 'Could not start session.'); return; }
      onCreated(data.id);
      router.push(`/live/${data.id}?host=true`);
    } finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="liquid-glass"
        style={{ width: '100%', maxWidth: 500, background: T.panel, borderRadius: '24px 24px 0 0', border: `1px solid ${T.line2}`, padding: '24px 20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              style={{ width: 10, height: 10, borderRadius: '50%', background: T.live }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.txt, margin: 0 }}>Go Live</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim, padding: 4 }}><X size={20} /></button>
        </div>

        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>What are you doing live? *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. FitLife Day 21 — final workout" maxLength={80}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: T.elev, border: `1px solid ${T.line2}`, color: T.txt, fontSize: 15, outline: 'none', marginBottom: 14, boxSizing: 'border-box', fontFamily: 'inherit' }} />

        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Description (optional)</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description for viewers…" rows={3} maxLength={200}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: T.elev, border: `1px solid ${T.line2}`, color: T.txt, fontSize: 14, outline: 'none', marginBottom: 14, resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />

        <div onClick={() => setProOnly(!proOnly)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: T.elev, border: `1px solid ${T.line2}`, cursor: 'pointer', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.txt }}>Pro-only audience</div>
            <div style={{ fontSize: 12, color: T.muted }}>Only Pro subscribers can watch</div>
          </div>
          <div style={{ width: 44, height: 26, borderRadius: 13, background: proOnly ? T.amber : T.elev, border: `1px solid ${proOnly ? T.amber : T.line2}`, display: 'flex', alignItems: 'center', padding: 3, transition: 'background .2s' }}>
            <motion.div animate={{ x: proOnly ? 18 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: T.red, marginBottom: 12 }}>{error}</p>}

        <button onClick={handleStart} disabled={loading || !title.trim()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: (title.trim() && !loading) ? T.live : T.elev, color: (title.trim() && !loading) ? '#fff' : T.dim, fontWeight: 700, fontSize: 15, cursor: (title.trim() && !loading) ? 'pointer' : 'not-allowed', transition: 'background .2s', fontFamily: 'inherit' }}>
          <Radio size={16} />{loading ? 'Starting…' : 'Start Live Session'}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Compose Sheet ─── */
function ComposeSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [caption, setCaption]       = useState('');
  const [postType, setPostType]     = useState<'moment' | 'highlight' | 'completion'>('moment');
  const [loading, setLoading]       = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState('');
  const textRef  = useRef<HTMLTextAreaElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => textRef.current?.focus(), 100); }, []);

  const MAX_SIZE_MB = 50;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') {
    const files = Array.from(e.target.files ?? []);
    const tooBig = files.filter(f => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (tooBig.length) { setMediaError(`Max file size is ${MAX_SIZE_MB} MB`); return; }
    setMediaError('');
    setMediaFiles(prev => [...prev, ...files].slice(0, 4));
    e.target.value = '';
  }

  function removeMedia(index: number) {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }

  function mediaTypeAccept(type: string): string {
    if (type === 'image') return 'image/*';
    if (type === 'video') return 'video/*';
    if (type === 'audio') return 'audio/*';
    return '*/*';
  }

  async function handleShare() {
    if (!caption.trim()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('post_type', postType);
      formData.append('caption', caption.trim());
      mediaFiles.forEach(f => formData.append('media', f));

      await fetch('/api/timeline/post', {
        method: 'POST',
        body: mediaFiles.length > 0 ? formData : undefined,
        headers: mediaFiles.length > 0 ? undefined : { 'Content-Type': 'application/json' },
        ...(mediaFiles.length === 0 ? { body: JSON.stringify({ post_type: postType, caption: caption.trim() }) } : {}),
      });
      onCreated(); onClose();
    } finally { setLoading(false); }
  }

  const TYPES: { key: typeof postType; label: string; emoji: string }[] = [
    { key: 'moment',     label: 'Moment',    emoji: '✨' },
    { key: 'highlight',  label: 'Highlight', emoji: '🏆' },
    { key: 'completion', label: 'Completed', emoji: '✅' },
  ];

  const MEDIA_BTNS = [
    { type: 'image', icon: <Image size={17} />, label: 'Photo', accept: 'image/*' },
    { type: 'video', icon: <Video size={17} />, label: 'Video', accept: 'video/*' },
    { type: 'audio', icon: <Music size={17} />, label: 'Audio', accept: 'audio/*' },
    { type: 'file',  icon: <Paperclip size={17} />, label: 'File',  accept: '*/*'    },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="liquid-glass"
        style={{ width: '100%', maxWidth: 500, background: T.panel, borderRadius: '24px 24px 0 0', border: `1px solid ${T.line2}`, padding: '20px 16px 40px', maxHeight: '90dvh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.dim }}><X size={20} /></button>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.txt, margin: 0, flex: 1 }}>Share to Timeline</h2>
          <button onClick={handleShare} disabled={loading || !caption.trim()}
            style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: (caption.trim() && !loading) ? T.green : T.elev, color: (caption.trim() && !loading) ? '#050816' : T.dim, fontWeight: 700, fontSize: 13, cursor: (caption.trim() && !loading) ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background .2s' }}>
            {loading ? '…' : 'Post'}
          </button>
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setPostType(t.key)}
              style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${postType === t.key ? T.green + '50' : T.line}`, background: postType === t.key ? 'rgba(34,255,170,.08)' : 'transparent', color: postType === t.key ? T.green : T.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Text area */}
        <textarea ref={textRef} value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="What's happening on your mission? Share it with the community…"
          rows={4} maxLength={280}
          style={{ width: '100%', padding: '12px 0', background: 'none', border: 'none', color: T.txt, fontSize: 16, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.55 }} />

        {/* Media previews */}
        {mediaFiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {mediaFiles.map((f, i) => {
              const isImage = f.type.startsWith('image/');
              const url     = isImage ? URL.createObjectURL(f) : null;
              return (
                <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', background: T.elev, border: `1px solid ${T.line}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {url
                    ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Paperclip size={22} style={{ color: T.dim }} />
                  }
                  <button onClick={() => removeMedia(i)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={10} style={{ color: '#fff' }} />
                  </button>
                  <div style={{ position: 'absolute', bottom: 3, left: 4, fontSize: 9, color: 'rgba(255,255,255,.7)', fontWeight: 600, maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name.split('.').pop()?.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mediaError && <p style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>{mediaError}</p>}

        {/* Bottom toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
          {MEDIA_BTNS.map(({ type, icon, label, accept }) => (
            <button key={type} onClick={() => { fileRef.current?.setAttribute('accept', accept); fileRef.current?.click(); }}
              disabled={mediaFiles.length >= 4}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 10, background: 'none', border: `1px solid ${T.line}`, color: T.dim, fontSize: 12, cursor: mediaFiles.length >= 4 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: mediaFiles.length >= 4 ? 0.4 : 1 }}>
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
          <input
            ref={fileRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={e => {
              const accept = fileRef.current?.getAttribute('accept') ?? '*/*';
              const type = accept.startsWith('image') ? 'image' : accept.startsWith('video') ? 'video' : accept.startsWith('audio') ? 'audio' : 'file';
              handleFileSelect(e, type as 'image' | 'video' | 'audio');
            }}
          />
          <span style={{ fontSize: 12, color: caption.length > 240 ? T.red : T.dim, marginLeft: 'auto' }}>{caption.length}/280</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Tab bar ─── */
const TABS = ['For You', 'Following', 'Live', 'Missions'] as const;
type Tab = typeof TABS[number];

/* ─── Who to Follow widget ─── */
function WhoToFollow({ onFollow }: { onFollow?: () => void }) {
  const [people, setPeople] = useState<SuggestedPerson[]>([]);

  useEffect(() => {
    fetch('/api/social/people?limit=3')
      .then(r => r.ok ? r.json() : null)
      .then((d: { people: SuggestedPerson[] } | null) => {
        if (d?.people) setPeople(d.people.filter(p => !p.is_following).slice(0, 3));
      })
      .catch(() => {});
  }, []);

  if (people.length === 0) return null;

  async function follow(id: string) {
    await fetch('/api/social/follow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ following_id: id }) });
    setPeople(prev => prev.filter(p => p.id !== id));
    onFollow?.();
  }

  return (
    <div className="liquid-glass" style={{ margin: '12px 16px', background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={14} style={{ color: T.green }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>Who to Follow</span>
      </div>
      {people.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: `1px solid ${T.line}` }}>
          <Avatar name={p.display_name} url={p.avatar_url} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.faint }}>{p.followers_count} followers</p>
          </div>
          <button onClick={() => follow(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 16, border: `1px solid ${T.green}40`, background: `${T.green}10`, color: T.green, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <UserPlus size={12} /> Follow
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default function TimelinePage() {
  const [tab, setTab]               = useState<Tab>('For You');
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [posts, setPosts]           = useState<ExperiencePost[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showGoLive, setGoLive]     = useState(false);
  const [showCompose, setCompose]   = useState(false);

  const loadFeed = useCallback(async (t: Tab = tab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (t === 'Following') params.set('tab', 'following');
      else if (t === 'Missions') params.set('filter', 'missions');
      else if (t === 'Live')    params.set('filter', 'live');

      const res = await fetch(`/api/timeline?${params}`);
      if (res.ok) {
        const d = await res.json();
        setLiveSessions(d.liveSessions ?? []);
        setPosts(d.posts ?? []);
      }
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { loadFeed(tab); }, [tab]);  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReact(postId: string) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reaction_count: p.reaction_count + 1, reacted: true } : p));
    await fetch('/api/timeline/react', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId }) });
  }

  function handleRepost(post: ExperiencePost) {
    setPosts(prev => [
      { ...post, id: `repost-${post.id}`, caption: `↻ Reposted · ${post.caption ?? ''}`, created_at: new Date().toISOString(), comment_count: 0, share_count: 0 },
      ...prev,
    ]);
  }

  const liveFeed  = liveSessions.filter(s => s.status === 'live');
  const filteredPosts = tab === 'Missions'
    ? posts.filter(p => p.post_type === 'completion' || p.post_type === 'highlight')
    : posts;
  const showLiveRow = (tab === 'For You' || tab === 'Live') && liveSessions.length > 0;

  return (
    <main className="consumer-app" style={{ background: T.bg, minHeight: '100dvh', paddingBottom: '5.5rem' }}>

      {/* ─── Sticky header ─── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(5,8,22,.94)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.line}` }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: T.txt, margin: 0 }}>Timeline</h1>
          <button onClick={() => setGoLive(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: `1px solid rgba(255,59,48,.3)`, background: 'rgba(255,59,48,.1)', color: T.live, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: T.live }} />
            Go Live
          </button>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? T.txt : T.dim, borderBottom: `2px solid ${tab === t ? T.green : 'transparent'}`, transition: 'all .15s', fontFamily: 'inherit',
            }}>
              {t}{t === 'Live' && liveFeed.length > 0 && <span style={{ marginLeft: 5, fontSize: 10, background: T.live, color: '#fff', borderRadius: 8, padding: '1px 5px', fontWeight: 700 }}>{liveFeed.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* ─── Live stories row ─── */}
        {showLiveRow && (
          <div style={{ padding: '12px 16px 8px', borderBottom: `1px solid ${T.line}`, overflowX: 'auto', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
            {liveSessions.map(s => (
              <StoryBubble key={s.id} session={s} onClick={() => { window.location.href = `/live/${s.id}`; }} />
            ))}
          </div>
        )}

        {/* ─── Who to Follow (For You tab only) ─── */}
        {tab === 'For You' && <WhoToFollow onFollow={() => loadFeed(tab)} />}

        {/* ─── Feed ─── */}
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: `1px solid ${T.line}`, display: 'flex', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.panel, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: '40%', background: T.panel, borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 14, width: '85%', background: T.panel, borderRadius: 6, marginBottom: 6 }} />
                <div style={{ height: 14, width: '60%', background: T.panel, borderRadius: 6 }} />
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {/* Live session cards in feed */}
            {(tab === 'For You' || tab === 'Live') && liveSessions.map(s => (
              <motion.div key={`live-${s.id}`} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <LiveCard session={s} onJoin={() => { window.location.href = `/live/${s.id}`; }} />
              </motion.div>
            ))}

            {/* Posts */}
            {filteredPosts.map(p => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <PostCard post={p} onReact={handleReact} onRepost={handleRepost} />
              </motion.div>
            ))}

            {/* Empty state */}
            {!loading && filteredPosts.length === 0 && liveSessions.length === 0 && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>
                  {tab === 'Live' ? '📡' : tab === 'Missions' ? '🎯' : tab === 'Following' ? '👥' : '🌱'}
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 8 }}>
                  {tab === 'Live' ? 'No one live right now'
                    : tab === 'Missions' ? 'No mission posts yet'
                    : tab === 'Following' ? 'No posts from people you follow'
                    : 'Nothing posted yet'}
                </p>
                <p style={{ fontSize: 13, color: T.muted, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>
                  {tab === 'Following'
                    ? 'Follow people to see their missions and moments here.'
                    : 'Complete a mission and share it. Be the first post on the feed.'}
                </p>
                {tab === 'Following' ? (
                  <button onClick={() => setTab('For You')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', background: T.green, color: '#050816', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
                    <Users size={15} /> Discover People
                  </button>
                ) : (
                  <button onClick={() => setCompose(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', background: T.green, color: '#050816', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
                    <Sparkles size={15} /> Share a moment
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ─── Compose FAB ─── */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCompose(true)}
        className="md:hidden"
        style={{ position: 'fixed', bottom: '5.5rem', right: '1.25rem', zIndex: 50, width: 54, height: 54, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${T.green},${T.ai})`, boxShadow: `0 4px 20px rgba(34,255,170,.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={22} color="#050816" strokeWidth={2.5} />
      </motion.button>

      {/* Desktop compose */}
      <motion.button whileTap={{ scale: 0.93 }} onClick={() => setCompose(true)}
        className="hidden md:flex"
        style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 50, padding: '12px 22px', borderRadius: 28, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${T.green},${T.ai})`, boxShadow: `0 4px 24px rgba(34,255,170,.3)`, alignItems: 'center', gap: 8, color: '#050816', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
        <Zap size={16} /> Post to Timeline
      </motion.button>

      <AnimatePresence>
        {showGoLive  && <GoLiveModal   key="go-live"  onClose={() => setGoLive(false)}  onCreated={() => loadFeed()} />}
        {showCompose && <ComposeSheet  key="compose"  onClose={() => setCompose(false)} onCreated={loadFeed} />}
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}
