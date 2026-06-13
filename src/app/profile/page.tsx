'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Flame, CheckCircle, Settings, ArrowRight, Trophy, Loader2, Sparkles,
  Shield, Zap, Star, TrendingUp, Brain, Globe, Copy, Check,
  BarChart3, Target, Layers,
} from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { loadState, clearState, loadProfile } from '@/lib/store';
import type { CompletedHunt, ImpactProfile } from '@/lib/types';

interface SkillData {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  confidence: number;
  evidence: string[];
}
interface CategoryData {
  catId: string;
  count: number;
  label: string;
  emoji: string;
  color: string;
}

const LEVEL_CFG = {
  Beginner:     { color: 'var(--t-faint)',  gradient: 'rgba(74,85,120,0.15)'    },
  Intermediate: { color: 'var(--t-accent)', gradient: 'rgba(34,255,170,0.12)'   },
  Advanced:     { color: 'var(--t-warn)',   gradient: 'rgba(255,184,77,0.12)'   },
};

const ARCHETYPE_COLORS: Record<string, string> = {
  Explorer: '#22FFAA', Builder: '#6D5DFD', Innovator: '#a78bfa',
  Mentor: '#FFB84D', Creator: '#FF5C7A', Analyst: '#60A5FA', Activist: '#22FFAA',
};

const INTEREST_LABELS: Record<string, string> = {
  adventure: '🌍 Adventure', food: '🍴 Food', art: '🎨 Art', tech: '💻 Tech',
  fitness: '💪 Fitness', mindfulness: '🧘 Mindfulness', social: '👥 Social', learning: '📚 Learning',
};

const ARCHETYPE_DESC: Record<string, string> = {
  Explorer:  'Driven by discovery, you seek new experiences and push boundaries.',
  Builder:   'You create systems and structures that enable others to thrive.',
  Innovator: 'You transform ideas into solutions that reshape industries.',
  Mentor:    'Your impact multiplies through the people you guide and develop.',
  Creator:   'You bring imagination to life through art, story, and expression.',
  Analyst:   'Data and patterns guide your insight-driven decision making.',
  Activist:  'Your passion for change drives meaningful social transformation.',
};

function getInitials(name: string | null) {
  if (!name) return 'XP';
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function SectionHeader({ title, badge, icon: Icon }: { title: string; badge?: string; icon?: React.ElementType }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {Icon && (
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={13} strokeWidth={2} style={{ color: 'var(--t-dim)' }} />
          </div>
        )}
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--t-txt)' }}>{title}</h2>
      </div>
      {badge && (
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{badge}</span>
      )}
    </div>
  );
}

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  return (
    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.75, delay, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${color}70, ${color})` }}
      />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [interests, setInterests]       = useState<string[]>([]);
  const [completedHunts, setCompleted]  = useState<CompletedHunt[]>([]);
  const [streak, setStreak]             = useState(0);
  const [displayName, setName]          = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [subStatus, setSub]             = useState<{ tier: string; isTrialActive: boolean; trialDaysLeft: number; hasUsedTrial: boolean; canUseAI: boolean } | null>(null);
  const [impactProfile, setProfile]     = useState<ImpactProfile | null>(null);
  const [skills, setSkills]             = useState<SkillData[]>([]);
  const [categories, setCategories]     = useState<CategoryData[]>([]);
  const [copied, setCopied]             = useState(false);

  useEffect(() => {
    const state = loadState();
    if (!state.user?.onboardingComplete) { router.replace('/get-started'); return; }
    setInterests(state.user?.interests ?? []);
    setCompleted(state.completedHunts);
    setStreak(state.streak);
    setMounted(true);
    setProfile(loadProfile());
    void fetch('/api/subscription/status').then((r) => r.json()).then((d) => setSub(d as typeof subStatus)).catch(() => {});

    void (async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
      setLoading(true);
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: profile } = await sb.from('user_profiles').select('display_name, interests').eq('id', user.id).single();
        if (profile?.display_name) setName(profile.display_name);
        if (profile?.interests?.length) setInterests(profile.interests);

        const { data: progress } = await sb
          .from('mission_progress')
          .select('mission_id, completed_at')
          .eq('user_id', user.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false });

        if (progress?.length) {
          const ids = [...new Set(progress.map((p: { mission_id: string }) => p.mission_id))];
          const { data: missions } = await sb.from('missions').select('id, title, reward').in('id', ids);
          if (missions?.length) {
            const mMap = new Map((missions as { id: string; title: string; reward: string }[]).map((m) => [m.id, m]));
            const merged: CompletedHunt[] = progress
              .filter((p: { mission_id: string }) => mMap.has(p.mission_id))
              .map((p: { mission_id: string; completed_at: string }) => {
                const m = mMap.get(p.mission_id)!;
                return { huntId: p.mission_id, huntTitle: m.title, reward: m.reward, completedAt: p.completed_at };
              });
            setCompleted((prev) => {
              const sbIds = new Set(merged.map((c) => c.huntId));
              const local = prev.filter((c) => !sbIds.has(c.huntId) && !isUUID(c.huntId));
              return [...merged, ...local].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
            });
          }
        }

        const skillsRes = await fetch('/api/skills/infer');
        if (skillsRes.ok) {
          const data = await skillsRes.json() as { skills: SkillData[]; topCategories: CategoryData[] };
          setSkills(data.skills ?? []);
          setCategories(data.topCategories ?? []);
        }
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [router]);

  if (!mounted) return null;

  const initials   = getInitials(displayName);
  const name       = displayName ?? 'Explorer';
  const mms        = Math.min(1000, 50 + completedHunts.length * 40 + streak * 15);
  const tierLabel  = mms >= 700 ? 'Elite Hunter' : mms >= 400 ? 'Pro Hunter' : mms >= 150 ? 'Verified Hunter' : 'Explorer';
  const tierColor  = mms >= 700 ? '#FFB84D' : mms >= 400 ? '#6D5DFD' : mms >= 150 ? '#22FFAA' : '#4A5578';
  const impactScore = completedHunts.length * 12 + streak * 5 + categories.length * 8;
  const aColor = ARCHETYPE_COLORS[impactProfile?.archetype ?? ''] ?? '#22FFAA';

  function copyLink() {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="consumer-app" style={{ minHeight: '100vh', background: 'var(--t-bg)', color: 'var(--t-txt)' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* ── Hero ── */}
        <div style={{
          padding: '56px 20px 24px',
          background: `radial-gradient(600px 500px at 50% -40px, ${aColor}08 0%, rgba(109,93,253,0.04) 40%, transparent 70%)`,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* Top controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--t-txt)', letterSpacing: '-0.02em' }}>Impact Portfolio</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {loading && <Loader2 size={14} style={{ color: 'var(--t-faint)', animation: 'spin 1s linear infinite' }} strokeWidth={2} />}
              <button onClick={copyLink} title="Copy portfolio link"
                style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${aColor}0D`, border: `1px solid ${aColor}22`, cursor: 'pointer' }}>
                {copied
                  ? <Check size={15} strokeWidth={2.5} style={{ color: aColor }} />
                  : <Copy size={15} strokeWidth={1.8} style={{ color: aColor }} />}
              </button>
              <button
                onClick={() => { if (confirm('Reset all data and start fresh?')) { clearState(); router.replace('/'); } }}
                style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                <Settings size={16} strokeWidth={1.8} style={{ color: 'var(--t-dim)' }} />
              </button>
            </div>
          </div>

          {/* Avatar + identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 76, height: 76, borderRadius: 24, background: `linear-gradient(135deg, ${aColor}20, rgba(109,93,253,0.25))`, border: `2px solid ${aColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 32px ${aColor}18` }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: aColor }}>{initials}</span>
              </div>
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: 'var(--t-card)', border: '2px solid var(--t-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: tierColor, boxShadow: `0 0 8px ${tierColor}` }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: 'var(--t-txt)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: tierColor, background: `${tierColor}14`, border: `1px solid ${tierColor}28`, borderRadius: 999, padding: '3px 11px' }}>{tierLabel}</span>
                {impactProfile?.archetype && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: aColor, background: `${aColor}10`, border: `1px solid ${aColor}20`, borderRadius: 999, padding: '3px 11px' }}>{impactProfile.archetype}</span>
                )}
              </div>
              {impactProfile?.archetype && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--t-dim)', lineHeight: 1.5 }}>
                  {ARCHETYPE_DESC[impactProfile.archetype] ?? ''}
                </p>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Score',    value: mms,                   color: tierColor,  icon: TrendingUp },
              { label: 'Missions', value: completedHunts.length, color: '#22FFAA',  icon: Trophy     },
              { label: 'Skills',   value: skills.length,         color: '#6D5DFD',  icon: Brain      },
              { label: 'Impact',   value: impactScore,           color: '#FFB84D',  icon: Star       },
            ].map(({ label, value, color, icon: Icon }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="liquid-glass" style={{ borderRadius: 16, padding: '12px 6px', textAlign: 'center' }}>
                <Icon size={13} strokeWidth={2} style={{ color, marginBottom: 5 }} />
                <div style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value.toLocaleString()}</div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px' }}>

          {/* ── Impact DNA ── */}
          {impactProfile && (
            <section style={{ marginBottom: 24 }}>
              <SectionHeader title="Impact DNA" badge="AI Profile" icon={Brain} />

              {/* Archetype card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ borderRadius: 20, padding: '16px 18px', background: `linear-gradient(135deg, ${aColor}08, rgba(109,93,253,0.06))`, border: `1px solid ${aColor}18`, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${aColor}16`, border: `1.5px solid ${aColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={24} strokeWidth={1.5} style={{ color: aColor }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Archetype</p>
                    <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: aColor, letterSpacing: '-0.02em' }}>{impactProfile.archetype}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--t-faint)' }}>Impact Score</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: aColor }}>{impactProfile.impactScore}</span>
                      <span style={{ fontSize: 10, color: 'var(--t-faint)' }}>/100</span>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', maxWidth: 60, marginLeft: 4 }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${impactProfile.impactScore}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                          style={{ height: '100%', borderRadius: 2, background: aColor }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Strengths */}
              {impactProfile.strengths.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  className="liquid-glass" style={{ borderRadius: 18, padding: '16px 18px', marginBottom: 12 }}>
                  <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Strengths</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {impactProfile.strengths.slice(0, 5).map((s, i) => (
                      <div key={s.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'var(--t-dim)', fontWeight: 600 }}>{s.name}</span>
                          <span style={{ fontSize: 12, color: aColor, fontWeight: 800 }}>{s.score}%</span>
                        </div>
                        <AnimatedBar pct={s.score} color={aColor} delay={0.15 + i * 0.06} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Causes + Motivations */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {impactProfile.causes.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="liquid-glass" style={{ borderRadius: 16, padding: '14px 16px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Causes</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {impactProfile.causes.map((c) => (
                        <span key={c} style={{ fontSize: 10, fontWeight: 700, color: '#22FFAA', background: 'rgba(34,255,170,0.10)', border: '1px solid rgba(34,255,170,0.20)', borderRadius: 999, padding: '3px 9px' }}>{c}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="liquid-glass" style={{ borderRadius: 16, padding: '14px 16px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Availability</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={12} style={{ color: 'var(--t-accent)' }} strokeWidth={2} />
                    <span style={{ fontSize: 12.5, color: 'var(--t-txt)', fontWeight: 700 }}>{impactProfile.availability}</span>
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: 10, color: 'var(--t-faint)' }}>per week</p>
                </motion.div>
              </div>

              {/* Personality + Growth Areas */}
              {(impactProfile.personality.length > 0 || impactProfile.growthAreas.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  className="liquid-glass" style={{ borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    {impactProfile.personality.length > 0 && (
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Personality</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {impactProfile.personality.map((item) => (
                            <span key={item} style={{ fontSize: 11.5, color: '#a78bfa', fontWeight: 600 }}>· {item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {impactProfile.growthAreas.length > 0 && (
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Growth Areas</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {impactProfile.growthAreas.map((item) => (
                            <span key={item} style={{ fontSize: 11.5, color: '#FFB84D', fontWeight: 600 }}>· {item}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </section>
          )}

          {/* ── Skills Intelligence ── */}
          {skills.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
              <SectionHeader title="Skills" badge="AI Inferred" icon={BarChart3} />
              <div className="liquid-glass" style={{ borderRadius: 20, padding: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {skills.slice(0, 6).map((s, i) => {
                    const cfg = LEVEL_CFG[s.level] ?? LEVEL_CFG.Beginner;
                    return (
                      <motion.div key={s.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-dim)' }}>{s.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, color: cfg.color, background: cfg.gradient, borderRadius: 999, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.level}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{s.confidence}%</span>
                        </div>
                        <AnimatedBar pct={s.confidence} color={cfg.color} delay={0.2 + i * 0.06} />
                        {s.evidence.length > 0 && (
                          <p style={{ margin: '4px 0 0', fontSize: 10, color: 'var(--t-faint)' }}>via {s.evidence.slice(0, 2).join(' · ')}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}

          {/* ── Impact Areas ── */}
          {categories.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ marginBottom: 24 }}>
              <SectionHeader title="Impact Areas" icon={Globe} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                {categories.map((cat) => (
                  <motion.div key={cat.catId} whileTap={{ scale: 0.95 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999, padding: '7px 14px', background: `${cat.color}0F`, border: `1px solid ${cat.color}25` }}>
                    <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: cat.color }}>{cat.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: `${cat.color}18`, borderRadius: 999, padding: '0 5px' }}>{cat.count}</span>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ── Streak ── */}
          {streak > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ borderRadius: 20, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,184,77,0.07)', border: '1px solid rgba(255,184,77,0.18)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,184,77,0.12)' }}>
                <Flame size={22} strokeWidth={2} style={{ color: '#FFB84D' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 1px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-faint)' }}>Daily Streak</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#FFB84D' }}>{streak} Day{streak !== 1 ? 's' : ''}</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB84D', boxShadow: '0 0 6px rgba(255,184,77,0.5)' }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Rewards CTA ── */}
          <motion.a href="/rewards" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 20, marginBottom: 16, background: 'linear-gradient(135deg, rgba(34,255,170,0.07), rgba(109,93,253,0.07))', border: '1px solid rgba(34,255,170,0.16)', textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #22FFAA, #6D5DFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🏆</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: 14.5, fontWeight: 800, color: 'var(--t-txt)' }}>Rewards & Earnings</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--t-dim)' }}>Badges, payouts, Hunter Score progress</p>
            </div>
            <ArrowRight size={16} strokeWidth={2} style={{ color: '#22FFAA', flexShrink: 0 }} />
          </motion.a>

          {/* ── Plan card ── */}
          {subStatus && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius: 20, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14,
                background: subStatus.isTrialActive ? 'rgba(109,93,253,0.07)' : subStatus.tier === 'pro' ? 'rgba(34,255,170,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${subStatus.isTrialActive ? 'rgba(109,93,253,0.22)' : subStatus.tier === 'pro' ? 'rgba(34,255,170,0.16)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: subStatus.isTrialActive ? 'rgba(109,93,253,0.12)' : subStatus.tier === 'pro' ? 'rgba(34,255,170,0.10)' : 'rgba(255,255,255,0.04)' }}>
                {subStatus.tier === 'pro' ? <Shield size={19} style={{ color: '#22FFAA' }} strokeWidth={2} /> : subStatus.isTrialActive ? <Sparkles size={19} style={{ color: '#6D5DFD' }} strokeWidth={2} /> : <Zap size={19} style={{ color: 'var(--t-faint)' }} strokeWidth={2} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 1px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-faint)' }}>Current Plan</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--t-txt)' }}>{subStatus.tier === 'pro' ? 'Pro' : subStatus.isTrialActive ? `Trial · ${subStatus.trialDaysLeft}d left` : 'Free'}</p>
              </div>
              {subStatus.tier !== 'pro' && (
                <button onClick={() => router.push('/upgrade')} style={{ fontSize: 12.5, fontWeight: 700, color: subStatus.isTrialActive ? '#6D5DFD' : '#22FFAA', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, flexShrink: 0 }}>
                  {subStatus.isTrialActive ? 'Upgrade' : subStatus.hasUsedTrial ? 'Go Pro' : 'Try Free'} <ArrowRight size={12} strokeWidth={2.5} />
                </button>
              )}
            </motion.div>
          )}

          {/* ── Interests ── */}
          {interests.length > 0 && (
            <section style={{ marginBottom: 24 }}>
              <SectionHeader title="Interests" icon={Layers} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                {interests.map((id) => (
                  <span key={id} className="liquid-glass" style={{ borderRadius: 999, padding: '7px 16px', fontSize: 13, fontWeight: 500, color: 'var(--t-txt)' }}>
                    {INTEREST_LABELS[id] ?? id}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Mission History ── */}
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={13} strokeWidth={2} style={{ color: 'var(--t-dim)' }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--t-txt)' }}>
                  Mission History {completedHunts.length > 0 && `(${completedHunts.length})`}
                </h2>
              </div>
              {completedHunts.length > 0 && (
                <Link href="/missions" style={{ fontSize: 11.5, fontWeight: 600, color: '#22FFAA', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  Browse More <ArrowRight size={11} strokeWidth={2.5} />
                </Link>
              )}
            </div>

            {completedHunts.length === 0 ? (
              <div className="liquid-glass" style={{ borderRadius: 22, padding: '36px 22px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(34,255,170,0.08)', border: '1px solid rgba(34,255,170,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Trophy size={22} strokeWidth={1.5} style={{ color: '#22FFAA' }} />
                </div>
                <p style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 800, color: 'var(--t-txt)' }}>No completed missions yet</p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--t-dim)', lineHeight: 1.6 }}>Complete missions to build your impact portfolio.</p>
                <button onClick={() => router.push('/missions')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: '#050816', background: '#22FFAA', border: 'none', borderRadius: 14, cursor: 'pointer', padding: '10px 22px' }}>
                  Browse Missions <ArrowRight size={14} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 19, top: 8, bottom: 8, width: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {completedHunts.map((c, i) => (
                    <motion.div key={c.huntId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'var(--t-card)', border: '2px solid rgba(34,255,170,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginTop: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22FFAA', boxShadow: '0 0 8px rgba(34,255,170,0.7)' }} />
                      </div>
                      <div className="liquid-glass" style={{ flex: 1, borderRadius: 18, padding: '14px 16px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 600, color: 'var(--t-txt)', lineHeight: 1.3 }}>{c.huntTitle}</p>
                        <p style={{ margin: '0 0 9px', fontSize: 12, fontWeight: 700, color: '#22FFAA' }}>{c.reward.split('+')[0].trim()}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ margin: 0, fontSize: 10.5, color: 'var(--t-faint)' }}>
                            {new Date(c.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle size={11} strokeWidth={2} style={{ color: '#22FFAA' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#22FFAA' }}>Completed</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <p style={{ textAlign: 'center', fontSize: 11, marginTop: 16, color: 'var(--t-faint)' }}>
            XHunt · AI-Powered Outcome Intelligence
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
