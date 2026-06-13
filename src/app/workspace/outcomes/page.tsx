'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, CheckCircle2, Award, BarChart3, Users, ArrowUpRight,
  Search, FileCheck, Sparkles, ChevronRight, RefreshCw, Bot,
  Globe, Target, AlertTriangle, ShieldCheck, Flame, Zap, Activity
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { CATEGORY_MAP, SDG_META } from '@/lib/missionCategories';
import type { DbOutcomeValidation, DbMissionScore } from '@/lib/supabase/types';

/* ── Types ───────────────────────────────────────────────────────────────── */

type MissionHealth = 'healthy' | 'at-risk' | 'critical' | 'inactive';

interface MissionRow {
  id: string;
  title: string;
  tags: string[];
  status: string;
  difficulty: string;
  stepCount: number;
  completions: number;
  participants: number;
  completionRate: number;
  health: MissionHealth;
  sdgs: number[];
  score?: { mei: number; completion_score: number; engagement_score: number; retention_score: number; outcome_score: number };
}

interface CategoryContrib {
  catId: string;
  count: number;
  label: string;
  emoji: string;
  color: string;
  sdgs: number[];
}

interface Summary {
  totalMissions: number;
  avgMei: number;
  totalParticipants: number;
  totalCompletions: number;
  overallCompletionRate: number;
  sdgReach: number;
  topCategories: CategoryContrib[];
}

/* ── Constants ───────────────────────────────────────────────────────────── */

const HEALTH_CONFIG: Record<MissionHealth, { label: string; color: string; bg: string; border: string; dot: string; glow: string }> = {
  healthy:  { label: 'Healthy',  color: 'text-[#22FFAA]', bg: 'bg-[#22FFAA]/10', border: 'border-[#22FFAA]/20', dot: 'bg-[#22FFAA]', glow: '#22FFAA' },
  'at-risk':{ label: 'At Risk',  color: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10', border: 'border-[#FFB84D]/20', dot: 'bg-[#FFB84D]', glow: '#FFB84D' },
  critical: { label: 'Critical', color: 'text-[#FF5C7A]', bg: 'bg-[#FF5C7A]/10', border: 'border-[#FF5C7A]/20', dot: 'bg-[#FF5C7A]', glow: '#FF5C7A' },
  inactive: { label: 'Inactive', color: 'text-[#4A5578]', bg: 'bg-[#4A5578]/10', border: 'border-[#4A5578]/20', dot: 'bg-[#4A5578]', glow: '#4A5578' },
};

const VALIDATION_STATUS = {
  pending:           { label: 'Pending',       color: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10' },
  under_review:      { label: 'Under Review',  color: 'text-[#6D5DFD]', bg: 'bg-[#6D5DFD]/10' },
  approved:          { label: 'Approved',      color: 'text-[#22FFAA]', bg: 'bg-[#22FFAA]/10' },
  rejected:          { label: 'Rejected',      color: 'text-[#FF5C7A]', bg: 'bg-[#FF5C7A]/10' },
  requires_evidence: { label: 'Needs Evidence',color: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10' },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-[#0D1530] animate-pulse rounded-lg', className)} />;
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function OutcomesPage() {
  const [missions, setMissions]         = useState<MissionRow[]>([]);
  const [summary, setSummary]           = useState<Summary | null>(null);
  const [validations, setValidations]   = useState<DbOutcomeValidation[]>([]);
  const [scores, setScores]             = useState<DbMissionScore[]>([]);
  const [rewardConversion, setRewConv]  = useState(0);
  const [loading, setLoading]           = useState(true);
  const [narrative, setNarrative]       = useState('');
  const [generating, setGenerating]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [missionSearch, setSearch]      = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) return;

      const [intelRes, validationRes, scoresRes, rewardRes] = await Promise.all([
        fetch('/api/outcomes/intelligence'),
        supabase.from('outcome_validations').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }).limit(50),
        supabase.from('mission_scores').select('*').eq('tenant_id', profile.tenant_id),
        supabase.from('reward_events').select('id, redeemed').eq('tenant_id', profile.tenant_id),
      ]);

      if (intelRes.ok) {
        const intel = await intelRes.json() as { missions: MissionRow[]; summary: Summary };
        setMissions(intel.missions);
        setSummary(intel.summary);
      }

      setValidations(validationRes.data ?? []);
      setScores(scoresRes.data ?? []);

      const rewards = rewardRes.data ?? [];
      const redeemed = rewards.filter((r: { redeemed: boolean }) => r.redeemed).length;
      setRewConv(rewards.length > 0 ? Math.round((redeemed / rewards.length) * 100) : 0);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function generateNarrative() {
    if (!summary) return;
    setGenerating(true);
    setNarrative('');
    try {
      const res = await fetch('/api/agents/behavioral-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: `Organisation Outcome Report: ${summary.totalMissions} missions active. Average MEI: ${summary.avgMei}. Total participants: ${summary.totalParticipants}. Completion rate: ${summary.overallCompletionRate}%. SDG goals reached: ${summary.sdgReach}. Top impact areas: ${summary.topCategories.slice(0, 3).map((c) => c.label).join(', ')}. Healthy missions: ${missions.filter((m) => m.health === 'healthy').length}. At-risk: ${missions.filter((m) => m.health === 'at-risk').length}. Critical: ${missions.filter((m) => m.health === 'critical').length}.`,
        }),
      });
      const json = await res.json() as { content?: string; message?: string };
      setNarrative((json.content ?? json.message ?? '').slice(0, 600) || 'Your missions are generating meaningful impact across multiple SDG categories. Continue scaling active missions to increase reach.');
    } catch {
      setNarrative('Your missions are generating meaningful impact. Review the MEI breakdown and SDG contributions above to identify growth opportunities.');
    }
    setGenerating(false);
  }

  const filtered = validations.filter((v) => statusFilter === 'all' || v.status === statusFilter);
  const filteredMissions = missions.filter((m) => !missionSearch || m.title.toLowerCase().includes(missionSearch.toLowerCase()));

  const outcomeHealth = summary
    ? Math.round(summary.overallCompletionRate * 0.4 + (summary.avgMei > 0 ? summary.avgMei * 0.4 : 0) + Math.min(summary.sdgReach * 3, 20))
    : 0;

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6D5DFD]/10 border border-[#6D5DFD]/20 flex items-center justify-center">
            <TrendingUp size={18} className="text-[#6D5DFD]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#F0F4FF]">Outcome Intelligence</h1>
            <p className="text-[#4A5578] text-[12px]">{summary?.totalMissions ?? 0} missions · {summary?.sdgReach ?? 0} SDG goals · {summary?.totalParticipants ?? 0} participants</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/outcomes/validation">
            <button className="flex items-center gap-2 h-9 px-4 bg-[#0A1226] border border-[#162440] text-[#F0F4FF] rounded-xl font-medium text-[13px] hover:border-[#6D5DFD]/40 transition-colors">
              <FileCheck size={14} strokeWidth={2} />
              Validation Queue
              {validations.filter((v) => v.status === 'pending').length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FFB84D] text-[#060a0e] text-[10px] font-bold flex items-center justify-center">
                  {validations.filter((v) => v.status === 'pending').length}
                </span>
              )}
            </button>
          </Link>
          <button
            onClick={generateNarrative}
            disabled={generating}
            className="flex items-center gap-2 h-9 px-4 bg-[#6D5DFD]/10 border border-[#6D5DFD]/25 text-[#A99FFE] rounded-xl font-medium text-[13px] hover:bg-[#6D5DFD]/15 transition-colors disabled:opacity-60"
          >
            {generating
              ? <><RefreshCw size={13} strokeWidth={2} className="animate-spin" /> Generating…</>
              : <><Sparkles size={13} strokeWidth={2} /> Impact Report</>}
          </button>
        </div>
      </div>

      {/* ── AI Narrative ── */}
      <AnimatePresence>
        {narrative && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-[#0E0C2A] to-[#0A1226] border border-[#6D5DFD]/22 rounded-2xl p-5 flex gap-4"
          >
            <div className="w-9 h-9 rounded-xl bg-[#6D5DFD]/15 border border-[#6D5DFD]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot size={16} className="text-[#A99FFE]" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#6D5DFD] uppercase tracking-wider mb-2">AI Impact Analysis</p>
              <p className="text-[13px] text-[#C4CADF] leading-relaxed">{narrative}</p>
            </div>
            <button onClick={() => setNarrative('')} className="text-[#4A5578] hover:text-[#8B9CC0] text-[11px] flex-shrink-0 mt-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {[
          { label: 'Active Missions',     value: summary?.totalMissions ?? 0,           icon: Target,      color: 'text-[#22FFAA]', bg: 'bg-[#22FFAA]/8',  suffix: '' },
          { label: 'Avg MEI Score',        value: summary?.avgMei ?? 0,                  icon: BarChart3,   color: 'text-[#6D5DFD]', bg: 'bg-[#6D5DFD]/10', suffix: '' },
          { label: 'Completion Rate',      value: summary?.overallCompletionRate ?? 0,   icon: CheckCircle2,color: 'text-[#22FFAA]', bg: 'bg-[#22FFAA]/8',  suffix: '%' },
          { label: 'SDG Goals Reached',    value: summary?.sdgReach ?? 0,               icon: Globe,       color: 'text-[#2DD4BF]', bg: 'bg-[#2DD4BF]/10', suffix: '' },
          { label: 'Total Participants',   value: summary?.totalParticipants ?? 0,       icon: Users,       color: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10', suffix: '' },
          { label: 'Reward Conversion',    value: rewardConversion,                      icon: Award,       color: 'text-[#F0F4FF]', bg: 'bg-[#0D1530]',    suffix: '%' },
        ].map(({ label, value, icon: Icon, color, bg, suffix }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-4 col-span-1"
          >
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', bg)}>
              <Icon size={15} className={color} strokeWidth={1.8} />
            </div>
            <p className={cn('text-[22px] font-bold tabular-nums leading-none mb-0.5', color)}>
              {value.toLocaleString()}{suffix}
            </p>
            <p className="text-[#4A5578] text-[11px] font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Mission Leaderboard + SDG Grid ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Mission Effectiveness Leaderboard */}
        <div className="col-span-2 bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0F1D35]">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#22FFAA]" strokeWidth={2} />
              <p className="text-[13px] font-bold text-[#F0F4FF]">Mission Effectiveness Index</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#22FFAA] bg-[#22FFAA]/10 px-2.5 py-1 rounded-full">
                Avg {summary?.avgMei ?? 0}
              </span>
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4A5578]" />
                <input
                  value={missionSearch}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter missions…"
                  className="h-7 pl-7 pr-2.5 w-36 bg-[#07101F] border border-[#0F1D35] rounded-lg text-[11px] text-[#F0F4FF] placeholder:text-[#4A5578] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table header */}
          <div className="grid px-5 py-2.5 border-b border-[#0F1D35] bg-[#07101F]"
            style={{ gridTemplateColumns: '2fr 1fr 80px 70px 60px' }}>
            {['Mission', 'Health', 'MEI', 'Completion', 'Participants'].map((h) => (
              <p key={h} className="text-[10px] font-bold text-[#4A5578] uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {filteredMissions.length === 0 ? (
            <div className="py-12 text-center flex-1">
              <BarChart3 size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[#8B9CC0] font-medium">No missions yet</p>
              <p className="text-[#4A5578] text-sm mt-1">MEI scores appear once participants complete missions.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#0F1D35] overflow-y-auto max-h-[360px]">
              {filteredMissions.map((m, i) => {
                const h = HEALTH_CONFIG[m.health];
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid px-5 py-3 items-center hover:bg-[#0D1530] transition-colors"
                    style={{ gridTemplateColumns: '2fr 1fr 80px 70px 60px' }}
                  >
                    <div className="pr-3 min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#F0F4FF] truncate">{m.title}</p>
                      <p className="text-[10.5px] text-[#4A5578] mt-0.5">{m.stepCount} steps · {m.difficulty}</p>
                    </div>
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit border', h.color, h.bg, h.border)}>
                      <span className={cn('w-1 h-1 rounded-full flex-shrink-0', h.dot)} />{h.label}
                    </span>
                    <p className={cn('text-[13px] font-bold tabular-nums',
                      (m.score?.mei ?? 0) >= 70 ? 'text-[#22FFAA]' : (m.score?.mei ?? 0) >= 40 ? 'text-[#FFB84D]' : m.score ? 'text-[#FF5C7A]' : 'text-[#4A5578]'
                    )}>
                      {m.score?.mei ?? '—'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-1 bg-[#0D1530] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.completionRate}%`, backgroundColor: h.glow }} />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: h.glow }}>{m.completionRate}%</span>
                    </div>
                    <p className="text-[12px] text-[#8B9CC0] tabular-nums">{m.participants}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* SDG Impact Breakdown */}
        <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} className="text-[#2DD4BF]" strokeWidth={2} />
            <p className="text-[13px] font-bold text-[#F0F4FF]">SDG Impact Areas</p>
            <span className="ml-auto text-[11px] font-bold text-[#2DD4BF] bg-[#2DD4BF]/10 px-2 py-0.5 rounded-full">
              {summary?.sdgReach ?? 0} goals
            </span>
          </div>

          {(summary?.topCategories ?? []).length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <div>
                <Globe size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-[#8B9CC0] text-[12px]">Add tags to missions to track SDG impact</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto">
              {(summary?.topCategories ?? []).map(({ catId, count, label, emoji, color }, i) => {
                const cat = CATEGORY_MAP.get(catId);
                const maxCount = summary!.topCategories[0]?.count ?? 1;
                return (
                  <motion.div
                    key={catId}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]">{emoji}</span>
                        <span className="text-[12px] font-semibold text-[#F0F4FF]">{label}</span>
                      </div>
                      <span className="text-[11px] font-bold" style={{ color }}>{count}</span>
                    </div>
                    <div className="h-1.5 bg-[#0D1530] rounded-full overflow-hidden mb-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                        transition={{ duration: 0.6, delay: 0.2 + i * 0.06 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                    {cat && cat.sdgs.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {cat.sdgs.slice(0, 4).map((sdg) => {
                          const meta = SDG_META[sdg as keyof typeof SDG_META];
                          return meta ? (
                            <span key={sdg} className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                              SDG {sdg}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Outcome Health + MEI Breakdown ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Outcome Health Gauge */}
        <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5">
          <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-4">Portfolio Health</p>
          <div className="flex items-center justify-center mb-5">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#0F1D35" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={outcomeHealth >= 70 ? '#22FFAA' : outcomeHealth >= 40 ? '#FFB84D' : '#FF5C7A'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(outcomeHealth, 100) / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-2xl font-bold', outcomeHealth >= 70 ? 'text-[#22FFAA]' : outcomeHealth >= 40 ? 'text-[#FFB84D]' : 'text-[#FF5C7A]')}>
                  {outcomeHealth}
                </span>
                <span className="text-[9px] font-bold text-[#4A5578] uppercase tracking-wide">Score</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Completion', value: summary?.overallCompletionRate ?? 0, color: '#22FFAA' },
              { label: 'Avg MEI',    value: summary?.avgMei ?? 0,                 color: '#6D5DFD' },
              { label: 'SDG Reach',  value: Math.min((summary?.sdgReach ?? 0) * 6, 100), color: '#2DD4BF', display: `${summary?.sdgReach ?? 0} goals` },
              { label: 'Reward Conv.',value: rewardConversion,                    color: '#FFB84D' },
            ].map(({ label, value, color, display }) => (
              <div key={label}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#8B9CC0]">{label}</span>
                  <span className="font-bold tabular-nums" style={{ color }}>{display ?? `${value}%`}</span>
                </div>
                <div className="h-1.5 bg-[#0D1530] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-mission MEI Breakdown */}
        <div className="col-span-2 bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[#0F1D35]">
            <BarChart3 size={14} className="text-[#6D5DFD]" strokeWidth={2} />
            <p className="text-[13px] font-bold text-[#F0F4FF]">MEI Component Breakdown</p>
          </div>
          {scores.length === 0 ? (
            <div className="py-14 text-center">
              <BarChart3 size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[#8B9CC0] font-medium">No MEI data yet</p>
              <p className="text-[#4A5578] text-sm mt-1">MEI scores compute once participants complete missions.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {missions.filter((m) => m.score).slice(0, 6).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12px] text-[#8B9CC0] font-medium truncate max-w-[240px]">{m.title}</p>
                    <p className={cn('text-[12px] font-bold tabular-nums ml-2 flex-shrink-0',
                      (m.score?.mei ?? 0) >= 70 ? 'text-[#22FFAA]' : (m.score?.mei ?? 0) >= 40 ? 'text-[#FFB84D]' : 'text-[#FF5C7A]'
                    )}>MEI {m.score?.mei}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { v: m.score!.completion_score, c: '#22FFAA', l: 'Completion' },
                      { v: m.score!.engagement_score, c: '#6D5DFD', l: 'Engagement' },
                      { v: m.score!.retention_score,  c: '#FFB84D', l: 'Retention' },
                      { v: m.score!.outcome_score,    c: '#F0F4FF', l: 'Outcome' },
                    ].map(({ v, c, l }) => (
                      <div key={l}>
                        <div className="flex justify-between text-[9.5px] mb-0.5">
                          <span className="text-[#4A5578]">{l}</span>
                          <span style={{ color: c }}>{v ?? 0}</span>
                        </div>
                        <div className="h-1.5 bg-[#0D1530] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${v ?? 0}%`, backgroundColor: c }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Validation Queue ── */}
      <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#0F1D35]">
          <div className="flex items-center gap-2">
            <FileCheck size={14} className="text-[#6D5DFD]" strokeWidth={2} />
            <p className="text-[13px] font-bold text-[#F0F4FF]">Outcome Validations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#07101F] border border-[#0F1D35] rounded-xl p-1">
              {['all', 'pending', 'under_review', 'approved', 'rejected'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn('px-2.5 h-6 rounded-lg text-[10px] font-semibold transition-all capitalize',
                    statusFilter === s ? 'bg-[#0D1530] text-[#F0F4FF]' : 'text-[#4A5578] hover:text-[#8B9CC0]'
                  )}
                >{s.replace('_', ' ')}</button>
              ))}
            </div>
            <Link href="/admin/outcomes/validation">
              <button className="text-[11px] font-semibold text-accent flex items-center gap-1 hover:text-[#1ae595] transition-colors">
                Manage <ChevronRight size={11} strokeWidth={2} />
              </button>
            </Link>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <ShieldCheck size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-[#8B9CC0] font-medium">No validations</p>
            <p className="text-[#4A5578] text-sm mt-1">Outcome validations appear as participants submit evidence.</p>
          </div>
        ) : (
          <>
            <div className="grid px-5 py-3 border-b border-[#0F1D35] bg-[#07101F]"
              style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 100px' }}>
              {['Outcome', 'Type', 'Confidence', 'Submitted', 'Status'].map((h) => (
                <p key={h} className="text-[10px] font-bold text-[#4A5578] uppercase tracking-wider">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-[#0F1D35]">
              {filtered.slice(0, 10).map((v) => {
                const sc = VALIDATION_STATUS[v.status as keyof typeof VALIDATION_STATUS] ?? VALIDATION_STATUS.pending;
                return (
                  <div key={v.id} className="grid px-5 py-3.5 items-center hover:bg-[#0D1530] transition-colors"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 100px' }}>
                    <p className="text-[12px] text-[#F0F4FF] font-medium truncate pr-4">Outcome #{v.id.slice(0, 8)}</p>
                    <span className="text-[11px] text-[#8B9CC0] capitalize">{v.validation_type.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#0D1530] rounded-full overflow-hidden max-w-[60px]">
                        <div className="h-full bg-[#22FFAA] rounded-full" style={{ width: `${(v.confidence_score ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-[#8B9CC0] tabular-nums">{Math.round((v.confidence_score ?? 0) * 100)}%</span>
                    </div>
                    <p className="text-[11px] text-[#4A5578]">
                      {new Date(v.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full w-fit', sc.color, sc.bg)}>
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
