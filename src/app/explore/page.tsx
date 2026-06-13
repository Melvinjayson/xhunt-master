'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, Search, X, Clock, DollarSign, Star, Award,
  ShieldCheck, Building2, Zap, SlidersHorizontal, Target,
  MapPin, Navigation, Sparkles, TrendingUp, ChevronRight,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { loadState, saveState, loadProfile } from '@/lib/store';
import { fetchSupabaseMissions } from '@/lib/supabase/events';
import {
  IMPACT_CATEGORIES, MISSION_TYPE_META, DIFF_META, SDG_META,
  estimateCashReward, estimateXP, deadlineLabel, resolveCategory,
} from '@/lib/missionCategories';
import type { Hunt, ImpactProfile } from '@/lib/types';
import { useProximity } from '@/hooks/useProximity';
import { sortByProximity } from '@/lib/proximity';
import { LocationPermissionCard } from '@/components/proximity/LocationPermissionCard';
import { ProximityBadge } from '@/components/proximity/ProximityBadge';

const SORT_OPTS = [
  { id: 'recommended', label: 'Best Match'  },
  { id: 'nearby',      label: '📍 Nearby'   },
  { id: 'reward',      label: 'Highest Pay' },
  { id: 'easy',        label: 'Entry Level' },
  { id: 'hard',        label: 'Expert'      },
  { id: 'quick',       label: 'Quickest'    },
  { id: 'deadline',    label: 'Ending Soon' },
];
const LOCATION_OPTS = [
  { id: 'all',    label: 'All'    },
  { id: 'remote', label: 'Remote' },
  { id: 'local',  label: '📍 Local' },
  { id: 'hybrid', label: 'Hybrid' },
];
const RADIUS_OPTS = [
  { km: 5,   label: '<5 km'  },
  { km: 20,  label: '<20 km' },
  { km: 50,  label: '<50 km' },
  { km: 100, label: '<100 km'},
  { km: 0,   label: 'Any'    },
];
type SortId = typeof SORT_OPTS[number]['id'];

interface Recommendation {
  id: string; title: string; tags: string[]; estimated_time: string;
  difficulty: string; confidence_pct: number; reason: string; reward?: string;
}

function computeMatch(hunt: Hunt, profile: ImpactProfile | null): number | null {
  if (!profile) return null;
  const tl = hunt.tags.map(tag => tag.toLowerCase());
  const cl = profile.causes.map(c => c.toLowerCase());
  const sl = profile.strengths.map(s => s.name.toLowerCase());
  let score = 55;
  for (const tag of tl) {
    if (cl.some(c => c.includes(tag) || tag.includes(c))) score += 12;
    if (sl.some(s => s.includes(tag) || tag.includes(s))) score += 8;
  }
  return Math.min(98, score + Math.round((profile.impactScore / 100) * 8));
}

function AIRecCard({ rec, index }: { rec: Recommendation; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}>
      <Link href={`/hunt/${rec.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.985 }} className="liquid-glass"
          style={{ borderRadius: 20, padding: '14px 16px', borderColor: 'rgba(109,93,253,0.22)', boxShadow: '0 0 32px rgba(109,93,253,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px 3px 7px', borderRadius: 999, background: 'rgba(109,93,253,0.12)', border: '1px solid rgba(109,93,253,0.24)' }}>
              <Brain size={11} strokeWidth={2} style={{ color: '#6D5DFD' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6D5DFD' }}>{rec.confidence_pct}% match</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--t-faint)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rec.reason}
            </span>
          </div>
          <h3 style={{ margin: '0 0 10px', fontSize: 14.5, fontWeight: 700, color: 'var(--t-txt)', lineHeight: 1.3 }}>{rec.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} strokeWidth={2} style={{ color: 'var(--t-faint)' }} />
              <span style={{ fontSize: 11, color: 'var(--t-dim)' }}>{rec.estimated_time}</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: DIFF_META[rec.difficulty as keyof typeof DIFF_META]?.color ?? 'var(--t-dim)' }}>
              {rec.difficulty}
            </span>
            {rec.reward && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                <DollarSign size={11} strokeWidth={2} style={{ color: 'var(--t-accent)' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t-accent)' }}>{rec.reward.split('+')[0].trim()}</span>
              </div>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

function ExploreCard({ hunt, index, completedIds, profile, distanceKm }: {
  hunt: Hunt; index: number; completedIds: string[]; profile: ImpactProfile | null;
  distanceKm?: number | null;
}) {
  const done    = completedIds.includes(hunt.id);
  const cash    = estimateCashReward(hunt.cashReward, hunt.difficulty, hunt.missionType);
  const xp      = estimateXP(hunt.xpReward, hunt.difficulty, hunt.steps.length);
  const diff    = DIFF_META[hunt.difficulty] ?? DIFF_META.easy;
  const cat     = resolveCategory(hunt.tags, hunt.category);
  const mtype   = hunt.missionType ? MISSION_TYPE_META[hunt.missionType] : null;
  const dlLabel = deadlineLabel(hunt.deadline);
  const ms      = computeMatch(hunt, profile);
  const msColor = ms == null ? 'var(--t-dim)' : ms >= 80 ? '#22FFAA' : ms >= 65 ? '#FFB84D' : 'var(--t-dim)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.28 }}>
      <Link href={`/hunt/${hunt.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <motion.div
          whileHover={{ scale: 1.01, translateY: -2 }}
          whileTap={{ scale: 0.985 }}
          className="liquid-glass"
          style={{
            borderRadius: 20, overflow: 'hidden',
            opacity: done ? 0.6 : 1,
            borderColor: `${cat.color}18`,
            transition: 'all 0.2s',
          }}>

          {/* Category accent top bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${cat.color}CC, ${cat.color}22)` }} />

          <div style={{ padding: '14px 16px' }}>
            {/* Badges row */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {mtype && (
                <span style={{ fontSize: 9.5, fontWeight: 700, color: mtype.color, background: `${mtype.color}12`, border: `1px solid ${mtype.color}20`, borderRadius: 999, padding: '2px 8px' }}>
                  {mtype.emoji} {mtype.label}
                </span>
              )}
              <span style={{ fontSize: 9.5, fontWeight: 700, color: cat.color, background: `${cat.color}12`, border: `1px solid ${cat.color}20`, borderRadius: 999, padding: '2px 8px' }}>
                {cat.emoji} {cat.label}
              </span>
              {distanceKm != null && <ProximityBadge distanceKm={distanceKm} />}
              {distanceKm == null && hunt.locationCity && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, color: 'var(--t-faint)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, padding: '2px 8px' }}>
                  <MapPin size={8} strokeWidth={2} /> {hunt.locationCity}
                </span>
              )}
            </div>

            {/* Title + org */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 9 }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, background: `${cat.color}14`, border: `1px solid ${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {cat.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: 'var(--t-txt)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hunt.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {hunt.tenantLogo
                    ? <img src={hunt.tenantLogo} alt="" style={{ width: 14, height: 14, borderRadius: 4 }} />
                    : <Building2 size={10} strokeWidth={2} style={{ color: 'var(--t-faint)' }} />
                  }
                  <span style={{ fontSize: 10.5, color: 'var(--t-faint)' }}>{hunt.tenantName ?? 'X-Hunt'}</span>
                  {hunt.isVerified && <ShieldCheck size={9} strokeWidth={2.5} style={{ color: '#22FFAA' }} />}
                </div>
              </div>
              {/* Match score bubble */}
              {ms != null && !done && (
                <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: `${msColor}10`, border: `2px solid ${msColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 900, color: msColor }}>{ms}%</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
              {hunt.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{ fontSize: 9.5, color: 'var(--t-faint)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 999 }}>{tag}</span>
              ))}
              {(hunt.sdgGoals?.length ?? 0) > 0 && hunt.sdgGoals!.slice(0, 1).map(g => {
                const m = SDG_META[g as keyof typeof SDG_META];
                return m ? (
                  <span key={g} style={{ fontSize: 9.5, fontWeight: 700, color: m.color, background: `${m.color}12`, border: `1px solid ${m.color}20`, padding: '2px 8px', borderRadius: 999 }}>
                    {m.emoji} SDG {g}
                  </span>
                ) : null;
              })}
            </div>

            {/* Rewards + difficulty row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={11} strokeWidth={2} style={{ color: 'var(--t-accent)' }} />
              <span style={{ fontSize: 14, fontWeight: 900, color: done ? 'var(--t-faint)' : 'var(--t-accent)', letterSpacing: '-0.02em' }}>${cash}</span>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t-faint)' }} />
              <Star size={10} strokeWidth={2} style={{ color: '#6D5DFD' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: done ? 'var(--t-faint)' : '#6D5DFD' }}>+{xp} XP</span>
              {hunt.certificationReward && (
                <>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t-faint)' }} />
                  <Award size={10} strokeWidth={2} style={{ color: '#FFB84D' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#FFB84D' }}>Cert</span>
                </>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                {dlLabel && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: dlLabel.color, background: `${dlLabel.color}10`, borderRadius: 999, padding: '2px 7px' }}>{dlLabel.label}</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 999, background: `${diff.color}10` }}>
                  <Zap size={9} strokeWidth={2.5} style={{ color: diff.color }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: diff.color }}>{diff.label}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function ExplorePage() {
  const [category, setCategory]   = useState('all');
  const [sort, setSort]           = useState<SortId>('recommended');
  const [locationFilter, setLoc]  = useState('all');
  const [radiusKm, setRadiusKm]   = useState(50);
  const [query, setQuery]         = useState('');
  const [hunts, setHunts]         = useState<Hunt[]>([]);
  const [completedIds, setIds]    = useState<string[]>([]);
  const [recs, setRecs]           = useState<Recommendation[]>([]);
  const [recsLoading, setRL]      = useState(true);
  const [profile, setProfile]     = useState<ImpactProfile | null>(null);
  const [showFilters, setFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const proximity = useProximity();

  useEffect(() => {
    if ((sort === 'nearby' || locationFilter === 'local') && proximity.status === 'idle') {
      proximity.requestLocation();
    }
  }, [sort, locationFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const state = loadState();
    setIds(state.completedHunts.map(h => h.huntId));
    setHunts(state.hunts);
    setProfile(loadProfile());
    void fetchSupabaseMissions().then(r => { if (r?.length) { setHunts(r); const s = loadState(); saveState({ ...s, hunts: r }); } });

    const recUrl = proximity.coords
      ? `/api/recommendations?limit=5&lat=${proximity.coords.lat}&lng=${proximity.coords.lng}`
      : '/api/recommendations?limit=5';
    void fetch(recUrl)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.recommendations?.length) setRecs(d.recommendations); })
      .catch(() => {})
      .finally(() => setRL(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const huntsWithDistance = proximity.coords
    ? sortByProximity(hunts, proximity.coords)
    : hunts.map(h => ({ ...h, distanceKm: null as number | null }));

  const filtered = huntsWithDistance
    .filter(h => {
      if (query) {
        const q = query.toLowerCase();
        return h.title.toLowerCase().includes(q)
          || h.tags.some(tag => tag.toLowerCase().includes(q))
          || (h.story_context ?? '').toLowerCase().includes(q)
          || (h.missionType ?? '').includes(q);
      }
      const catMatch = category === 'all'
        || h.tags.some(tag => tag.toLowerCase().includes(category))
        || h.category === category
        || resolveCategory(h.tags, h.category).id === category;
      const locMatch = locationFilter === 'all' || h.locationType === locationFilter;
      const radiusMatch = (() => {
        if (locationFilter !== 'local' || !proximity.coords || radiusKm === 0) return true;
        if (h.locationType === 'remote') return false;
        if (h.distanceKm == null) return true;
        return h.distanceKm <= radiusKm;
      })();
      return catMatch && locMatch && radiusMatch;
    })
    .sort((a, b) => {
      const dr = { easy: 0, medium: 1, hard: 2 } as const;
      if (sort === 'easy')     return (dr[a.difficulty as keyof typeof dr] ?? 1) - (dr[b.difficulty as keyof typeof dr] ?? 1);
      if (sort === 'hard')     return (dr[b.difficulty as keyof typeof dr] ?? 1) - (dr[a.difficulty as keyof typeof dr] ?? 1);
      if (sort === 'quick')    return (parseInt(a.estimated_time) || 60) - (parseInt(b.estimated_time) || 60);
      if (sort === 'reward')   return estimateCashReward(b.cashReward, b.difficulty, b.missionType) - estimateCashReward(a.cashReward, a.difficulty, a.missionType);
      if (sort === 'deadline') {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      if (sort === 'nearby') {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      }
      if (profile) {
        const sm = (computeMatch(b, profile) ?? 55) - (computeMatch(a, profile) ?? 55);
        if (sm !== 0) return sm;
      }
      return 0;
    });

  const showRecs = !query && category === 'all' && sort === 'recommended' && locationFilter === 'all';
  const totalCash = filtered.reduce((acc, h) => acc + estimateCashReward(h.cashReward, h.difficulty, h.missionType), 0);
  const showLocalProximity = locationFilter === 'local' || sort === 'nearby';
  const hasActiveFilters = category !== 'all' || sort !== 'recommended' || locationFilter !== 'all';

  return (
    <div className="consumer-app" style={{ minHeight: '100vh', background: 'var(--t-bg)' }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: -60, left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,93,253,0.05) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Sticky header ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(5,8,22,0.94)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '52px 24px 0',
        }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: 'var(--t-txt)', letterSpacing: '-0.03em' }}>Explore</h1>
              {proximity.coords && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: 'rgba(34,255,170,0.08)', border: '1px solid rgba(34,255,170,0.18)' }}>
                  <Navigation size={9} strokeWidth={2.5} style={{ color: 'var(--t-accent)' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t-accent)' }}>{proximity.place?.city ?? 'Located'}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
                border: `1px solid ${showFilters || hasActiveFilters ? 'rgba(34,255,170,0.30)' : 'rgba(255,255,255,0.10)'}`,
                background: showFilters || hasActiveFilters ? 'rgba(34,255,170,0.08)' : 'rgba(255,255,255,0.04)',
                color: showFilters || hasActiveFilters ? 'var(--t-accent)' : 'var(--t-dim)',
              }}>
              <SlidersHorizontal size={13} strokeWidth={2} />
              Filters{hasActiveFilters ? ' ✦' : ''}
            </button>
          </div>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 16, padding: '0 16px', marginBottom: 14,
            boxShadow: query ? '0 0 0 2px rgba(34,255,170,0.20)' : 'none',
            transition: 'box-shadow 0.2s',
          }}>
            <Search size={15} strokeWidth={2} style={{ color: 'var(--t-faint)', flexShrink: 0 }} />
            <input
              ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search missions, skills, causes, orgs…"
              style={{ flex: 1, height: 46, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--t-txt)', fontFamily: 'inherit' }} />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-faint)', padding: 4 }}>
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' }}>
            {IMPACT_CATEGORIES.map(cat => {
              const active = category === cat.id;
              return (
                <motion.button
                  key={cat.id} onClick={() => setCategory(cat.id)}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '7px 16px',
                    borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12.5, fontWeight: active ? 700 : 500,
                    background: active ? cat.color : 'rgba(255,255,255,0.06)',
                    color: active ? '#050816' : 'var(--t-dim)',
                    boxShadow: active ? `0 0 20px ${cat.color}40` : 'none',
                    transition: 'all 0.15s',
                  }}>
                  {cat.emoji} {cat.label}
                </motion.button>
              );
            })}
          </div>

          {/* Expandable filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', paddingBottom: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sort</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {SORT_OPTS.map(opt => {
                    const active = sort === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setSort(opt.id as SortId)}
                        style={{ padding: '5px 13px', borderRadius: 999, border: `1px solid ${active ? '#22FFAA40' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(34,255,170,0.08)' : 'transparent', color: active ? '#22FFAA' : 'var(--t-dim)', fontSize: 11.5, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Location</p>
                <div style={{ display: 'flex', gap: 6, marginBottom: locationFilter === 'local' ? 12 : 0 }}>
                  {LOCATION_OPTS.map(opt => {
                    const active = locationFilter === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setLoc(opt.id)}
                        style={{ padding: '5px 14px', borderRadius: 999, border: `1px solid ${active ? 'rgba(109,93,253,0.40)' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(109,93,253,0.10)' : 'transparent', color: active ? '#6D5DFD' : 'var(--t-dim)', fontSize: 11.5, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {locationFilter === 'local' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--t-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Radius</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {RADIUS_OPTS.map(opt => {
                          const active = radiusKm === opt.km;
                          return (
                            <button key={opt.km} onClick={() => setRadiusKm(opt.km)}
                              style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${active ? 'rgba(34,255,170,0.35)' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(34,255,170,0.08)' : 'transparent', color: active ? '#22FFAA' : 'var(--t-dim)', fontSize: 11, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 24px 0' }}>

          {/* Location permission */}
          {showLocalProximity && (
            <div style={{ marginBottom: 16 }}>
              <LocationPermissionCard
                status={proximity.status}
                loading={proximity.loading}
                cityName={proximity.place?.city}
                onRequest={proximity.requestLocation}
              />
            </div>
          )}

          {/* Market summary bar */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '10px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Target size={12} strokeWidth={2} style={{ color: 'var(--t-faint)' }} />
              <span style={{ fontSize: 11.5, color: 'var(--t-faint)' }}>{filtered.length} mission{filtered.length !== 1 ? 's' : ''}</span>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t-faint)' }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t-accent)' }}>${totalCash.toLocaleString()} available</span>
              {proximity.coords && (
                <>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t-faint)' }} />
                  <MapPin size={11} strokeWidth={2} style={{ color: 'var(--t-accent)' }} />
                  <span style={{ fontSize: 11, color: 'var(--t-accent)' }}>proximity on</span>
                </>
              )}
              {profile && !proximity.coords && (
                <>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t-faint)' }} />
                  <Brain size={11} strokeWidth={2} style={{ color: '#6D5DFD' }} />
                  <span style={{ fontSize: 11, color: '#6D5DFD' }}>AI ranked</span>
                </>
              )}
            </div>
          )}

          {/* AI Recommendations section */}
          <AnimatePresence>
            {showRecs && !recsLoading && recs.length > 0 && (
              <motion.section key="recs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(109,93,253,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={13} strokeWidth={2} style={{ color: '#6D5DFD' }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--t-txt)' }}>AI Picks for You</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--t-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Brain size={10} strokeWidth={2} /> Impact DNA · matched
                  </span>
                </div>
                {/* 2-column grid on desktop for recs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {recs.map((rec, i) => <AIRecCard key={rec.id} rec={rec} index={i} />)}
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '24px 0 0' }} />
              </motion.section>
            )}
            {showRecs && recsLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Brain size={14} strokeWidth={2} style={{ color: '#6D5DFD' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-faint)' }}>AI matching your Impact DNA…</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 100, borderRadius: 20, background: 'rgba(109,93,253,0.06)', border: '1px solid rgba(109,93,253,0.08)', opacity: 0.5 }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mission grid */}
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '70px 0', textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(34,255,170,0.08)', border: '1px solid rgba(34,255,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {showLocalProximity ? <Navigation size={24} strokeWidth={1.5} style={{ color: 'var(--t-accent)' }} /> : <Target size={24} strokeWidth={1.5} style={{ color: 'var(--t-accent)' }} />}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: 'var(--t-txt)' }}>
                {showLocalProximity && proximity.status !== 'granted' ? 'Enable location to see nearby missions' : 'No missions found'}
              </p>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--t-dim)', maxWidth: 280, lineHeight: 1.6 }}>
                {showLocalProximity && proximity.status !== 'granted'
                  ? 'Tap Allow above to find missions near you.'
                  : query ? `No results for "${query}"` : `No ${category} missions match your filters.`
                }
              </p>
              {(query || locationFilter !== 'all') && (
                <button onClick={() => { setQuery(''); setCategory('all'); setLoc('all'); setSort('recommended'); }}
                  style={{ padding: '10px 22px', borderRadius: 999, background: 'var(--t-accent)', color: '#050816', fontWeight: 700, fontSize: 13.5, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* All missions section header */}
              {(!showRecs || recsLoading) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--t-txt)' }}>
                    {category !== 'all' ? `${IMPACT_CATEGORIES.find(c => c.id === category)?.label ?? 'Category'} Missions` : 'All Missions'}
                  </h2>
                  {hasActiveFilters && (
                    <button onClick={() => { setCategory('all'); setLoc('all'); setSort('recommended'); }}
                      style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      Clear <X size={11} strokeWidth={2} />
                    </button>
                  )}
                </div>
              )}
              {showRecs && !recsLoading && recs.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--t-txt)' }}>All Missions</h2>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)', marginLeft: 12 }} />
                </div>
              )}
              {/* Responsive 2-column grid on desktop, 1-column on mobile */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {filtered.map((hunt, i) => (
                  <ExploreCard
                    key={hunt.id}
                    hunt={hunt}
                    index={i}
                    completedIds={completedIds}
                    profile={profile}
                    distanceKm={hunt.distanceKm}
                  />
                ))}
              </div>
            </>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
