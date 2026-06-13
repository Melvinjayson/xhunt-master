'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trophy, Flame, Zap, Star, TrendingUp,
  Award, Gift, Clock, CheckCircle2, ChevronRight,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { loadState } from '@/lib/store';
import type { CompletedHunt } from '@/lib/types';

function parseReward(r: string): number {
  return parseFloat(r.replace(/[^0-9.]/g, '')) || 0;
}

const T = {
  bg: '#050816', panel: '#07101F', card: '#0A1226', elev: '#0D1530',
  line: 'rgba(255,255,255,.07)', line2: 'rgba(255,255,255,.12)',
  txt: '#F0F4FF', muted: '#8B9CC0', dim: '#4A5578',
  green: '#22FFAA', amber: '#FFB84D', ai: '#6D5DFD', red: '#FF5C7A',
} as const;

function getInitials(name: string | null | undefined): string {
  if (!name) return 'XP';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

const TIERS = [
  { name: 'Explorer',        min: 0,    max: 2.9,  color: '#54625f', next: 'Verified Hunter' },
  { name: 'Verified Hunter', min: 3.0,  max: 5.9,  color: T.green,   next: 'Pro Hunter'      },
  { name: 'Pro Hunter',      min: 6.0,  max: 8.4,  color: T.ai,      next: 'Elite Hunter'    },
  { name: 'Elite Hunter',    min: 8.5,  max: 10.0, color: T.amber,   next: null              },
];

type BadgeFn = (h: CompletedHunt[], streak: number) => boolean;

const BADGE_CATALOG: { id: string; emoji: string; label: string; desc: string; earned: BadgeFn }[] = [
  { id: 'first_mission',  emoji: '🚀', label: 'First Launch',    desc: 'Complete your first mission',        earned: (h) => h.length >= 1 },
  { id: 'streak_3',       emoji: '🔥', label: '3-Day Streak',    desc: 'Complete missions 3 days in a row',  earned: (_, s) => s >= 3 },
  { id: 'streak_7',       emoji: '⚡', label: 'Week Warrior',    desc: 'Maintain a 7-day streak',            earned: (_, s) => s >= 7 },
  { id: 'missions_5',     emoji: '🎯', label: 'Sharp Shooter',   desc: 'Complete 5 missions',                earned: (h) => h.length >= 5 },
  { id: 'missions_10',    emoji: '💎', label: 'Diamond Hunter',  desc: 'Complete 10 missions',               earned: (h) => h.length >= 10 },
  { id: 'missions_25',    emoji: '👑', label: 'Crown Hunter',    desc: 'Complete 25 missions',               earned: (h) => h.length >= 25 },
  { id: 'earner_100',     emoji: '💰', label: 'First $100',      desc: 'Earn $100+ across missions',         earned: (h) => h.reduce((sum, c) => sum + parseReward(c.reward), 0) >= 100 },
  { id: 'earner_500',     emoji: '🏦', label: 'High Earner',     desc: 'Earn $500+ across missions',         earned: (h) => h.reduce((sum, c) => sum + parseReward(c.reward), 0) >= 500 },
  { id: 'multi_mission',  emoji: '🌍', label: 'Multi-Hunter',    desc: 'Complete 3 or more different missions', earned: (h) => h.length >= 3 },
];

interface SubStatus {
  tier: string; isTrialActive: boolean; trialDaysLeft: number;
  canAccessPremiumMissions: boolean;
}

export default function RewardsPage() {
  const router = useRouter();
  const [completedHunts, setCompleted] = useState<CompletedHunt[]>([]);
  const [streak, setStreak]           = useState(0);
  const [displayName, setName]        = useState<string | null>(null);
  const [hunterScore, setScore]       = useState(0);
  const [subStatus, setSub]           = useState<SubStatus | null>(null);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    const state = loadState();
    setCompleted(state.completedHunts ?? []);
    setStreak(state.streak ?? 0);
    setName((state.user as { name?: string })?.name ?? null);
    setScore((state.user as { hunterScore?: number })?.hunterScore ?? 0);
    setMounted(true);
    void fetch('/api/subscription/status')
      .then(r => r.json())
      .then((d: SubStatus) => setSub(d))
      .catch(() => setSub({ tier: 'free', isTrialActive: false, trialDaysLeft: 0, canAccessPremiumMissions: false }));
  }, []);

  if (!mounted) return null;

  const totalEarned   = completedHunts.reduce((s, c) => s + parseReward(c.reward), 0);
  const thisMonth     = completedHunts.filter(c => {
    const d = new Date(c.completedAt ?? 0);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, c) => s + parseReward(c.reward), 0);

  const currentTier   = TIERS.find(t => hunterScore >= t.min && hunterScore <= t.max) ?? TIERS[0];
  const nextTier      = currentTier.next ? TIERS.find(t => t.name === currentTier.next) : null;
  const scoreProgress = nextTier ? ((hunterScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  const earnedBadges  = BADGE_CATALOG.filter(b => b.earned(completedHunts, streak));
  const lockedBadges  = BADGE_CATALOG.filter(b => !b.earned(completedHunts, streak));

  const totalXP = completedHunts.length * 100;

  return (
    <main className="consumer-app" style={{ background: T.bg, minHeight: '100dvh', paddingBottom: '5.5rem', color: T.txt }}>

      {/* ─── Header ─── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(5,8,22,.94)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${T.line}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: T.card, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={16} style={{ color: T.txt }} />
        </button>
        <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Rewards & Earnings</h1>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        {/* ─── Profile card ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ margin: '16px 0', padding: '18px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(34,255,170,.06) 0%, rgba(109,93,253,.06) 100%)', border: `1px solid rgba(34,255,170,.15)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#22FFAA,#6D5DFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#050816', flexShrink: 0 }}>
              {getInitials(displayName)}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{displayName ?? 'Hunter'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: currentTier.color, background: `${currentTier.color}15`, border: `1px solid ${currentTier.color}30`, borderRadius: 6, padding: '2px 8px' }}>{currentTier.name}</span>
                {subStatus?.isTrialActive && (
                  <span style={{ fontSize: 11, color: T.ai, background: 'rgba(109,93,253,.1)', border: '1px solid rgba(109,93,253,.2)', borderRadius: 6, padding: '2px 8px' }}>
                    Trial · {subStatus.trialDaysLeft}d left
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 10, color: T.dim }}>Hunter Score</p>
              <p style={{ margin: '2px 0 0', fontSize: 28, fontWeight: 900, color: currentTier.color, lineHeight: 1 }}>{hunterScore.toFixed(1)}</p>
            </div>
          </div>
        </motion.div>

        {/* ─── Earnings summary ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { icon: <Trophy size={16} />, value: `$${totalEarned.toFixed(0)}`, label: 'Total Earned', color: T.green },
            { icon: <TrendingUp size={16} />, value: `$${thisMonth.toFixed(0)}`, label: 'This Month', color: T.amber },
            { icon: <Zap size={16} />, value: totalXP.toLocaleString(), label: 'Total XP', color: T.ai },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ padding: '14px 12px', borderRadius: 16, background: T.card, border: `1px solid ${T.line}`, textAlign: 'center' }}>
              <div style={{ color: s.color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: '-.025em', lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: '4px 0 0', fontSize: 10, color: T.dim }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ─── Stats row ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ padding: '14px 16px', borderRadius: 16, background: T.card, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,184,77,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={18} style={{ color: T.amber }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: T.amber, lineHeight: 1 }}>{streak} 🔥</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: T.dim }}>Day streak</p>
            </div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 16, background: T.card, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(34,255,170,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} style={{ color: T.green }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: T.green, lineHeight: 1 }}>{completedHunts.length}</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: T.dim }}>Completed</p>
            </div>
          </div>
        </div>

        {/* ─── Hunter Score progress ─── */}
        {nextTier && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ marginBottom: 20, padding: '16px', borderRadius: 18, background: T.panel, border: `1px solid ${T.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: T.dim, fontWeight: 600 }}>Next tier</p>
                <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: nextTier.color }}>{nextTier.name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 11, color: T.dim }}>Need score</p>
                <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: nextTier.color }}>{nextTier.min}+</p>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: T.elev, marginBottom: 6 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(scoreProgress, 100)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})` }} />
            </div>
            <p style={{ margin: 0, fontSize: 11, color: T.dim }}>
              {hunterScore.toFixed(1)} / {nextTier.min} — complete {nextTier.name === 'Verified Hunter' ? 'more missions' : 'higher-tier missions'} to advance
            </p>
          </motion.div>
        )}

        {/* ─── Badges earned ─── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Award size={16} style={{ color: T.green }} /> Badges
              <span style={{ fontSize: 12, color: T.dim, fontWeight: 500 }}>({earnedBadges.length}/{BADGE_CATALOG.length})</span>
            </h2>
          </div>

          {earnedBadges.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
              {earnedBadges.map((badge, i) => (
                <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  style={{ padding: '12px 8px', borderRadius: 14, background: T.card, border: '1px solid rgba(34,255,170,.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{badge.emoji}</div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.green, lineHeight: 1.2 }}>{badge.label}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 9, color: T.dim, lineHeight: 1.3 }}>{badge.desc}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', borderRadius: 16, background: T.card, border: `1px solid ${T.line}`, textAlign: 'center', marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Complete missions to earn badges</p>
            </div>
          )}

          {lockedBadges.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: T.dim, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Locked</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {lockedBadges.slice(0, 6).map(badge => (
                  <div key={badge.id} style={{ padding: '12px 8px', borderRadius: 14, background: T.panel, border: `1px solid ${T.line}`, textAlign: 'center', opacity: 0.5 }}>
                    <div style={{ fontSize: 22, marginBottom: 6, filter: 'grayscale(1)' }}>{badge.emoji}</div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: T.dim }}>{badge.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Recent payouts ─── */}
        {completedHunts.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Clock size={16} style={{ color: T.amber }} /> Recent Payouts
            </h2>
            <div style={{ borderRadius: 16, background: T.card, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
              {[...completedHunts].reverse().slice(0, 5).map((h, i) => (
                <div key={`${h.huntId}-${i}`} style={{ padding: '12px 14px', borderBottom: i < 4 ? `1px solid ${T.line}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,255,170,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 size={16} style={{ color: T.green }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(h as { title?: string }).title ?? `Mission ${i + 1}`}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: T.dim }}>{h.completedAt ? timeAgo(h.completedAt) : '—'}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {parseReward(h.reward) > 0 && (
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.green }}>{h.reward}</p>
                    )}
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: T.amber }}>+100 XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Unlock more CTA ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ marginBottom: 16, padding: '20px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(34,255,170,.06), rgba(109,93,253,.06))', border: '1px solid rgba(34,255,170,.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#22FFAA,#6D5DFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Gift size={22} style={{ color: '#050816' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: T.txt }}>Unlock higher-value missions</p>
            <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Complete more missions to raise your Hunter Score and access premium brand gigs.</p>
          </div>
          <button onClick={() => router.push('/missions')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.green, flexShrink: 0 }}>
            <ChevronRight size={20} />
          </button>
        </motion.div>

        {/* ─── Social enterprise note ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginBottom: 16, padding: '16px', borderRadius: 16, background: T.panel, border: `1px solid ${T.line}` }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: T.ai, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={12} /> Social Impact Missions
          </p>
          <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.55 }}>
            Some missions are run by non-profits and civic programs. Completing these earns XP and impact badges but may not include cash payouts. They count toward your Hunter Score.
          </p>
        </motion.div>

      </div>

      <BottomNav />
    </main>
  );
}
