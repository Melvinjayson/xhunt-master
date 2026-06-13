'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, Search, X, Clock, DollarSign, Star, Award,
  ShieldCheck, Building2, Zap, SlidersHorizontal, Target,
  MapPin, Navigation,
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { LIQUID_GLASS_STYLE } from '@/components/LiquidGlass';
import { loadState, saveState, loadProfile } from '@/lib/store';
import { fetchSupabaseMissions } from '@/lib/supabase/events';
import {
  IMPACT_CATEGORIES, MISSION_TYPE_META, DIFF_META, SDG_META,
  estimateCashReward, estimateXP, deadlineLabel, resolveCategory,
} from '@/lib/missionCategories';
import { t } from '@/theme/colors';
import type { Hunt, ImpactProfile } from '@/lib/types';
import { useProximity } from '@/hooks/useProximity';
import { haversineKm, formatDistance, proximityColor, sortByProximity } from '@/lib/proximity';
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
  { km: 0,   label: 'Any distance' },
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

function AIRecCard({ rec }: { rec: Recommendation }) {
  return (
    <Link href={`/hunt/${rec.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <motion.div whileTap={{ scale: 0.985 }} className="liquid-glass"
        style={{ ...LIQUID_GLASS_STYLE, borderRadius: 20, padding: '14px 16px', borderColor: `${t.ai}32`, boxShadow: `0 0 32px ${t.ai}0C` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px 3px 6px', borderRadius: 999, background: `${t.ai}14`, border: `1px solid ${t.ai}28` }}>
            <Brain size={11} strokeWidth={2} style={{ color: t.ai }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: t.ai }}>{rec.confidence_pct}% match</span>
          </div>
          <span style={{ fontSize: 10, color: t.txtFaint }}>· {rec.reason}</span>
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 14.5, fontWeight: 700, color: t.txt, lineHeight: 1.3 }}>{rec.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} strokeWidth={2} style={{ color: t.txtFaint }} />
            <span style={{ fontSize: 11, color: t.txtDim }}>{rec.estimated_time}</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: DIFF_META[rec.difficulty as keyof typeof DIFF_META]?.color ?? t.txtDim }}>{rec.difficulty}</span>
          {rec.reward && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <DollarSign size={11} strokeWidth={2} style={{ color: t.accent }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: t.accent }}>{rec.reward.split('+')[0].trim()}</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
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
  const msColor = ms == null ? t.txtDim : ms >= 80 ? t.accent : ms >= 65 ? t.warning : t.txtDim;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.28 }}>
      <Link href={`/hunt/${hunt.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <motion.div whileTap={{ scale: 0.985 }} className="liquid-glass"
          style={{ ...LIQUID_GLASS_STYLE, borderRadius: 20, overflow: 'hidden', opacity: done ? 0.65 : 1, borderColor: `${cat.color}18` }}>

          <div style={{ height: 2, background: `linear-gradient(90deg, ${cat.color}88, transparent)` }} />

          <div style={{ padding: '13px 15px' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 9, flexWrap: 'wrap', alignItems: 'center' }}>
              {mtype && (
                <span style={{ fontSize: 9.5, fontWeight: 700, color: mtype.color, background: `${mtype.color}10`, border: `1px solid ${mtype.color}18`, borderRadius: 999, padding: '2px 8px' }}>
                  {mtype.emoji} {mtype.label}
                </span>
              )}
              <span style={{ fontSize: 9.5, fontWeight: 700, color: cat.color, background: `${cat.color}10`, border: `1px solid ${cat.color}18`, borderRadius: 999, padding: '2px 8px' }}>
                {cat.emoji} {cat.label}
              </span>
              {/* Proximity badge — shown when we have a distance */}
              {distanceKm != null && (
                <ProximityBadge distanceKm={distanceKm} />
              )}
              {/* Location city when no distance */}
              {distanceKm == null && hunt.locationCity && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9.5, color: t.txtFaint, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 999, padding: '2px 8px' }}>
                  <MapPin size={8} strokeWidth={2} />
                  {hunt.locationCity}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 7 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: `${cat.color}14`, border: `1px solid ${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {cat.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 700, color: t.txt, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hunt.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {hunt.tenantLogo
                    ? <img src={hunt.tenantLogo} alt="" style={{ width: 14, height: 14, borderRadius: 4 }} />
                    : <Building2 size={10} strokeWidth={2} style={{ color: t.txtFaint }} />
                  }
                  <span style={{ fontSize: 10.5, color: t.txtFaint }}>{hunt.tenantName ?? 'X-Hunt'}</span>
                  {hunt.isVerified && <ShieldCheck size={9} strokeWidth={2.5} style={{ color: t.accent }} />}
                </div>
              </div>
              {ms != null && !done && (
                <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', background: `${msColor}10`, border: `2px solid ${msColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 900, color: msColor }}>{ms}%</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 5, marginBottom: 9, flexWrap: 'wrap' }}>
              {hunt.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{ fontSize: 9.5, color: t.txtFaint, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', padding: '1px 8px', borderRadius: 999 }}>{tag}</span>
              ))}
              {(hunt.sdgGoals?.length ?? 0) > 0 && hunt.sdgGoals!.slice(0, 2).map(g => {
                const m = SDG_META[g as keyof typeof SDG_META];
                return m ? (
                  <span key={g} style={{ fontSize: 9.5, fontWeight: 700, color: m.color, background: `${m.color}12`, border: `1px solid ${m.color}20`, padding: '1px 8px', borderRadius: 999 }}>
                    {m.emoji} SDG {g}
                  </span>
                ) : null;
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={11} strokeWidth={2} style={{ color: t.accent }} />
              <span style={{ fontSize: 13, fontWeight: 900, color: done ? t.txtFaint : t.accent, letterSpacing: '-.02em' }}>${cash}</span>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: t.txtFaint }} />
              <Star size={10} strokeWidth={2} style={{ color: t.ai }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: done ? t.txtFaint : t.ai }}>+{xp} XP</span>
              {hunt.certificationReward && (
                <>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: t.txtFaint }} />
                  <Award size={10} strokeWidth={2} style={{ color: t.warning }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.warning }}>Cert</span>
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

  // When "Nearby" sort is picked and we don't have coords yet, trigger the request
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

  // Annotate hunts with distance when user has coords
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
      // Radius filter — only when user coords are known and local filter is active
      const radiusMatch = (() => {
        if (locationFilter !== 'local' || !proximity.coords || radiusKm === 0) return true;
        if (h.locationType === 'remote') return false;
        if (h.distanceKm == null) return true; // no coords on mission → show it
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

  return (
    <div className="consumer-app" style={{ minHeight: '100vh', paddingBottom: 100, background: t.bg }}>
      <div style={{ maxWidth: 430, margin: '0 auto' }}>

        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(5,8,22,.94)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '52px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: t.txt, letterSpacing: '-.03em' }}>Explore</h1>
              {proximity.coords && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: `${t.accent}0A`, border: `1px solid ${t.accent}18` }}>
                  <Navigation size={9} strokeWidth={2.5} style={{ color: t.accent }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: t.accent }}>
                    {proximity.place?.city ?? 'Located'}
                  </span>
                </div>
              )}
            </div>
            <button onClick={() => setFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, border: `1px solid ${showFilters ? t.accent + '35' : 'rgba(255,255,255,.1)'}`, background: showFilters ? `${t.accent}0A` : 'rgba(255,255,255,.04)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: showFilters ? t.accent : t.txtDim }}>
              <SlidersHorizontal size={13} strokeWidth={2} />
              Filters {showFilters ? '▲' : '▼'}
            </button>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...LIQUID_GLASS_STYLE, borderRadius: 14, padding: '0 14px', marginBottom: 12 }}>
            <Search size={15} strokeWidth={2} style={{ color: t.txtFaint, flexShrink: 0 }} />
            <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search missions, skills, causes, orgs…"
              style={{ flex: 1, height: 44, background: 'none', border: 'none', outline: 'none', fontSize: 13.5, color: t.txt, fontFamily: 'inherit' }} />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.txtFaint }}>
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
            {IMPACT_CATEGORIES.map(cat => {
              const active = category === cat.id;
              return (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 700 : 500, background: active ? cat.color : 'rgba(255,255,255,.06)', color: active ? t.bg : t.txtDim, boxShadow: active ? `0 0 18px ${cat.color}40` : 'none', transition: 'all .15s' }}>
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', paddingBottom: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.08em' }}>Sort by</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {SORT_OPTS.map(opt => {
                    const active = sort === opt.id;
                    const isNearby = opt.id === 'nearby';
                    const clr = isNearby ? t.accent : t.accent;
                    return (
                      <button key={opt.id} onClick={() => setSort(opt.id as SortId)}
                        style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${active ? clr : 'rgba(255,255,255,.07)'}`, background: active ? `${clr}10` : 'transparent', color: active ? clr : t.txtDim, fontSize: 11.5, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.08em' }}>Location</p>
                <div style={{ display: 'flex', gap: 6, marginBottom: locationFilter === 'local' ? 10 : 0 }}>
                  {LOCATION_OPTS.map(opt => {
                    const active = locationFilter === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setLoc(opt.id)}
                        style={{ padding: '5px 14px', borderRadius: 999, border: `1px solid ${active ? t.ai : 'rgba(255,255,255,.07)'}`, background: active ? `${t.ai}10` : 'transparent', color: active ? t.ai : t.txtDim, fontSize: 11.5, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {/* Radius filter — shown only when Local is active */}
                <AnimatePresence>
                  {locationFilter === 'local' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.08em' }}>Radius</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {RADIUS_OPTS.map(opt => {
                          const active = radiusKm === opt.km;
                          return (
                            <button key={opt.km} onClick={() => setRadiusKm(opt.km)}
                              style={{ padding: '4px 11px', borderRadius: 999, border: `1px solid ${active ? t.accent : 'rgba(255,255,255,.07)'}`, background: active ? `${t.accent}10` : 'transparent', color: active ? t.accent : t.txtDim, fontSize: 11, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
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

        <div style={{ padding: '16px 20px 0' }}>
          {/* Location permission card — shown when local/nearby is active */}
          {showLocalProximity && (
            <LocationPermissionCard
              status={proximity.status}
              loading={proximity.loading}
              cityName={proximity.place?.city}
              onRequest={proximity.requestLocation}
            />
          )}

          {/* Market summary */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '9px 14px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
              <Target size={12} strokeWidth={2} style={{ color: t.txtFaint }} />
              <span style={{ fontSize: 11, color: t.txtFaint }}>{filtered.length} mission{filtered.length !== 1 ? 's' : ''}</span>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: t.txtFaint }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: t.accent }}>${totalCash.toLocaleString()} available</span>
              {proximity.coords && (
                <>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: t.txtFaint }} />
                  <MapPin size={11} strokeWidth={2} style={{ color: t.accent }} />
                  <span style={{ fontSize: 11, color: t.accent }}>proximity on</span>
                </>
              )}
              {profile && !proximity.coords && (
                <>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: t.txtFaint }} />
                  <Brain size={11} strokeWidth={2} style={{ color: t.ai }} />
                  <span style={{ fontSize: 11, color: t.ai }}>AI ranked</span>
                </>
              )}
            </div>
          )}

          {/* AI Recommendations */}
          <AnimatePresence>
            {showRecs && !recsLoading && recs.length > 0 && (
              <motion.section key="recs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: `${t.ai}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Brain size={13} strokeWidth={2} style={{ color: t.ai }} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: t.txt }}>AI Picks for You</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: t.txtFaint }}>Impact DNA · ranked</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recs.map((rec, i) => (
                    <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                      <AIRecCard rec={rec} />
                    </motion.div>
                  ))}
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '20px 0 0' }} />
              </motion.section>
            )}
            {showRecs && recsLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Brain size={14} strokeWidth={2} style={{ color: t.ai }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.txtFaint }}>AI matching your Impact DNA…</span>
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 88, borderRadius: 20, background: t.surface, marginBottom: 10, border: `1px solid ${t.ai}08`, opacity: 0.5 }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mission list */}
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${t.accent}0A`, border: `1px solid ${t.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                {showLocalProximity
                  ? <Navigation size={22} strokeWidth={1.6} style={{ color: t.accent }} />
                  : <Target size={22} strokeWidth={1.6} style={{ color: t.accent }} />
                }
              </div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.txt }}>
                {showLocalProximity && proximity.status !== 'granted' ? 'Enable location to see nearby missions' : 'No missions found'}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: t.txtDim }}>
                {showLocalProximity && proximity.status !== 'granted'
                  ? 'Tap Allow above to find missions near you.'
                  : query ? `No results for "${query}"` : `No ${category} missions yet.`
                }
              </p>
              {(query || locationFilter !== 'all') && (
                <button onClick={() => { setQuery(''); setCategory('all'); setLoc('all'); setSort('recommended'); }}
                  style={{ marginTop: 16, padding: '8px 20px', borderRadius: 999, background: t.accent, color: t.bg, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
