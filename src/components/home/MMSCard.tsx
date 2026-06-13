'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { LIQUID_GLASS_STYLE } from '@/components/LiquidGlass';
import { t } from '@/theme/colors';

/* ── Animated counter ── */
export function Counter({ to, dur = 900, prefix = '', suffix = '' }: {
  to: number; dur?: number; prefix?: string; suffix?: string;
}) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let n = 0;
    const inc = to / (dur / 16);
    const timer = setInterval(() => {
      n += inc;
      if (n >= to) { setVal(to); clearInterval(timer); }
      else setVal(n);
    }, 16);
    return () => clearInterval(timer);
  }, [to, dur]);
  return <>{prefix}{Math.floor(val).toLocaleString()}{suffix}</>;
}

/* ── Sparkline ── */
const SPARKS = [
  '0,24 16,18 32,21 48,11 64,15 80,6 96,3',
  '0,5 16,9 32,7 48,15 64,12 80,19 96,23',
  '0,20 16,14 32,17 48,7 64,12 80,4 96,2',
  '0,4 16,8 32,5 48,14 56,10 72,18 88,15 96,22',
];
export function Spark({ i = 0, color = t.accent }: { i?: number; color?: string }) {
  return (
    <svg width="72" height="28" viewBox="0 0 96 28" fill="none">
      <polyline points={SPARKS[i % SPARKS.length]} stroke={color} strokeWidth="2"
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Mission Momentum Score card ── */
export function MMSCard({ score, delta, tier, tierColor }: {
  score: number; delta: number; tier: string; tierColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="liquid-glass"
      style={{ ...LIQUID_GLASS_STYLE, borderRadius: 20, padding: '18px 20px', position: 'relative', overflow: 'hidden', flex: '1 1 0' }}
    >
      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle,${t.accent}18 0%,transparent 70%)`, pointerEvents: 'none' }} />
      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.08em' }}>Mission Momentum</p>
      <p style={{ margin: '0 0 6px', fontSize: 36, fontWeight: 900, color: t.txt, lineHeight: 1, letterSpacing: '-0.04em' }}>
        <Counter to={score} dur={1000} />
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: `${t.accent}14`, border: `1px solid ${t.accent}22`, borderRadius: 999, padding: '2px 8px' }}>
          <TrendingUp size={9} strokeWidth={2.5} style={{ color: t.accent }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: t.accent }}>+{delta} this week</span>
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: tierColor, boxShadow: `0 0 8px ${tierColor}` }} />
        <span style={{ fontSize: 10.5, fontWeight: 600, color: tierColor }}>{tier}</span>
      </div>
      <div style={{ position: 'absolute', right: 12, bottom: 14, opacity: 0.7 }}>
        <Spark i={0} color={t.accent} />
      </div>
    </motion.div>
  );
}

/* ── Stat card ── */
export function StatCard({ label, value, sub, icon: Icon, accent, index }: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  accent: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 + index * 0.07 }}
      className="liquid-glass"
      style={{ ...LIQUID_GLASS_STYLE, borderRadius: 18, padding: '14px', flex: '1 1 0', minWidth: 0, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle,${accent}18 0%,transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ width: 28, height: 28, borderRadius: 9, background: `${accent}16`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon size={13} strokeWidth={2} style={{ color: accent }} />
      </div>
      <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 900, color: t.txt, lineHeight: 1, letterSpacing: '-0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {typeof value === 'number' ? <Counter to={value} /> : value}
      </p>
      <p style={{ margin: '0 0 6px', fontSize: 10, color: t.txtFaint, fontWeight: 500 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <TrendingUp size={8} strokeWidth={2.5} style={{ color: accent }} />
        <span style={{ fontSize: 9.5, fontWeight: 700, color: accent }}>{sub}</span>
      </div>
    </motion.div>
  );
}
