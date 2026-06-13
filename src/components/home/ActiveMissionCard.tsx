'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp, ShieldCheck, Users, DollarSign, Trophy,
  Layers, Clock, Activity, ArrowRight, PlayCircle,
} from 'lucide-react';
import { t } from '@/theme/colors';
import { tagAccent, tagBg, DIFF_CLR, getMissionImage } from '@/lib/missionHelpers';
import { estimateCashReward, estimateXP, resolveCategory } from '@/lib/missionCategories';
import type { Hunt } from '@/lib/types';

export function ActiveMissionCard({ hunt, stepsCompleted = 0, matchScore }: {
  hunt: Hunt; stepsCompleted?: number; matchScore?: number | null;
}) {
  const accent     = tagAccent(hunt.tags);
  const [bg0]      = tagBg(hunt.tags);
  const totalSteps = hunt.steps?.length ?? 1;
  const progress   = Math.round((stepsCompleted / totalSteps) * 100);
  const stepsLeft  = totalSteps - stepsCompleted;
  const cat        = resolveCategory(hunt.tags, hunt.category);
  const cash       = estimateCashReward(hunt.cashReward, hunt.difficulty, hunt.missionType);
  const xp         = estimateXP(hunt.xpReward, hunt.difficulty, totalSteps);
  const diffColor  = DIFF_CLR[hunt.difficulty] ?? t.txtDim;
  const R = 22;
  const circ = 2 * Math.PI * R;
  const dash = circ - (progress / 100) * circ;
  const heroImg = getMissionImage(hunt.tags, 900, 380);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.22 }}
      style={{ borderRadius: 24, overflow: 'hidden', border: `1px solid ${accent}22`, boxShadow: `0 0 60px ${accent}0C` }}
    >
      {/* Hero image */}
      <div style={{ position: 'relative', height: 150, overflow: 'hidden', background: bg0 }}>
        {!imgFailed && (
          <Image src={heroImg} alt="" fill unoptimized
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            onError={() => setImgFailed(true)} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg,rgba(5,8,22,.25) 0%,rgba(5,8,22,.65) 55%,${bg0} 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${accent}10 0%,transparent 55%)` }} />

        <div style={{ position: 'absolute', inset: 0, padding: '14px 18px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }} />
              <span style={{ fontSize: 9.5, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '.1em' }}>Active Mission</span>
              {hunt.isVerified && <ShieldCheck size={11} strokeWidth={2.5} style={{ color: accent }} />}
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: t.txt, lineHeight: 1.3, letterSpacing: '-0.02em', paddingRight: 12, textShadow: '0 1px 10px rgba(0,0,0,.7)' }}>{hunt.title}</p>
            {hunt.tenantName && (
              <p style={{ margin: '4px 0 0', fontSize: 10.5, color: t.txtDim, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={10} strokeWidth={2} />{hunt.tenantName}
              </p>
            )}
          </div>
          <Link href={`/missions/${hunt.id}`} style={{ textDecoration: 'none', flexShrink: 0, zIndex: 1 }}>
            <motion.div whileTap={{ scale: 0.92 }} style={{ position: 'relative', width: 56, height: 56 }}>
              <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="3.5" />
                <circle cx="28" cy="28" r={R} fill="none" stroke={accent} strokeWidth="3.5"
                  strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset .8s ease', filter: `drop-shadow(0 0 4px ${accent}80)` }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {progress > 0
                  ? <span style={{ fontSize: 11, fontWeight: 900, color: accent }}>{progress}%</span>
                  : <PlayCircle size={18} strokeWidth={2} style={{ color: accent }} />
                }
              </div>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: t.card, padding: '14px 18px 18px' }}>
        {/* Econometrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { icon: DollarSign, label: 'Earnings', val: cash > 0 ? `$${cash}` : (hunt.reward.match(/\$\d+/)?.[0] ?? '—'), clr: t.accent },
            { icon: Trophy,     label: 'XP',       val: `+${xp}`,                                                            clr: t.ai   },
            { icon: Layers,     label: 'Steps',    val: null,                                                                 clr: t.warning },
          ].map(({ icon: Icon, label, val, clr }, i) => (
            <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: '9px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <Icon size={9} strokeWidth={2.5} style={{ color: clr }} />
                <span style={{ fontSize: 8.5, fontWeight: 700, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
              </div>
              {i === 2
                ? <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: t.txt }}>{stepsCompleted}<span style={{ fontSize: 9, color: t.txtFaint }}>/{totalSteps}</span></p>
                : <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: clr, letterSpacing: '-0.03em' }}>{val}</p>
              }
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: t.txtFaint }}>
              {stepsLeft > 0 ? `${stepsLeft} step${stepsLeft !== 1 ? 's' : ''} remaining` : 'Ready to complete!'}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: accent }}>{progress}% done</span>
          </div>
          <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${progress}%` }}
              transition={{ duration: .9, delay: .4, ease: 'easeOut' }}
              style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${accent},${accent}BB)`, boxShadow: `0 0 10px ${accent}70` }}
            />
          </div>
        </div>

        {/* Meta tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 999, padding: '3px 9px' }}>
            <Clock size={9} strokeWidth={2.5} style={{ color: t.txtDim }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: t.txtDim }}>{hunt.estimated_time}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${diffColor}10`, border: `1px solid ${diffColor}28`, borderRadius: 999, padding: '3px 9px' }}>
            <Activity size={9} strokeWidth={2.5} style={{ color: diffColor }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: diffColor, textTransform: 'capitalize' }}>{hunt.difficulty}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${cat.color}10`, border: `1px solid ${cat.color}28`, borderRadius: 999, padding: '3px 9px' }}>
            <span style={{ fontSize: 9 }}>{cat.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: cat.color }}>{cat.label}</span>
          </div>
          {matchScore != null && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: matchScore >= 80 ? `${t.accent}12` : `${t.warning}12`, border: `1px solid ${matchScore >= 80 ? t.accent : t.warning}28`, borderRadius: 999, padding: '3px 9px' }}>
              <TrendingUp size={9} strokeWidth={2.5} style={{ color: matchScore >= 80 ? t.accent : t.warning }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: matchScore >= 80 ? t.accent : t.warning }}>{matchScore}% match</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link href={`/missions/${hunt.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <motion.div
            whileTap={{ scale: .98 }}
            style={{ height: 50, borderRadius: 14, background: `linear-gradient(135deg,${accent},${accent}CC)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 28px ${accent}40` }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, color: t.bg }}>
              {stepsCompleted > 0 ? 'Continue Mission' : 'Start Mission'}
            </span>
            <ArrowRight size={16} strokeWidth={2.8} style={{ color: t.bg }} />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}
