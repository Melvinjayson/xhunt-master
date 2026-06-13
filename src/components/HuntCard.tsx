'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Zap, Trophy, ShieldCheck, Building2, ArrowUpRight } from 'lucide-react';
import { getTagEmoji } from '@/lib/mockHunts';
import type { Hunt } from '@/lib/types';

interface HuntCardProps { hunt: Hunt; isCompleted?: boolean; }

const DIFF = {
  easy:   { label: 'Easy',   color: '#22FFAA', bg: 'rgba(34,255,170,.1)'  },
  medium: { label: 'Medium', color: '#FFB84D', bg: 'rgba(255,184,77,.1)'  },
  hard:   { label: 'Hard',   color: '#FF5C7A', bg: 'rgba(255,92,122,.1)'  },
} as const;

export default function HuntCard({ hunt, isCompleted = false }: HuntCardProps) {
  const emoji = getTagEmoji(hunt.tags);
  const diff  = DIFF[hunt.difficulty] ?? DIFF.easy;

  return (
    <motion.div whileTap={{ scale: 0.985 }} transition={{ duration: 0.1 }}>
      <Link href={`/hunt/${hunt.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 40px rgba(34,255,170,0.04)',
          borderRadius: 22, overflow: 'hidden',
          opacity: isCompleted ? 0.6 : 1,
        }}>
          {/* accent bar */}
          <div style={{ height: 2, background: isCompleted ? 'linear-gradient(90deg,#00E696,#22FFAA)' : 'linear-gradient(90deg,#22FFAA,rgba(34,255,170,0))' }} />

          <div style={{ padding: '14px 16px 0' }}>
            {/* title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: 'rgba(34,255,170,.1)', border: '1px solid rgba(34,255,170,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isCompleted && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#22FFAA', background: 'rgba(34,255,170,.1)', padding: '2px 8px', borderRadius: 999, marginBottom: 4 }}>
                    ✓ Completed
                  </div>
                )}
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: '#F0F4FF', letterSpacing: '-.01em' }}>
                  {hunt.title}
                </h3>
              </div>
              <ArrowUpRight size={14} strokeWidth={2} style={{ color: '#4A5578', flexShrink: 0, marginTop: 2 }} />
            </div>

            <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.5, color: '#8B9CC0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {hunt.story_context}
            </p>

            {/* tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {hunt.tags.slice(0, 3).map((tag) => (
                <span key={tag} style={{ fontSize: 10.5, fontWeight: 500, color: '#8B9CC0', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', padding: '2px 10px', borderRadius: 999 }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* brand row */}
            {(hunt.tenantName || hunt.isVerified) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {hunt.tenantName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {hunt.tenantLogo
                      ? <img src={hunt.tenantLogo} alt={hunt.tenantName} style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover' }} />
                      : <Building2 size={12} strokeWidth={2} style={{ color: '#4A5578' }} />}
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#4A5578' }}>{hunt.tenantName}</span>
                  </div>
                )}
                {hunt.isVerified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={11} strokeWidth={2.5} style={{ color: '#22FFAA' }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#22FFAA', letterSpacing: '.04em', textTransform: 'uppercase' }}>Verified</span>
                  </div>
                )}
              </div>
            )}

            {/* stats bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} strokeWidth={2} style={{ color: '#4A5578' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#8B9CC0' }}>{hunt.estimated_time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: diff.bg }}>
                <Zap size={10} strokeWidth={2.5} style={{ color: diff.color }} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: diff.color }}>{diff.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
                <Trophy size={12} strokeWidth={2} style={{ color: '#22FFAA' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#22FFAA', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hunt.reward.split('+')[0].trim()}
                </span>
              </div>
            </div>
          </div>

          {!isCompleted ? (
            <div style={{ padding: '12px 16px 16px' }}>
              <div style={{ width: '100%', height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#22FFAA', boxShadow: '0 0 24px rgba(34,255,170,.35)', color: '#050816', fontSize: 14, fontWeight: 800 }}>
                Start Mission
              </div>
            </div>
          ) : <div style={{ height: 16 }} />}
        </div>
      </Link>
    </motion.div>
  );
}
