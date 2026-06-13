'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, Zap, Trophy, ChevronDown, ChevronUp,
  ShieldCheck, Building2, MapPin, Users, Calendar, Target,
  Briefcase, BookOpen, Sparkles, CheckCircle2, DollarSign,
  Star, Award, Brain, ExternalLink, Share2, Bookmark, AlertCircle,
  FileText, Upload, MessageSquare, TrendingUp,
} from 'lucide-react';
import { loadState, loadProfile } from '@/lib/store';
import { LIQUID_GLASS_STYLE } from '@/components/LiquidGlass';
import {
  MISSION_TYPE_META, ORG_TYPE_META, DIFF_META, SDG_META,
  estimateCashReward, estimateXP, deadlineLabel, spotsLabel, demandLabel,
  resolveCategory,
} from '@/lib/missionCategories';
import type { Hunt, ImpactProfile } from '@/lib/types';

/* ─── tokens ─── */
const BG     = '#050816';
const CARD   = '#0A1226';
const SURF   = '#07101F';
const ACCENT = '#22FFAA';
const AI_CLR = '#6D5DFD';
const WARN   = '#FFB84D';
const ERR    = '#FF5C7A';
const TXT    = '#F0F4FF';
const DIM    = '#8B9CC0';
const FAINT  = '#4A5578';

const XGLASS: React.CSSProperties = LIQUID_GLASS_STYLE;

/* ─── reward pill ─── */
function RewardPill({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string; color: string; bg: string;
}) {
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${color}20`, borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
      </div>
      <span style={{ fontSize: 17, fontWeight: 900, color, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</span>
    </div>
  );
}

/* ─── sdg badge ─── */
function SDGBadge({ goal }: { goal: number }) {
  const meta = SDG_META[goal as keyof typeof SDG_META];
  if (!meta) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${meta.color}14`, border: `1px solid ${meta.color}25`, borderRadius: 10, padding: '4px 10px 4px 7px' }}>
      <span style={{ fontSize: 13 }}>{meta.emoji}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, whiteSpace: 'nowrap' }}>SDG {goal}</span>
    </div>
  );
}

/* ─── deliverable item ─── */
function Deliverable({ text, index }: { text: string; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(34,255,170,.04)', border: '1px solid rgba(34,255,170,.1)' }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, background: `${ACCENT}18`, border: `1px solid ${ACCENT}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: ACCENT }}>{index + 1}</span>
      </div>
      <span style={{ fontSize: 13, color: DIM, lineHeight: 1.5, flex: 1 }}>{text}</span>
    </motion.div>
  );
}

/* ─── skill chip ─── */
function SkillChip({ skill, color }: { skill: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}10`, border: `1px solid ${color}20`, borderRadius: 999, padding: '4px 12px', whiteSpace: 'nowrap' }}>
      {skill}
    </span>
  );
}

/* ─── match score ring ─── */
function MatchRing({ score, color }: { score: number; color: string }) {
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={60} height={60} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={30} cy={30} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={4} />
        <motion.circle cx={30} cy={30} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          strokeDasharray={circ}
        />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 900, color, position: 'relative', zIndex: 1 }}>{score}%</span>
    </div>
  );
}

/* ─── page ─── */
export default function HuntDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const huntId  = params?.id as string;

  const [hunt, setHunt]               = useState<Hunt | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stepsOpen, setStepsOpen]     = useState(false);
  const [saved, setSaved]             = useState(false);
  const [profile, setProfile]         = useState<ImpactProfile | null>(null);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    const state = loadState();
    const found = state.hunts.find((h) => h.id === huntId);
    if (found) {
      setHunt(found);
      setIsCompleted(state.completedHunts.some((c) => c.huntId === huntId));
    }
    setProfile(loadProfile());
    setMounted(true);
  }, [huntId]);

  if (!mounted) return null;
  if (!hunt) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
      <p style={{ color: FAINT, fontSize: 14 }}>Mission not found.</p>
    </div>
  );

  /* ── computed values ── */
  const cash      = estimateCashReward(hunt.cashReward, hunt.difficulty, hunt.missionType);
  const xp        = estimateXP(hunt.xpReward, hunt.difficulty, hunt.steps.length);
  const diff      = DIFF_META[hunt.difficulty] ?? DIFF_META.easy;
  const cat       = resolveCategory(hunt.tags, hunt.category);
  const mtype     = hunt.missionType ? MISSION_TYPE_META[hunt.missionType] : null;
  const orgType   = hunt.organizationType ? ORG_TYPE_META[hunt.organizationType] : null;
  const dlLabel   = deadlineLabel(hunt.deadline);
  const spLabel   = spotsLabel(hunt.spotsRemaining, hunt.spotsTotal);
  const demand    = demandLabel(hunt.applicationCount);

  /* match score from impact profile */
  let matchScore: number | null = null;
  if (profile) {
    const tagLower   = hunt.tags.map((t) => t.toLowerCase());
    const causeLower = profile.causes.map((c) => c.toLowerCase());
    const skillLower = profile.strengths.map((s) => s.name.toLowerCase());
    let s = 55;
    for (const t of tagLower) {
      if (causeLower.some((c) => c.includes(t) || t.includes(c))) s += 12;
      if (skillLower.some((k) => k.includes(t) || t.includes(k))) s += 8;
    }
    s += Math.round((profile.impactScore / 100) * 10);
    matchScore = Math.min(98, s);
  }

  const matchColor = matchScore == null ? DIM : matchScore >= 80 ? ACCENT : matchScore >= 65 ? WARN : DIM;

  /* hero gradient from category color */
  const heroFrom = cat.color + '18';
  const heroTo   = AI_CLR + '0A';

  const deliverables: string[] = hunt.deliverables ?? [
    'Written report or summary of findings',
    'Photo/video evidence of completion',
    'Brief reflection on impact created',
  ];

  const skills: string[] = hunt.requiredSkills ?? hunt.tags.slice(0, 4);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TXT }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* ── HERO ── */}
        <div style={{ position: 'relative', minHeight: 260, background: `linear-gradient(160deg, ${heroFrom} 0%, ${heroTo} 100%)`, overflow: 'hidden' }}>
          {/* ambient glow */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${cat.color}22 0%, transparent 65%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${AI_CLR}14 0%, transparent 65%)`, pointerEvents: 'none' }} />

          {/* back + actions */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '52px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(5,8,22,.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeft size={17} strokeWidth={2} style={{ color: TXT }} />
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSaved(!saved)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(5,8,22,.7)', backdropFilter: 'blur(12px)', border: `1px solid ${saved ? ACCENT + '40' : 'rgba(255,255,255,.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Bookmark size={15} strokeWidth={2} style={{ color: saved ? ACCENT : DIM, fill: saved ? ACCENT : 'none' }} />
              </button>
              <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(5,8,22,.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Share2 size={15} strokeWidth={2} style={{ color: DIM }} />
              </button>
            </div>
          </div>

          {/* hero content */}
          <div style={{ padding: '110px 20px 28px' }}>
            {/* mission type + category badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
              {mtype && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${mtype.color}18`, border: `1px solid ${mtype.color}30`, borderRadius: 999, padding: '4px 12px' }}>
                  <span style={{ fontSize: 13 }}>{mtype.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: mtype.color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{mtype.label}</span>
                </div>
              )}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${cat.color}18`, border: `1px solid ${cat.color}30`, borderRadius: 999, padding: '4px 12px' }}>
                <span style={{ fontSize: 13 }}>{cat.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{cat.label}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${diff.color}18`, border: `1px solid ${diff.color}30`, borderRadius: 999, padding: '4px 12px' }}>
                <Zap size={10} strokeWidth={2.5} style={{ color: diff.color }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: diff.color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{diff.label}</span>
              </div>
            </div>

            <h1 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-.03em' }}>
              {hunt.title}
            </h1>

            {/* org row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {hunt.tenantLogo ? (
                <img src={hunt.tenantLogo} alt={hunt.tenantName} style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {orgType ? <span style={{ fontSize: 11 }}>{orgType.emoji}</span> : <Building2 size={11} strokeWidth={2} style={{ color: FAINT }} />}
                </div>
              )}
              <span style={{ fontSize: 12, color: DIM }}>{hunt.tenantName ?? 'X-Hunt Community'}</span>
              {hunt.isVerified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ShieldCheck size={11} strokeWidth={2.5} style={{ color: ACCENT }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT }}>Verified</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ padding: '20px 20px 140px' }}>

          {/* ── URGENCY ROW ── */}
          {(dlLabel || spLabel || demand) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {dlLabel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${dlLabel.color}12`, border: `1px solid ${dlLabel.color}22`, borderRadius: 10, padding: '5px 11px' }}>
                  <Calendar size={11} strokeWidth={2} style={{ color: dlLabel.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: dlLabel.color }}>{dlLabel.label}</span>
                </div>
              )}
              {spLabel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${spLabel.color}12`, border: `1px solid ${spLabel.color}22`, borderRadius: 10, padding: '5px 11px' }}>
                  <Users size={11} strokeWidth={2} style={{ color: spLabel.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: spLabel.color }}>{spLabel.label}</span>
                </div>
              )}
              {demand && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '5px 11px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: DIM }}>{demand}</span>
                </div>
              )}
            </div>
          )}

          {/* ── REWARD BREAKDOWN ── */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Trophy size={13} strokeWidth={2} style={{ color: WARN }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '.08em' }}>Reward Breakdown</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <RewardPill
                icon={<DollarSign size={12} strokeWidth={2.5} style={{ color: ACCENT }} />}
                label="Cash" value={`$${cash}`} color={ACCENT} bg={`${ACCENT}08`}
              />
              <RewardPill
                icon={<Star size={12} strokeWidth={2.5} style={{ color: AI_CLR }} />}
                label="XP" value={`+${xp}`} color={AI_CLR} bg={`${AI_CLR}08`}
              />
              {hunt.certificationReward && (
                <RewardPill
                  icon={<Award size={12} strokeWidth={2.5} style={{ color: WARN }} />}
                  label="Cert" value="Certificate" color={WARN} bg={`${WARN}08`}
                />
              )}
              {(hunt.portfolioCredits ?? 0) > 0 && (
                <RewardPill
                  icon={<BookOpen size={12} strokeWidth={2.5} style={{ color: '#a78bfa' }} />}
                  label="Credits" value={`${hunt.portfolioCredits}pt`} color="#a78bfa" bg="rgba(167,139,250,.08)"
                />
              )}
            </div>
          </section>

          {/* ── AI MATCH (if profile) ── */}
          {matchScore != null && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 18, background: `linear-gradient(135deg, ${matchColor}08, ${AI_CLR}05)`, border: `1px solid ${matchColor}18`, display: 'flex', alignItems: 'center', gap: 16 }}>
              <MatchRing score={matchScore} color={matchColor} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Brain size={12} strokeWidth={2} style={{ color: AI_CLR }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: AI_CLR, textTransform: 'uppercase', letterSpacing: '.08em' }}>AI Match Score</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: DIM, lineHeight: 1.5 }}>
                  {matchScore >= 80
                    ? 'Excellent fit with your Impact DNA — highly recommended.'
                    : matchScore >= 65
                    ? 'Good alignment with your skills and causes.'
                    : 'This mission will help you grow into new areas.'}
                </p>
                {profile?.archetype && (
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: FAINT }}>
                    Matched to your <span style={{ color: matchColor, fontWeight: 700 }}>{profile.archetype}</span> archetype
                  </p>
                )}
              </div>
            </motion.section>
          )}

          {/* ── MISSION BRIEF ── */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <FileText size={13} strokeWidth={2} style={{ color: FAINT }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '.08em' }}>Mission Brief</span>
            </div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: DIM }}>
              {hunt.story_context}
            </p>
          </section>

          {/* ── QUICK STATS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { icon: <Clock size={14} strokeWidth={2} style={{ color: DIM }} />,  label: 'Duration',  value: hunt.estimated_time },
              { icon: <Target size={14} strokeWidth={2} style={{ color: diff.color }} />, label: 'Level', value: diff.label },
              { icon: <Briefcase size={14} strokeWidth={2} style={{ color: AI_CLR }} />, label: 'Steps', value: `${hunt.steps.length} tasks` },
            ].map((s) => (
              <div key={s.label} className="liquid-glass" style={{ ...XGLASS, borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
                <p style={{ margin: '0 0 2px', fontSize: 13.5, fontWeight: 800, color: TXT, letterSpacing: '-.01em' }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 9.5, fontWeight: 600, color: FAINT, textTransform: 'uppercase', letterSpacing: '.07em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── LOCATION + TEAM ── */}
          {(hunt.locationType || hunt.teamSize) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {hunt.locationType && (
                <div className="liquid-glass" style={{ flex: 1, ...XGLASS, borderRadius: 14, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={13} strokeWidth={2} style={{ color: ACCENT }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: FAINT, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700 }}>Location</p>
                    <p style={{ margin: 0, fontSize: 12.5, color: TXT, fontWeight: 700, textTransform: 'capitalize' }}>{hunt.locationType}</p>
                  </div>
                </div>
              )}
              {hunt.teamSize && (
                <div className="liquid-glass" style={{ flex: 1, ...XGLASS, borderRadius: 14, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={13} strokeWidth={2} style={{ color: AI_CLR }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 9, color: FAINT, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700 }}>Team Size</p>
                    <p style={{ margin: 0, fontSize: 12.5, color: TXT, fontWeight: 700 }}>{hunt.teamSize}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REQUIRED SKILLS ── */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <TrendingUp size={13} strokeWidth={2} style={{ color: FAINT }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '.08em' }}>Skills You&apos;ll Use</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {skills.map((s, i) => (
                <SkillChip key={s} skill={s} color={i % 3 === 0 ? ACCENT : i % 3 === 1 ? AI_CLR : WARN} />
              ))}
            </div>
          </section>

          {/* ── SDG IMPACT ── */}
          {(hunt.sdgGoals?.length ?? 0) > 0 && (
            <section style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Target size={13} strokeWidth={2} style={{ color: FAINT }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '.08em' }}>UN SDG Alignment</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {(hunt.sdgGoals ?? []).map((g) => <SDGBadge key={g} goal={g} />)}
              </div>
            </section>
          )}

          {/* ── DELIVERABLES ── */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Upload size={13} strokeWidth={2} style={{ color: FAINT }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '.08em' }}>What You Submit</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deliverables.map((d, i) => <Deliverable key={i} text={d} index={i} />)}
            </div>
          </section>

          {/* ── ORGANISATION CARD ── */}
          {(hunt.tenantName || hunt.organizationAbout) && (
            <section style={{ marginBottom: 20 }}>
              <div className="liquid-glass" style={{ ...XGLASS, borderRadius: 20, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  {hunt.tenantLogo ? (
                    <img src={hunt.tenantLogo} alt={hunt.tenantName} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${AI_CLR}18`, border: `1px solid ${AI_CLR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {orgType ? <span style={{ fontSize: 18 }}>{orgType.emoji}</span> : <Building2 size={18} strokeWidth={1.8} style={{ color: AI_CLR }} />}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      {orgType?.label ?? 'Organisation'}
                    </p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: TXT }}>{hunt.tenantName ?? 'X-Hunt Partner'}</p>
                  </div>
                  {hunt.isVerified && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${ACCENT}10`, border: `1px solid ${ACCENT}20`, borderRadius: 999, padding: '3px 10px' }}>
                      <ShieldCheck size={11} strokeWidth={2.5} style={{ color: ACCENT }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT }}>Verified</span>
                    </div>
                  )}
                </div>
                {hunt.organizationAbout && (
                  <p style={{ margin: 0, fontSize: 13, color: DIM, lineHeight: 1.6 }}>{hunt.organizationAbout}</p>
                )}
                {hunt.tenantSlug && (
                  <Link href={`/workspace/${hunt.tenantSlug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12, fontWeight: 700, color: ACCENT, textDecoration: 'none' }}>
                    View organisation <ExternalLink size={11} strokeWidth={2.5} />
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* ── JOURNEY / STEPS ── */}
          <section style={{ marginBottom: 20 }}>
            <button onClick={() => setStepsOpen(!stepsOpen)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={13} strokeWidth={2} style={{ color: FAINT }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: FAINT, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  Your Journey · {hunt.steps.length} Steps
                </span>
              </div>
              {stepsOpen
                ? <ChevronUp size={16} style={{ color: FAINT }} />
                : <ChevronDown size={16} style={{ color: FAINT }} />}
            </button>

            <AnimatePresence>
              {stepsOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', paddingTop: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {hunt.steps.map((step, i) => {
                      const TYPE_CFG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
                        action:        { color: WARN,   bg: `${WARN}0A`,   label: 'Action',        emoji: '⚡' },
                        reflection:    { color: AI_CLR, bg: `${AI_CLR}0A`, label: 'Reflection',    emoji: '💭' },
                        discovery:     { color: ACCENT, bg: `${ACCENT}0A`, label: 'Discovery',     emoji: '🔍' },
                        research:      { color: '#60A5FA', bg: 'rgba(96,165,250,.08)', label: 'Research', emoji: '🔬' },
                        submission:    { color: ACCENT, bg: `${ACCENT}0A`, label: 'Submission',    emoji: '📤' },
                        collaboration: { color: '#a78bfa', bg: 'rgba(167,139,250,.08)', label: 'Collaborate', emoji: '🤝' },
                      };
                      const tc = TYPE_CFG[step.type] ?? TYPE_CFG.action;
                      return (
                        <div key={step.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14, background: tc.bg, border: `1px solid ${tc.color}18` }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `${tc.color}18`, border: `1px solid ${tc.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: tc.color }}>{i + 1}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                              <span style={{ fontSize: 13 }}>{tc.emoji}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, textTransform: 'uppercase', letterSpacing: '.07em' }}>{tc.label}</span>
                            </div>
                            <p style={{ margin: '0 0 6px', fontSize: 13.5, lineHeight: 1.5, color: TXT, fontWeight: 600 }}>{step.instruction}</p>
                            <p style={{ margin: 0, fontSize: 11.5, color: DIM, lineHeight: 1.5 }}>
                              <span style={{ color: FAINT, fontWeight: 700 }}>Done when: </span>{step.success_criteria}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!stepsOpen && (
              <div style={{ display: 'flex', gap: 5, paddingTop: 12 }}>
                {hunt.steps.slice(0, 5).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: `${ACCENT}25` }} />
                ))}
                {hunt.steps.length > 5 && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: FAINT, marginLeft: 4 }}>+{hunt.steps.length - 5}</span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── DISCUSSION TEASER ── */}
          <section style={{ marginBottom: 20 }}>
            <div style={{ ...XGLASS, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: `${AI_CLR}14`, border: `1px solid ${AI_CLR}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare size={16} strokeWidth={2} style={{ color: AI_CLR }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 1px', fontSize: 13, fontWeight: 700, color: TXT }}>Ask Xeno AI</p>
                <p style={{ margin: 0, fontSize: 11.5, color: FAINT }}>Get clarification or tips before you start</p>
              </div>
              <button style={{ fontSize: 11, fontWeight: 700, color: AI_CLR, background: `${AI_CLR}10`, border: `1px solid ${AI_CLR}20`, borderRadius: 999, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>
                Ask
              </button>
            </div>
          </section>

          {/* ── IMPACT DISCLAIMER ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
            <AlertCircle size={12} strokeWidth={2} style={{ color: FAINT, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11, color: FAINT, lineHeight: 1.6 }}>
              Completing this mission earns you XP, portfolio credits, and builds your Impact DNA profile. Cash rewards are processed within 7 days of submission approval.
            </p>
          </div>
        </div>

        {/* ── STICKY CTA ── */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: '12px 20px 28px', background: 'rgba(5,8,22,.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>

            {/* earnings preview */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: FAINT }}>Earn</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: ACCENT }}>${cash}</span>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: FAINT }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: AI_CLR }}>+{xp} XP</span>
              {hunt.certificationReward && (
                <>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: FAINT }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: WARN }}>+ Cert</span>
                </>
              )}
            </div>

            {isCompleted ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 18, background: `${ACCENT}10`, border: `1px solid ${ACCENT}22` }}>
                <CheckCircle2 size={18} strokeWidth={2.5} style={{ color: ACCENT }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: ACCENT }}>Mission Completed</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/active/${hunt.id}`)}
                  style={{ flex: 1, height: 56, borderRadius: 18, border: 'none', cursor: 'pointer', background: ACCENT, color: BG, fontWeight: 900, fontSize: 15.5, boxShadow: `0 0 28px ${ACCENT}40`, fontFamily: 'inherit', letterSpacing: '-.01em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Sparkles size={16} strokeWidth={2.5} />
                  Start Mission
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
