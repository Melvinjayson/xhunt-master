'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { LIQUID_GLASS_STYLE } from '@/components/LiquidGlass';
import { t } from '@/theme/colors';
import { tagAccent, tagBg, DIFF_CLR, getMissionImage } from '@/lib/missionHelpers';
import { Spark } from '@/components/home/MMSCard';
import type { Hunt } from '@/lib/types';

export function MissionCard({ hunt, index, isCompleted, matchScore }: {
  hunt: Hunt; index: number; isCompleted?: boolean; matchScore?: number | null;
}) {
  const accent       = tagAccent(hunt.tags);
  const diffColor    = DIFF_CLR[hunt.difficulty] ?? t.txtDim;
  const rewardMatch  = hunt.reward.match(/\$(\d+[\d,]*)/);
  const rewardLabel  = rewardMatch ? rewardMatch[0] : hunt.reward.split('+')[0].trim();
  const thumbImg     = getMissionImage(hunt.tags, 700, 300);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
    >
      <Link href={`/missions/${hunt.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div className="liquid-glass" style={{ ...LIQUID_GLASS_STYLE, borderRadius: 20, overflow: 'hidden', borderColor: isCompleted ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.08)' }}>

          {/* Thumbnail */}
          <div style={{ position: 'relative', height: 115, overflow: 'hidden', background: tagBg(hunt.tags)[0] }}>
            {!imgFailed && (
              <Image src={thumbImg} alt="" fill unoptimized
                style={{ objectFit: 'cover', objectPosition: 'center', opacity: isCompleted ? .35 : .82 }}
                onError={() => setImgFailed(true)} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 0%,rgba(10,18,38,.88) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent},${accent}00)` }} />

            {/* Badges */}
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              {isCompleted
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 700, color: t.accent, background: 'rgba(5,8,22,.72)', border: `1px solid ${t.accent}40`, borderRadius: 999, padding: '3px 9px', backdropFilter: 'blur(8px)' }}>
                    <CheckCircle2 size={9} strokeWidth={2.5} />Completed
                  </span>
                : matchScore != null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9.5, fontWeight: 800, color: matchScore >= 80 ? t.accent : t.warning, background: 'rgba(5,8,22,.72)', border: `1px solid ${matchScore >= 80 ? t.accent : t.warning}40`, borderRadius: 999, padding: '3px 9px', backdropFilter: 'blur(8px)' }}>
                    <TrendingUp size={9} strokeWidth={2.5} />{matchScore}% match
                  </span>
                )
              }
            </div>
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: diffColor, background: 'rgba(5,8,22,.72)', border: `1px solid ${diffColor}40`, borderRadius: 999, padding: '3px 9px', backdropFilter: 'blur(8px)', textTransform: 'capitalize' }}>
                {hunt.difficulty}
              </span>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '12px 16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: isCompleted ? t.txtDim : t.txt, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hunt.title}
                </p>
                <p style={{ margin: '2px 0 8px', fontSize: 10.5, color: t.txtFaint }}>({hunt.tags[0] ?? 'mission'})</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={10} strokeWidth={2} style={{ color: t.txtFaint }} />
                  <span style={{ fontSize: 10.5, color: t.txtFaint }}>{hunt.estimated_time}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: accent }}>{hunt.tags[0]}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: isCompleted ? t.txtFaint : t.txt, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {rewardLabel}
                </p>
                <div style={{ opacity: isCompleted ? .25 : .85 }}>
                  <Spark i={index} color={index % 2 === 0 ? t.accent : t.warning} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
