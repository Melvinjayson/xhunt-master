'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Brain, Settings, X, Check, Sparkles,
  Cpu, Gauge, ArrowRight,
} from 'lucide-react';
import { t } from '@/theme/colors';
import type { AIConfig } from '@/lib/aiConfig';
import { saveAIConfig } from '@/lib/aiConfig';

export interface Recommendation {
  id: string; title: string; tags: string[]; estimated_time: string;
  difficulty: string; confidence_pct: number; reason: string; reward?: string;
}

/* ── Agent config panel (embedded) ── */
const REASONING_OPTS = [
  { id: 'fast'     as const, label: 'Fast',       desc: 'Quick answers',           icon: Cpu   },
  { id: 'balanced' as const, label: 'Balanced',   desc: 'Thoughtful analysis',     icon: Gauge },
  { id: 'deep'     as const, label: 'Deep Think', desc: 'Chain-of-thought reason', icon: Brain },
];
const PERSONA_OPTS = [
  { id: 'mentor'     as const, label: 'Mentor',     emoji: '📚' },
  { id: 'coach'      as const, label: 'Coach',      emoji: '💪' },
  { id: 'analyst'    as const, label: 'Analyst',    emoji: '📊' },
  { id: 'strategist' as const, label: 'Strategist', emoji: '🎯' },
];
const FOCUS_AREAS = ['Adventure', 'Fitness', 'Technology', 'Social', 'Creative', 'Learning', 'Finance', 'Nature'];

function AgentConfigPanel({ config, onSave, onClose }: {
  config: AIConfig; onSave: (c: AIConfig) => void; onClose: () => void;
}) {
  const [local, setLocal] = useState<AIConfig>(config);
  const patch = (p: Partial<AIConfig>) => setLocal(prev => ({ ...prev, ...p }));
  const toggleFocus = (area: string) => {
    const key = area.toLowerCase();
    patch({ focusAreas: local.focusAreas.includes(key) ? local.focusAreas.filter(f => f !== key) : [...local.focusAreas, key] });
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
      <div style={{ background: `${t.ai}0A`, borderTop: `1px solid ${t.ai}25`, padding: '16px 18px 18px' }}>
        <p style={{ margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.09em' }}>Reasoning Mode</p>
        <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
          {REASONING_OPTS.map(({ id, label, desc, icon: Icon }) => {
            const active = local.reasoning === id;
            return (
              <button key={id} onClick={() => patch({ reasoning: id })}
                style={{ flex: 1, padding: '9px 6px', borderRadius: 12, background: active ? `${t.ai}18` : 'rgba(255,255,255,.03)', border: `1px solid ${active ? t.ai : 'rgba(255,255,255,.08)'}`, cursor: 'pointer', textAlign: 'center' }}>
                <Icon size={14} strokeWidth={1.8} style={{ color: active ? t.ai : t.txtFaint, display: 'block', margin: '0 auto 4px' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: active ? t.txt : t.txtDim, display: 'block' }}>{label}</span>
                <span style={{ fontSize: 8.5, color: t.txtFaint, display: 'block', lineHeight: 1.3 }}>{desc}</span>
              </button>
            );
          })}
        </div>

        <p style={{ margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.09em' }}>Agent Persona</p>
        <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
          {PERSONA_OPTS.map(({ id, label, emoji }) => {
            const active = local.persona === id;
            return (
              <button key={id} onClick={() => patch({ persona: id })}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 10, background: active ? `${t.accent}10` : 'rgba(255,255,255,.03)', border: `1px solid ${active ? t.accent + '40' : 'rgba(255,255,255,.08)'}`, cursor: 'pointer', textAlign: 'center' }}>
                <span style={{ fontSize: 15, display: 'block', marginBottom: 2 }}>{emoji}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: active ? t.accent : t.txtDim }}>{label}</span>
              </button>
            );
          })}
        </div>

        <p style={{ margin: '0 0 9px', fontSize: 10, fontWeight: 700, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.09em' }}>Focus Areas</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          {FOCUS_AREAS.map(area => {
            const active = local.focusAreas.includes(area.toLowerCase());
            return (
              <button key={area} onClick={() => toggleFocus(area)}
                style={{ padding: '4px 11px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: active ? `${t.accent}14` : 'rgba(255,255,255,.04)', border: `1px solid ${active ? t.accent + '40' : 'rgba(255,255,255,.08)'}`, color: active ? t.accent : t.txtDim, cursor: 'pointer' }}>
                {area}
              </button>
            );
          })}
        </div>

        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: t.txtFaint, textTransform: 'uppercase', letterSpacing: '.09em' }}>Custom Instructions</p>
        <textarea
          value={local.customInstructions}
          onChange={e => patch({ customInstructions: e.target.value })}
          placeholder="Always suggest missions related to…"
          rows={2}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', color: t.txt, fontSize: 12, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => { saveAIConfig(local); onSave(local); onClose(); }}
            style={{ flex: 1, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${t.accent},${t.accent}CC)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Check size={13} strokeWidth={2.5} style={{ color: t.bg }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: t.bg }}>Save Config</span>
          </button>
          <button
            onClick={onClose}
            style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={13} strokeWidth={2} style={{ color: t.txtFaint }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── AI Insight Card ── */
const PERSONA_MAP = { mentor: '📚 Mentor', coach: '💪 Coach', analyst: '📊 Analyst', strategist: '🎯 Strategist' };
const REASON_MAP  = { fast: '⚡ Fast', balanced: '⚖ Balanced', deep: '🔮 Deep Think' };

export function AIInsightCard({ recs, onDismiss, config, onConfigSave }: {
  recs: Recommendation[]; onDismiss: () => void; config: AIConfig; onConfigSave: (c: AIConfig) => void;
}) {
  const [showCfg, setShowCfg] = useState(false);
  const top = recs[0];
  const estimatedEarnings = recs.reduce((a, r) => { const m = r.reward?.match(/\$(\d+)/); return a + (m ? parseInt(m[1]) : 25); }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .5, delay: .3 }}
      style={{ background: 'linear-gradient(135deg,#0A0820 0%,#0E0C2A 100%)', border: `1px solid ${t.ai}38`, borderRadius: 22, overflow: 'hidden', boxShadow: `0 0 48px ${t.ai}14`, position: 'relative' }}
    >
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle,${t.ai}18 0%,transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ padding: '18px 18px 0', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `${t.ai}20`, border: `1px solid ${t.ai}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} strokeWidth={1.8} style={{ color: t.ai }} />
            </div>
            <div style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%', background: t.accent, border: `2px solid ${t.bg}`, animation: 'breathe 2.5s ease-in-out infinite' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: t.txt }}>AI Mission Assistant</p>
            <p style={{ margin: 0, fontSize: 10.5, color: t.ai, fontWeight: 600 }}>6 agents active · {REASON_MAP[config.reasoning]}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowCfg(v => !v)} title="Configure AI"
              style={{ width: 28, height: 28, borderRadius: 8, background: showCfg ? `${t.ai}20` : 'rgba(255,255,255,.05)', border: `1px solid ${showCfg ? t.ai + '40' : 'rgba(255,255,255,.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Settings size={12} strokeWidth={2} style={{ color: showCfg ? t.ai : t.txtFaint }} />
            </button>
            <button onClick={onDismiss}
              style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={11} strokeWidth={2} style={{ color: t.txtFaint }} />
            </button>
          </div>
        </div>

        {/* Config chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: t.ai, background: `${t.ai}10`, border: `1px solid ${t.ai}20`, borderRadius: 999, padding: '2px 8px' }}>{PERSONA_MAP[config.persona]}</span>
          {config.focusAreas.length > 0 && (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: t.accent, background: `${t.accent}10`, border: `1px solid ${t.accent}20`, borderRadius: 999, padding: '2px 8px' }}>{config.focusAreas.slice(0, 2).join(' · ')}</span>
          )}
          {config.reasoning === 'deep' && (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: t.warning, background: `${t.warning}10`, border: `1px solid ${t.warning}20`, borderRadius: 999, padding: '2px 8px' }}>🔮 Extended reasoning</span>
          )}
        </div>

        <p style={{ margin: '0 0 16px', fontSize: 13.5, color: t.txtDim, lineHeight: 1.6 }}>
          I found{' '}
          <span style={{ color: t.txt, fontWeight: 700 }}>{recs.length} mission{recs.length !== 1 ? 's' : ''}</span>{' '}
          matched to your interests.
          {top && ` Top pick: "${top.title.slice(0, 30)}…" with ${top.confidence_pct}% confidence.`}
          {estimatedEarnings > 0 && ` Estimated value: up to $${estimatedEarnings}.`}
        </p>

        <div style={{ paddingBottom: 18 }}>
          <Link href="/explore" style={{ textDecoration: 'none', display: 'block' }}>
            <motion.div whileTap={{ scale: .98 }}
              style={{ height: 44, borderRadius: 12, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: `0 0 24px ${t.accent}40` }}>
              <Sparkles size={14} strokeWidth={2} style={{ color: t.bg }} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: t.bg }}>Show Me</span>
              <ArrowRight size={13} strokeWidth={2.5} style={{ color: t.bg }} />
            </motion.div>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showCfg && <AgentConfigPanel config={config} onSave={onConfigSave} onClose={() => setShowCfg(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
