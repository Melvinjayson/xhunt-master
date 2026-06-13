'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Activity, TrendingUp, Users, Target, CheckCircle2,
  Award, Clock, AlertTriangle, BarChart3, Zap, ChevronRight,
  RefreshCw, Download, Eye, Play, SkipForward, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import type { DbMissionScore } from '@/lib/supabase/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MissionMeta {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  steps: { id: number; type: string; instruction: string }[];
}

interface FunnelRow {
  viewers:               number;
  starters:              number;
  ever_active:           number;
  completers:            number;
  claimers:              number;
  view_to_start_pct:     number | null;
  start_to_complete_pct: number | null;
}

interface StepDropoff {
  step_id:           number;
  step_starts:       number;
  step_completions:  number;
  step_skips:        number;
  step_adaptations:  number;
  avg_completion_ms: number | null;
  completion_pct:    number | null;
}

interface RecentEvent {
  event_type: string;
  created_at: string;
  user_id:    string;
}

type HealthStatus = 'healthy' | 'at-risk' | 'critical' | 'inactive';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-[#0D1530] animate-pulse rounded-xl', className)} />;
}

// ── Health derivation ─────────────────────────────────────────────────────────

function deriveHealth(score: DbMissionScore | null, starters: number): HealthStatus {
  if (!score || starters === 0) return 'inactive';
  if (score.mei >= 65) return 'healthy';
  if (score.mei >= 35) return 'at-risk';
  return 'critical';
}

const HEALTH_CFG: Record<HealthStatus, { label: string; color: string; bg: string; border: string }> = {
  healthy:  { label: 'Healthy',  color: '#22FFAA', bg: 'rgba(34,255,170,0.08)',  border: 'rgba(34,255,170,0.2)'  },
  'at-risk':{ label: 'At Risk',  color: '#FFB84D', bg: 'rgba(255,184,77,0.08)',  border: 'rgba(255,184,77,0.2)'  },
  critical: { label: 'Critical', color: '#FF5C7A', bg: 'rgba(255,92,122,0.08)',  border: 'rgba(255,92,122,0.2)'  },
  inactive: { label: 'Inactive', color: '#4A5578', bg: 'rgba(74,85,120,0.08)',   border: 'rgba(74,85,120,0.2)'   },
};

// ── MEI Ring ─────────────────────────────────────────────────────────────────

function MeiRing({ value }: { value: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 65 ? '#22FFAA' : value >= 35 ? '#FFB84D' : '#FF5C7A';

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg width={128} height={128} className="-rotate-90" viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <motion.circle
          cx={64} cy={64} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{value}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B9CC0' }}>MEI</span>
      </div>
    </div>
  );
}

// ── Funnel bar ────────────────────────────────────────────────────────────────

function FunnelBar({ label, value, max, icon: Icon, color }: {
  label: string; value: number; max: number;
  icon: React.ElementType; color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={14} strokeWidth={2} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-medium" style={{ color: '#8B9CC0' }}>{label}</span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: '#F0F4FF' }}>{value.toLocaleString()}</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Step drop-off row ─────────────────────────────────────────────────────────

function StepRow({ step, meta, idx }: {
  step: StepDropoff;
  meta?: { instruction: string; type: string };
  idx: number;
}) {
  const pct = step.completion_pct ?? 0;
  const barColor = pct >= 70 ? '#22FFAA' : pct >= 45 ? '#FFB84D' : '#FF5C7A';
  const avgSec = step.avg_completion_ms ? Math.round(step.avg_completion_ms / 1000) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="rounded-xl p-4"
      style={{ background: '#0A1226', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
          style={{ background: '#0D1530', color: '#8B9CC0' }}>
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#F0F4FF] truncate">
            {meta?.instruction ?? `Step ${idx + 1}`}
          </p>
          <p className="text-[11px] text-[#4A5578] capitalize mt-0.5">{meta?.type ?? 'action'}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-[16px] font-black" style={{ color: barColor }}>{Math.round(pct)}%</span>
          <p className="text-[10px] text-[#4A5578]">completed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.05 + 0.3 }}
          style={{ background: barColor }}
        />
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-[11px]">
        <span style={{ color: '#8B9CC0' }}>
          <span className="font-semibold text-[#F0F4FF]">{step.step_starts}</span> started
        </span>
        <span style={{ color: '#8B9CC0' }}>
          <span className="font-semibold text-[#22FFAA]">{step.step_completions}</span> done
        </span>
        {step.step_skips > 0 && (
          <span style={{ color: '#8B9CC0' }}>
            <span className="font-semibold text-[#FFB84D]">{step.step_skips}</span> skipped
          </span>
        )}
        {step.step_adaptations > 0 && (
          <span style={{ color: '#8B9CC0' }}>
            <span className="font-semibold text-[#6D5DFD]">{step.step_adaptations}</span> adapted
          </span>
        )}
        {avgSec !== null && (
          <span className="ml-auto" style={{ color: '#4A5578' }}>~{avgSec}s avg</span>
        )}
      </div>
    </motion.div>
  );
}

// ── Score pill ────────────────────────────────────────────────────────────────

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl"
      style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <span className="text-[18px] font-black" style={{ color }}>{Math.round(value)}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight"
        style={{ color: '#4A5578' }}>{label}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MissionAnalyticsPage() {
  const params  = useParams();
  const missionId = params?.id as string;
  const supabase  = createClient();

  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [mission,   setMission]   = useState<MissionMeta | null>(null);
  const [score,     setScore]     = useState<DbMissionScore | null>(null);
  const [funnel,    setFunnel]    = useState<FunnelRow | null>(null);
  const [dropoffs,  setDropoffs]  = useState<StepDropoff[]>([]);
  const [events,    setEvents]    = useState<RecentEvent[]>([]);

  async function load(silent = false) {
    if (!missionId) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const [mRes, sRes, eRes] = await Promise.all([
      supabase.from('missions').select('id,title,difficulty,tags,steps').eq('id', missionId).single(),
      supabase.from('mission_scores').select('*').eq('mission_id', missionId).maybeSingle(),
      supabase.from('mission_events').select('event_type,created_at,user_id')
        .eq('mission_id', missionId).order('created_at', { ascending: false }).limit(50),
    ]);

    if (mRes.data) setMission(mRes.data as MissionMeta);
    if (sRes.data) setScore(sRes.data as DbMissionScore);
    if (eRes.data) setEvents(eRes.data);

    // Query the v_mission_funnel view
    const { data: funnelData } = await supabase
      .from('v_mission_funnel')
      .select('*')
      .eq('mission_id', missionId)
      .maybeSingle();
    if (funnelData) setFunnel(funnelData as FunnelRow);

    // Query the v_step_dropoff view
    const { data: dropoffData } = await supabase
      .from('v_step_dropoff')
      .select('*')
      .eq('mission_id', missionId)
      .order('step_id', { ascending: true });
    if (dropoffData) setDropoffs(dropoffData as StepDropoff[]);

    setLoading(false);
    setRefreshing(false);
  }

  async function triggerMeiCompute() {
    setRefreshing(true);
    await fetch('/api/mei/compute', { method: 'POST' });
    await load(true);
  }

  useEffect(() => { void load(); }, [missionId]);

  const health = deriveHealth(score, funnel?.starters ?? 0);
  const hCfg   = HEALTH_CFG[health];
  const steps  = (mission?.steps ?? []) as { id: number; type: string; instruction: string }[];

  // Build event type counts for the timeline summary
  const typeCounts: Record<string, number> = {};
  for (const e of events) typeCounts[e.event_type] = (typeCounts[e.event_type] ?? 0) + 1;

  return (
    <div className="p-8 space-y-6 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/workspace/analytics"
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: '#0A1226', border: '1px solid rgba(255,255,255,0.07)' }}>
          <ArrowLeft size={16} strokeWidth={2} style={{ color: '#8B9CC0' }} />
        </Link>
        <div className="flex-1 min-w-0">
          {loading ? (
            <Skeleton className="h-7 w-64 mb-2" />
          ) : (
            <h1 className="text-[22px] font-bold text-[#F0F4FF] truncate">{mission?.title}</h1>
          )}
          <div className="flex items-center gap-2 mt-1">
            {!loading && (
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: hCfg.color, background: hCfg.bg, border: `1px solid ${hCfg.border}` }}>
                {hCfg.label}
              </span>
            )}
            <span className="text-[12px] text-[#4A5578]">Mission Analytics</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={triggerMeiCompute} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
            style={{ background: '#0A1226', border: '1px solid rgba(255,255,255,0.07)', color: '#8B9CC0' }}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} strokeWidth={2} />
            Refresh MEI
          </button>
          <Link href={`/workspace/missions/${missionId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(34,255,170,0.08)', border: '1px solid rgba(34,255,170,0.2)', color: '#22FFAA' }}>
            <ChevronRight size={14} strokeWidth={2} />
            Edit Mission
          </Link>
        </div>
      </div>

      {/* Top row: MEI + Funnel */}
      <div className="grid grid-cols-[auto_1fr] gap-6">

        {/* MEI card */}
        <div className="rounded-2xl p-6 flex flex-col items-center gap-4 min-w-[200px]"
          style={{ background: '#07101F', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[12px] font-bold uppercase tracking-widest text-[#4A5578]">
            Mission Effectiveness
          </p>
          {loading ? (
            <Skeleton className="w-32 h-32 rounded-full" />
          ) : (
            <MeiRing value={Math.round(score?.mei ?? 0)} />
          )}
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
              <ScorePill label="Completion" value={score?.completion_score ?? 0} color="#22FFAA" />
              <ScorePill label="Engagement" value={score?.engagement_score ?? 0} color="#6D5DFD" />
              <ScorePill label="Retention"  value={score?.retention_score  ?? 0} color="#FFB84D" />
              <ScorePill label="Outcome"    value={score?.outcome_score    ?? 0} color="#60A5FA" />
            </div>
          )}
          {score && (
            <p className="text-[11px] text-[#4A5578]">
              Sample: {score.sample_size.toLocaleString()} participants
            </p>
          )}
        </div>

        {/* Funnel card */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ background: '#07101F', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold text-[#F0F4FF]">Participant Funnel</p>
            {funnel && (
              <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,255,170,0.08)', color: '#22FFAA', border: '1px solid rgba(34,255,170,0.2)' }}>
                {funnel.view_to_start_pct ?? 0}% view→start
              </span>
            )}
          </div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)
          ) : funnel ? (
            <>
              <FunnelBar label="Views"       value={funnel.viewers}    max={funnel.viewers}    icon={Eye}          color="#8B9CC0" />
              <FunnelBar label="Started"     value={funnel.starters}   max={funnel.viewers}    icon={Play}         color="#6D5DFD" />
              <FunnelBar label="Ever Active" value={funnel.ever_active} max={funnel.viewers}    icon={Activity}     color="#FFB84D" />
              <FunnelBar label="Completed"   value={funnel.completers}  max={funnel.viewers}    icon={CheckCircle2} color="#22FFAA" />
              <FunnelBar label="Claimed"     value={funnel.claimers}    max={funnel.viewers}    icon={Award}        color="#60A5FA" />
              <div className="flex items-center gap-2 pt-2 border-t"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <Zap size={13} style={{ color: '#22FFAA' }} strokeWidth={2} />
                <span className="text-[12px]" style={{ color: '#8B9CC0' }}>
                  Start → complete:{' '}
                  <span className="font-bold text-[#F0F4FF]">{funnel.start_to_complete_pct ?? 0}%</span>
                </span>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[#4A5578] text-center py-8">
              No event data yet. Events will appear after participants start this mission.
            </p>
          )}
        </div>
      </div>

      {/* Step Drop-off */}
      <div className="rounded-2xl p-6" style={{ background: '#07101F', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} strokeWidth={2} style={{ color: '#6D5DFD' }} />
            <h2 className="text-[14px] font-bold text-[#F0F4FF]">Step-by-Step Drop-off</h2>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22FFAA]" />≥70% healthy</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFB84D]" />45–70% at risk</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF5C7A]" />&lt;45% critical</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : dropoffs.length === 0 ? (
          <div className="text-center py-10">
            <SkipForward size={28} strokeWidth={1.5} style={{ color: '#4A5578' }} className="mx-auto mb-3" />
            <p className="text-[13px] text-[#4A5578]">
              No step event data yet. Step analytics appear once participants begin executing this mission.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dropoffs.map((d, i) => {
              const stepMeta = steps.find((s) => s.id === d.step_id) ?? steps[i];
              return <StepRow key={d.step_id} step={d} meta={stepMeta} idx={i} />;
            })}
          </div>
        )}
      </div>

      {/* Recent activity + event counts */}
      <div className="grid grid-cols-2 gap-6">

        {/* Event type breakdown */}
        <div className="rounded-2xl p-6" style={{ background: '#07101F', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} strokeWidth={2} style={{ color: '#22FFAA' }} />
            <h2 className="text-[14px] font-bold text-[#F0F4FF]">Event Breakdown</h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7" />)}
            </div>
          ) : Object.keys(typeCounts).length === 0 ? (
            <p className="text-[13px] text-[#4A5578] py-6 text-center">No events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(typeCounts).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-[12px] text-[#8B9CC0] font-mono">{type.replace(/_/g, ' ')}</span>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: '#F0F4FF' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI recommendations */}
        <div className="rounded-2xl p-6" style={{ background: '#07101F', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} strokeWidth={2} style={{ color: '#6D5DFD' }} />
            <h2 className="text-[14px] font-bold text-[#F0F4FF]">Health Insights</h2>
          </div>
          <div className="space-y-3">
            {score ? (
              <>
                {score.completion_score < 40 && (
                  <InsightCard icon={AlertTriangle} color="#FF5C7A"
                    text="Completion rate is below 40%. Review step difficulty and reduce barriers to finishing." />
                )}
                {score.engagement_score < 50 && (
                  <InsightCard icon={TrendingUp} color="#FFB84D"
                    text="Low step engagement. Consider shorter, clearer instructions or adding adaptation options." />
                )}
                {score.retention_score < 30 && (
                  <InsightCard icon={Users} color="#6D5DFD"
                    text="Few participants return to this mission. A follow-up mission in the same category may help." />
                )}
                {score.outcome_score < 20 && (
                  <InsightCard icon={Target} color="#60A5FA"
                    text="Reward claim rate is low. Ensure the reward is visible and the claim flow is frictionless." />
                )}
                {score.mei >= 65 && (
                  <InsightCard icon={CheckCircle2} color="#22FFAA"
                    text={`This mission is performing well with an MEI of ${Math.round(score.mei)}. Consider featuring it in the marketplace.`} />
                )}
                {score.sample_size < 5 && (
                  <InsightCard icon={Clock} color="#8B9CC0"
                    text="Not enough data yet. MEI scores become reliable above 5 participants." />
                )}
              </>
            ) : (
              <p className="text-[13px] text-[#4A5578]">
                Run MEI compute to generate health insights for this mission.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, color, text }: {
  icon: React.ElementType; color: string; text: string;
}) {
  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
      <Icon size={15} strokeWidth={2} style={{ color }} className="flex-shrink-0 mt-0.5" />
      <p className="text-[12px] leading-relaxed" style={{ color: '#8B9CC0' }}>{text}</p>
    </div>
  );
}
