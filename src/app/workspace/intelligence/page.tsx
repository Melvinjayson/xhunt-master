'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, Play, RefreshCw, ChevronRight, Sparkles,
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Bot
} from 'lucide-react';
import { cn } from '@/lib/cn';

const INTELLIGENCE_FUNCTIONS = ['personal', 'community', 'marketplace', 'impact'] as const;
type IntelligenceFunction = typeof INTELLIGENCE_FUNCTIONS[number];

const FN_META: Record<IntelligenceFunction, { label: string; description: string; color: string; examples: string[] }> = {
  personal: {
    label: 'Personal Intelligence',
    description: 'Personalized discovery, skill-matched opportunities, and growth path recommendations',
    color: 'accent',
    examples: [
      'Find missions that match my skill level and interests',
      'Suggest learning paths to improve my trust score',
      'Show me opportunities aligned with my contribution history',
    ],
  },
  community: {
    label: 'Community Intelligence',
    description: 'Community health signals, cohesion patterns, and social capital analysis',
    color: '#6D5DFD',
    examples: [
      'What is the health of my community this week?',
      'Identify collaboration opportunities with peers',
      'Analyze contribution diversity in our group',
    ],
  },
  marketplace: {
    label: 'Marketplace Intelligence',
    description: 'Fair exchange recommendations, value distribution analysis, and opportunity matching',
    color: '#fbbf24',
    examples: [
      'Are our reward structures creating fair incentives?',
      'Identify underserved mission categories',
      'Optimize reward distribution for maximum impact',
    ],
  },
  impact: {
    label: 'Impact Intelligence',
    description: 'Impact measurement, sustainability alignment, and double materiality assessment',
    color: '#34d399',
    examples: [
      'Measure the real-world impact of completed missions',
      'Assess alignment with UN SDGs',
      'Identify sustainability risks in our mission portfolio',
    ],
  },
};

interface Agent {
  agent_id: string;
  name: string;
  category: string;
  purpose: string;
  is_active: boolean;
}

export default function WorkspaceIntelligencePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedFn, setSelectedFn] = useState<IntelligenceFunction>('personal');
  const [objective, setObjective] = useState('');
  const [result, setResult] = useState<{ thinking?: string; content?: string; constitutional?: { verdict: string; score: number } } | null>(null);
  const [invoking, setInvoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/xil?view=registry')
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []));
  }, []);

  async function handleInvoke() {
    if (!objective.trim()) return;
    setInvoking(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/xil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intelligenceFunction: selectedFn, objective }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Intelligence request failed');
      } else {
        setResult(data);
      }
    } catch {
      setError('Failed to connect to XIL');
    }
    setInvoking(false);
  }

  const meta = FN_META[selectedFn as IntelligenceFunction];
  const activeAgents = agents.filter((a: Agent) => a.is_active);
  const visibleCategories = ['participant_intelligence', 'experience_intelligence', 'community_intelligence', 'marketplace_intelligence', 'sustainability'];
  const displayAgents = activeAgents.filter((a: Agent) => visibleCategories.includes(a.category)).slice(0, 6);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#6D5DFD]/15 border border-[#6D5DFD]/25 flex items-center justify-center">
            <Cpu size={17} className="text-[#A99FFE]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[#F0F4FF] leading-tight">XIL Hub</h1>
            <p className="text-[11px] text-[#4A5578]">X-Hunt Intelligence Layer</p>
          </div>
        </div>
        <p className="text-[#8B9CC0] text-[13px]">
          Constitutional AI intelligence that helps you flourish — not just engage
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: function selector + invoke */}
        <div className="xl:col-span-2 space-y-5">
          {/* Function picker */}
          <div>
            <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-3">Intelligence Function</p>
            <div className="grid grid-cols-2 gap-3">
              {INTELLIGENCE_FUNCTIONS.map((fn) => {
                const m = FN_META[fn];
                const active = selectedFn === fn;
                return (
                  <button
                    key={fn}
                    onClick={() => setSelectedFn(fn)}
                    className={cn(
                      'text-left p-4 rounded-2xl border transition-all',
                      active
                        ? 'bg-accent/10 border-accent/30'
                        : 'bg-[#07101F] border-[#0F1D35] hover:border-[#1A2E50] hover:bg-[#0A1226]'
                    )}
                  >
                    <p className={cn('text-[13px] font-bold mb-1', active ? 'text-accent' : 'text-[#F0F4FF]')}>
                      {m.label}
                    </p>
                    <p className="text-[11px] text-[#4A5578] leading-relaxed">{m.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Objective input */}
          <div>
            <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-2">Your Question or Objective</p>
            <div className="relative">
              <textarea
                value={objective}
                onChange={(e: { target: { value: string } }) => setObjective(e.target.value)}
                placeholder={`e.g. "${meta.examples[0]}"`}
                rows={3}
                className="w-full bg-[#07101F] border border-[#0F1D35] rounded-xl px-4 py-3 text-[#F0F4FF] placeholder-[#2A3550] text-[13px] focus:outline-none focus:border-accent/50 resize-none transition-colors"
                onKeyDown={(e: { key: string; metaKey: boolean; ctrlKey: boolean }) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleInvoke();
                }}
              />
              <p className="absolute bottom-3 right-3 text-[10px] text-[#2A3550]">⌘↵ to run</p>
            </div>
          </div>

          {/* Example prompts */}
          <div>
            <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-2">Example Objectives</p>
            <div className="flex flex-col gap-1.5">
              {meta.examples.map((ex: string) => (
                <button
                  key={ex}
                  onClick={() => setObjective(ex)}
                  className="flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-[#0A1226] transition-colors group"
                >
                  <ChevronRight size={12} className="text-[#4A5578] group-hover:text-accent transition-colors flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-[12px] text-[#8B9CC0] group-hover:text-[#F0F4FF] transition-colors">{ex}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleInvoke}
            disabled={invoking || !objective.trim()}
            className="flex items-center gap-2 h-11 px-6 bg-accent text-[#060a0e] rounded-xl font-bold text-[13px] disabled:opacity-50 shadow-[0_4px_20px_rgba(34,255,170,0.2)] transition-opacity w-full justify-center"
          >
            {invoking ? (
              <><RefreshCw size={14} className="animate-spin" /> Consulting Intelligence Layer…</>
            ) : (
              <><Sparkles size={14} strokeWidth={2.5} /> Ask XIL</>
            )}
          </button>

          {/* Result */}
          {(result || error) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#07101F] border border-[#0F1D35] rounded-2xl overflow-hidden"
            >
              {/* Constitutional verdict */}
              {result?.constitutional && (
                <div className={cn(
                  'flex items-center gap-2 px-4 py-2.5 border-b text-[12px] font-medium',
                  result.constitutional.verdict === 'approved'
                    ? 'bg-accent/5 border-accent/15 text-accent'
                    : result.constitutional.verdict === 'rejected'
                    ? 'bg-[#ff5252]/5 border-[#ff5252]/15 text-[#ff5252]'
                    : 'bg-[#fbbf24]/5 border-[#fbbf24]/15 text-[#fbbf24]'
                )}>
                  {result.constitutional.verdict === 'approved' ? (
                    <CheckCircle2 size={13} strokeWidth={2} />
                  ) : result.constitutional.verdict === 'rejected' ? (
                    <XCircle size={13} strokeWidth={2} />
                  ) : (
                    <AlertTriangle size={13} strokeWidth={2} />
                  )}
                  Constitutional check: {result.constitutional.verdict} (score {result.constitutional.score}/7)
                </div>
              )}

              {error ? (
                <div className="p-5 flex items-start gap-2">
                  <XCircle size={14} className="text-[#ff5252] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-[13px] text-[#ff5252]">{error}</p>
                </div>
              ) : result?.content ? (
                <div className="p-5">
                  <p className="text-[13px] text-[#8B9CC0] leading-relaxed whitespace-pre-wrap">{result.content}</p>
                </div>
              ) : (
                <div className="p-5">
                  <pre className="text-[11px] text-[#8B9CC0] font-mono whitespace-pre-wrap overflow-auto max-h-64">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right: active agents */}
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider">Active Agents ({activeAgents.length})</p>
          {displayAgents.length === 0 ? (
            <div className="py-8 text-center bg-[#07101F] border border-[#0F1D35] rounded-2xl">
              <Bot size={28} className="text-[#2A3550] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[#4A5578] text-sm">No agents active</p>
            </div>
          ) : (
            displayAgents.map((agent: Agent) => (
              <div key={agent.agent_id} className="bg-[#07101F] border border-[#0F1D35] rounded-xl p-4 hover:border-[#1A2E50] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  <p className="text-[13px] font-semibold text-[#F0F4FF]">{agent.name}</p>
                </div>
                <p className="text-[11px] text-[#4A5578] leading-relaxed line-clamp-2">{agent.purpose}</p>
              </div>
            ))
          )}

          {/* Constitutional principles */}
          <div className="bg-[#07101F] border border-[#0F1D35] rounded-2xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={13} className="text-[#A99FFE]" strokeWidth={1.8} />
              <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider">Constitutional AI</p>
            </div>
            <div className="space-y-2">
              {[
                'Human agency always takes precedence',
                'Engage for value, not engagement itself',
                'Fairness maximizes opportunity',
                'Trust is our most valuable asset',
              ].map((p) => (
                <div key={p} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#4A5578] flex-shrink-0 mt-1.5" />
                  <p className="text-[11px] text-[#4A5578] leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
