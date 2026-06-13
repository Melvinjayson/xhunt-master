'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Compass, Zap, X, ArrowRight, ArrowUpRight,
  Flame, Star, CheckCircle2, Target, TrendingUp, Sparkles,
  Brain, Users, BarChart3, MessageSquare, ChevronRight,
  Play, Clock, DollarSign,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { MMSCard, StatCard } from '@/components/home/MMSCard';
import { MissionCard } from '@/components/home/MissionCard';
import { ActiveMissionCard } from '@/components/home/ActiveMissionCard';
import { AIInsightCard, type Recommendation } from '@/components/home/AIInsightCard';
import { ActivityFeed } from '@/components/home/ActivityFeed';
import { loadState, saveState, loadProfile } from '@/lib/store';
import { fetchSupabaseMissions } from '@/lib/supabase/events';
import { computeMatchScore, greeting } from '@/lib/missionHelpers';
import { loadAIConfig, DEFAULT_AI_CONFIG, type AIConfig } from '@/lib/aiConfig';
import type { Hunt, ImpactProfile } from '@/lib/types';

interface SubStatus { tier: string; isTrialActive: boolean; trialDaysLeft: number; hasUsedTrial: boolean; canUseAI: boolean; }

/* ── tokens via CSS vars for full light/dark awareness ── */
const v = (name: string) => `var(--t-${name})`;

const QUICK_LINKS = [
  { icon: Compass,       label: 'Explore',  href: '/explore',  color: 'var(--t-accent)' },
  { icon: Users,         label: 'Community',href: '/people',   color: 'var(--t-ai)'     },
  { icon: BarChart3,     label: 'Missions', href: '/missions', color: 'var(--t-warn)'   },
  { icon: MessageSquare, label: 'Messages', href: '/messages', color: 'var(--t-accent)' },
];

const ARCHETYPE_COLORS: Record<string, string> = {
  Explorer: '#22FFAA', Builder: '#6D5DFD', Innovator: '#a78bfa',
  Mentor: '#FFB84D', Creator: '#FF5C7A', Analyst: '#60A5FA', Activist: '#22FFAA',
};

function ImpactRing({ score, color }: { score: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width={72} height={72} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <motion.circle
          cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, fontWeight: 600, color: v('faint'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impact</span>
      </div>
    </div>
  );
}

function MomentumStrip({ streak, mms, tier, tierColor, impactScore, archetypeColor }: {
  streak: number; mms: number; tier: string; tierColor: string; impactScore: number; archetypeColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{
        margin: '20px 0 0',
        borderRadius: 20,
        background: 'var(--xglass-bg)',
        border: '1px solid var(--xglass-border)',
        backdropFilter: 'blur(20px)',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}>
      {/* Streak */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRight: '1px solid rgba(255,255,255,0.07)', paddingRight: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Flame size={14} strokeWidth={2} style={{ color: 'var(--t-warn)' }} />
          <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--t-warn)', letterSpacing: '-0.04em' }}>{streak || 0}</span>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Day Streak</span>
      </div>
      {/* Impact ring */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, padding: '0 12px' }}>
        <ImpactRing score={impactScore} color={archetypeColor} />
      </div>
      {/* MMS + tier */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <TrendingUp size={13} strokeWidth={2} style={{ color: tierColor }} />
          <span style={{ fontSize: 22, fontWeight: 900, color: tierColor, letterSpacing: '-0.04em' }}>{mms}</span>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: tierColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier}</span>
      </div>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, href, color }: { icon: React.ElementType; label: string; href: string; color: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <motion.div
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.04 }}
        className="liquid-glass"
        style={{ borderRadius: 16, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `${color}14`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} strokeWidth={1.8} style={{ color }} />
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t-dim)', letterSpacing: '0.01em' }}>{label}</span>
      </motion.div>
    </Link>
  );
}

function SectionHeader({ title, action, href }: { title: string; action?: string; href?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--t-txt)', letterSpacing: '-0.02em' }}>{title}</h2>
      {action && href && (
        <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--t-dim)', textDecoration: 'none' }}>
          {action} <ArrowUpRight size={12} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

function StreakCalendar({ streak }: { streak: number }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
      {days.map((d, i) => {
        const filled = i < streak;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: filled ? 'rgba(255,184,77,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${filled ? 'rgba(255,184,77,0.5)' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: filled ? '0 0 10px rgba(255,184,77,0.25)' : 'none',
              }}>
              {filled && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--t-warn)' }} />}
            </motion.div>
            <span style={{ fontSize: 9, fontWeight: 600, color: filled ? 'var(--t-warn)' : 'var(--t-faint)' }}>{d}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: 'var(--t-dim)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11.5, color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 8px ${color}50` }}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [hunts, setHunts]             = useState<Hunt[]>([]);
  const [completedIds, setIds]         = useState<string[]>([]);
  const [activeMissionSteps, setAMS]  = useState(0);
  const [streak, setStreak]            = useState(0);
  const [mounted, setMounted]          = useState(false);
  const [subStatus, setSub]            = useState<SubStatus | null>(null);
  const [nudgeDismissed, setNudge]     = useState(false);
  const [aiDismissed, setAIDismiss]    = useState(false);
  const [recs, setRecs]                = useState<Recommendation[]>([]);
  const [userName, setUserName]        = useState('Explorer');
  const [profile, setProfile]          = useState<ImpactProfile | null>(null);
  const [aiConfig, setAIConfig]        = useState<AIConfig>(DEFAULT_AI_CONFIG);

  useEffect(() => {
    const state = loadState();
    if (!state.user?.onboardingComplete) { router.replace('/get-started'); return; }
    const completed = state.completedHunts.map(h => h.huntId);
    setIds(completed);
    setStreak(state.streak);
    if ((state.user as { name?: string }).name) setUserName((state.user as { name?: string }).name!);
    setHunts(state.hunts);
    setProfile(loadProfile());
    setAIConfig(loadAIConfig());
    const topId = state.hunts.find(h => !completed.includes(h.id))?.id;
    if (topId && state.progress[topId]) setAMS(state.progress[topId].completedSteps?.length ?? 0);
    setMounted(true);
    void fetchSupabaseMissions().then(r => { if (r?.length) { setHunts(r); const s = loadState(); saveState({ ...s, hunts: r }); } });
    void fetch('/api/subscription/status').then(r => r.json()).then((d: SubStatus) => setSub(d)).catch(() => {});
    void fetch('/api/recommendations?limit=5').then(r => r.ok ? r.json() : null).then(d => { if (d?.recommendations?.length) setRecs(d.recommendations); }).catch(() => {});
  }, [router]);

  if (!mounted) return null;

  const active   = hunts.filter(h => !completedIds.includes(h.id));
  const done     = hunts.filter(h =>  completedIds.includes(h.id));
  const topHunt  = active[0] ?? null;

  const mms        = Math.min(1000, 50 + completedIds.length * 40 + streak * 15);
  const mmsDelta   = streak * 3 + completedIds.length * 2;
  const xpBal      = 100 + completedIds.length * 250 + streak * 15;
  const impactScore = Math.min(100, 20 + completedIds.length * 12 + streak * 3);
  const tier       = mms >= 700 ? 'Elite Hunter' : mms >= 400 ? 'Pro Hunter' : mms >= 150 ? 'Verified Hunter' : 'Explorer';
  const tierClr    = mms >= 700 ? '#FFB84D' : mms >= 400 ? '#6D5DFD' : mms >= 150 ? '#22FFAA' : '#4A5578';
  const aColor     = ARCHETYPE_COLORS[profile?.archetype ?? ''] ?? '#22FFAA';

  /* ── Sidebar rail (desktop) ── */
  const rightRail = (
    <div className="hidden md:flex md:flex-col md:gap-5" style={{ width: 280, flexShrink: 0, paddingTop: 8 }}>

      {/* Quick actions */}
      <div>
        <p style={{ margin: '0 0 12px', fontSize: 10.5, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Access</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {QUICK_LINKS.map(({ icon, label, href, color }) => (
            <QuickAction key={label} icon={icon} label={label} href={href} color={color} />
          ))}
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="liquid-glass" style={{ borderRadius: 20, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,184,77,0.12)', border: '1px solid rgba(255,184,77,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={15} strokeWidth={2} style={{ color: 'var(--t-warn)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--t-txt)' }}>Daily Streak</p>
                <p style={{ margin: 0, fontSize: 10.5, color: 'var(--t-faint)' }}>{streak} days in a row</p>
              </div>
            </div>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--t-warn)', letterSpacing: '-0.04em' }}>{streak}</span>
          </div>
          <StreakCalendar streak={Math.min(streak, 7)} />
        </motion.div>
      )}

      {/* Progress toward next tier */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="liquid-glass" style={{ borderRadius: 20, padding: '16px 18px' }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, color: 'var(--t-txt)' }}>Your Growth</p>
        <ProgressBar label="Profile Complete" pct={72} color="#22FFAA" />
        <ProgressBar label="Impact Score" pct={impactScore} color="#6D5DFD" />
        <ProgressBar label={`${tier} XP`} pct={Math.min(100, Math.round(xpBal / 50))} color="#FFB84D" />
      </motion.div>

      {/* Active count widget */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="liquid-glass" style={{ borderRadius: 20, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(34,255,170,0.10)', border: '1px solid rgba(34,255,170,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Target size={19} strokeWidth={1.8} style={{ color: '#22FFAA' }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--t-txt)', letterSpacing: '-0.04em' }}>{active.length}</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--t-dim)' }}>Active mission{active.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/missions" style={{ marginLeft: 'auto', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#22FFAA' }}>
          View all <ArrowRight size={11} strokeWidth={2.5} />
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="consumer-app" style={{ minHeight: '100vh', background: 'var(--t-bg)' }}>

      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: -100, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,255,170,0.06) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: 100, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,93,253,0.06) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Top bar ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(5,8,22,0.88)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '50px 24px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Mobile logo */}
          <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ position: 'relative', width: 34, height: 34 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--t-accent)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--t-accent)', letterSpacing: '-0.05em' }}>X</span>
              </div>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--t-txt)', letterSpacing: '-0.03em' }}>XHUNT</span>
          </div>
          {/* Desktop greeting */}
          <div className="hidden md:block">
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--t-txt)', letterSpacing: '-0.025em' }}>
              {greeting()}, {userName} 👋
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--t-dim)' }}>
              {active.length > 0 ? `${active.length} mission${active.length !== 1 ? 's' : ''} in progress` : done.length > 0 ? `${done.length} completed · Keep going` : 'Start your first mission'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search pill */}
            <Link href="/explore" style={{ textDecoration: 'none' }}>
              <div style={{
                height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', cursor: 'pointer',
              }}>
                <Compass size={13} strokeWidth={2} style={{ color: 'var(--t-faint)' }} />
                <span style={{ fontSize: 12, color: 'var(--t-faint)' }}>Explore missions…</span>
              </div>
            </Link>
            {/* Notification bell */}
            <button style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <Bell size={16} strokeWidth={1.8} style={{ color: 'var(--t-dim)' }} />
              <div style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: 'var(--t-accent)', animation: 'breathe 2.5s ease-in-out infinite' }} />
            </button>
            {/* Avatar */}
            <Link href="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: `linear-gradient(135deg, rgba(34,255,170,0.20), rgba(109,93,253,0.20))`,
                border: '1.5px solid rgba(34,255,170,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t-accent)' }}>{userName[0].toUpperCase()}</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Mobile greeting ── */}
        <div className="md:hidden" style={{ padding: '24px 24px 0' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--t-txt)', letterSpacing: '-0.03em' }}>
                {greeting()}, {userName}
              </h1>
              {profile?.archetype && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: aColor, background: `${aColor}14`, border: `1px solid ${aColor}28`, borderRadius: 999, padding: '2px 9px', flexShrink: 0 }}>
                  {profile.archetype}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--t-dim)', lineHeight: 1.5 }}>
              {active.length > 0 ? `${active.length} mission${active.length !== 1 ? 's' : ''} waiting · Let's make progress.` : done.length > 0 ? `${done.length} completed · Great work.` : 'Generate your first mission to start earning.'}
            </p>
          </motion.div>
        </div>

        {/* ── Freemium nudge ── */}
        <AnimatePresence>
          {subStatus && !subStatus.canUseAI && !subStatus.hasUsedTrial && !nudgeDismissed && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              style={{ margin: '16px 24px 0', borderRadius: 16, background: 'rgba(109,93,253,0.08)', border: '1px solid rgba(109,93,253,0.22)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(109,93,253,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={15} strokeWidth={2} style={{ color: '#6D5DFD' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--t-txt)' }}>Unlock AI Agents + Premium Missions</p>
                <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--t-faint)' }}>14-day free trial · No card required</p>
              </div>
              <button onClick={() => router.push('/upgrade')} style={{ fontSize: 12, fontWeight: 700, color: '#6D5DFD', background: 'rgba(109,93,253,0.12)', border: '1px solid rgba(109,93,253,0.22)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', flexShrink: 0 }}>
                Try free <ArrowRight size={11} strokeWidth={2.5} />
              </button>
              <button onClick={() => setNudge(true)} style={{ background: 'none', border: 0, cursor: 'pointer', padding: 4, color: 'var(--t-faint)' }}>
                <X size={13} strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main content with two-column desktop layout ── */}
        <div className="md:flex md:gap-7 md:items-start" style={{ padding: '0 24px 24px' }}>

          {/* ── Main column ── */}
          <div className="md:flex-1 md:min-w-0">

            {/* Momentum strip */}
            <MomentumStrip
              streak={streak}
              mms={mms}
              tier={tier}
              tierColor={tierClr}
              impactScore={impactScore}
              archetypeColor={aColor}
            />

            {/* Continue Journey */}
            {topHunt && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ paddingTop: 24 }}>
                <SectionHeader title="Continue Journey" action="All missions" href="/missions" />
                <ActiveMissionCard hunt={topHunt} stepsCompleted={activeMissionSteps} matchScore={computeMatchScore(topHunt, profile)} />
              </motion.div>
            )}

            {/* AI Recommendations */}
            {recs.length > 0 && !aiDismissed && (
              <div style={{ paddingTop: 24 }}>
                <AIInsightCard recs={recs} onDismiss={() => setAIDismiss(true)} config={aiConfig} onConfigSave={setAIConfig} />
              </div>
            )}

            {/* Missions section */}
            <div style={{ paddingTop: 24 }}>
              <SectionHeader
                title={recs.length > 0 ? 'More For You' : active.length > 0 ? 'Active Missions' : 'All Missions'}
                action="Explore all"
                href="/explore"
              />

              {hunts.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                  className="liquid-glass" style={{ borderRadius: 24, padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(34,255,170,0.08)', border: '1px solid rgba(34,255,170,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <Compass size={26} strokeWidth={1.5} style={{ color: 'var(--t-accent)' }} />
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: 'var(--t-txt)' }}>No missions yet</p>
                  <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--t-dim)', lineHeight: 1.6 }}>
                    Discover missions matched to your Impact DNA and start earning rewards.
                  </p>
                  <Link href="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 16, background: 'var(--t-accent)', color: '#050816', fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 0 28px rgba(34,255,170,0.35)' }}>
                    <Zap size={15} strokeWidth={2.5} /> Start My First Hunt
                  </Link>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(recs.length > 0 ? active : active.length > 0 ? active : done).slice(0, 4).map((hunt, i) => (
                    <MissionCard key={hunt.id} hunt={hunt} index={i} isCompleted={completedIds.includes(hunt.id)} matchScore={computeMatchScore(hunt, profile)} />
                  ))}
                  {active.length > 4 && (
                    <Link href="/explore" style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.12)', color: 'var(--t-dim)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        View {active.length - 4} more missions <ChevronRight size={14} strokeWidth={2} />
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {done.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="liquid-glass" style={{ marginTop: 24, borderRadius: 24, padding: '18px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--t-txt)' }}>Recent Activity</h2>
                  <Link href="/profile" style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                    View all <ArrowUpRight size={12} strokeWidth={2} />
                  </Link>
                </div>
                <ActivityFeed completedHunts={done} streak={streak} />
              </motion.div>
            )}

            {/* Mobile: Quick actions + streak */}
            <div className="md:hidden">
              <div style={{ paddingTop: 24 }}>
                <p style={{ margin: '0 0 12px', fontSize: 10.5, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Access</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {QUICK_LINKS.map(({ icon, label, href, color }) => (
                    <QuickAction key={label} icon={icon} label={label} href={href} color={color} />
                  ))}
                </div>
              </div>

              {streak > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="liquid-glass" style={{ marginTop: 16, borderRadius: 20, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,184,77,0.12)', border: '1px solid rgba(255,184,77,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flame size={15} strokeWidth={2} style={{ color: 'var(--t-warn)' }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--t-txt)' }}>Daily Streak</p>
                        <p style={{ margin: 0, fontSize: 10.5, color: 'var(--t-faint)' }}>{streak} days in a row</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--t-warn)', letterSpacing: '-0.04em' }}>{streak}</span>
                  </div>
                  <StreakCalendar streak={Math.min(streak, 7)} />
                </motion.div>
              )}
            </div>

            {/* Completed missions (mobile) */}
            {done.length > 0 && active.length > 0 && (
              <div style={{ paddingTop: 24 }}>
                <SectionHeader title="Completed" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {done.slice(0, 3).map((hunt, i) => <MissionCard key={hunt.id} hunt={hunt} index={i} isCompleted matchScore={null} />)}
                </div>
              </div>
            )}
          </div>

          {/* ── Right rail (desktop only) ── */}
          <div style={{ paddingTop: 20 }}>
            {rightRail}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
