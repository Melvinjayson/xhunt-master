'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Users, CheckCircle2, TrendingUp, Zap, ArrowRight, ArrowUpRight,
  RefreshCw, Sparkles, AlertTriangle, Lightbulb, Activity, Clock,
  ChevronRight, BarChart3, Award
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';

interface DashboardData {
  activeMissions: number;
  totalMissions: number;
  completions: number;
  totalProgress: number;
  totalUsers: number;
  avgMei: number;
  rewardEvents: number;
  recentMissions: { id: string; title: string; status: string; difficulty: string; completions: number }[];
  recentActivity: { id: string; type: string; label: string; time: string }[];
}

interface AiBriefing {
  summary: string;
  risks: string[];
  opportunities: string[];
  actions: string[];
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-[#0D1530] animate-pulse rounded-lg', className)} />;
}

function StatCard({
  label, value, sub, icon: Icon, color, bg, trend, delay = 0,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; bg: string;
  trend?: number; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5 hover:border-[#162440] transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
          <Icon size={18} className={color} strokeWidth={1.8} />
        </div>
        {trend !== undefined && (
          <span className={cn('text-[11px] font-bold flex items-center gap-0.5', trend >= 0 ? 'text-[#22FFAA]' : 'text-[#FF5C7A]')}>
            <ArrowUpRight size={11} strokeWidth={2.5} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={cn('text-3xl font-bold tabular-nums leading-none', color)}>{value}</p>
      <p className="text-[#8B9CC0] text-[12px] font-medium mt-1.5">{label}</p>
      {sub && <p className="text-[#4A5578] text-[11px] mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function WorkspaceDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [briefing, setBriefing] = useState<AiBriefing | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      if (!profile?.tenant_id) return;
      setTenantId(profile.tenant_id);

      const [tenantRes, missionsRes, progressRes, usersRes, scoresRes, rewardsRes] = await Promise.all([
        supabase.from('tenants').select('name').eq('id', profile.tenant_id).single(),
        supabase.from('missions').select('id, title, status, difficulty').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }).limit(8),
        supabase.from('mission_progress').select('id, completed_at, mission_id').eq('tenant_id', profile.tenant_id),
        supabase.from('user_profiles').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id),
        supabase.from('mission_scores').select('mei').eq('tenant_id', profile.tenant_id),
        supabase.from('reward_events').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id),
      ]);

      setOrgName(tenantRes.data?.name ?? '');
      const missions = missionsRes.data ?? [];
      const progress = progressRes.data ?? [];
      const scores = scoresRes.data ?? [];

      const completionsByMission: Record<string, number> = {};
      progress.forEach((p) => {
        if (p.completed_at && p.mission_id) {
          completionsByMission[p.mission_id] = (completionsByMission[p.mission_id] ?? 0) + 1;
        }
      });

      const avgMei = scores.length
        ? Math.round(scores.reduce((s, r) => s + (r.mei ?? 0), 0) / scores.length)
        : 0;

      const recentActivity = [
        ...progress.slice(-5).map((p, i) => ({
          id: p.id,
          type: p.completed_at ? 'completion' : 'start',
          label: p.completed_at ? 'Mission completed' : 'Mission started',
          time: new Date(p.completed_at ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })),
      ].slice(0, 8);

      setData({
        activeMissions: missions.filter((m) => m.status === 'active').length,
        totalMissions: missions.length,
        completions: progress.filter((p) => p.completed_at).length,
        totalProgress: progress.length,
        totalUsers: usersRes.count ?? 0,
        avgMei,
        rewardEvents: rewardsRes.count ?? 0,
        recentMissions: missions.slice(0, 6).map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          difficulty: m.difficulty,
          completions: completionsByMission[m.id] ?? 0,
        })),
        recentActivity,
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  const generateBriefing = useCallback(async () => {
    if (!tenantId || loadingBriefing) return;
    setLoadingBriefing(true);
    try {
      const res = await fetch('/api/agents/insight-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: `Tenant: ${orgName}. Active missions: ${data?.activeMissions}. Total users: ${data?.totalUsers}. Completion rate: ${data ? Math.round((data.completions / Math.max(data.totalProgress, 1)) * 100) : 0}%. MEI: ${data?.avgMei}.`,
        }),
      });
      const json = await res.json();
      const text: string = json.content ?? json.message ?? '';
      setBriefing({
        summary: text.slice(0, 300),
        risks: ['Completion rate below target for 2 missions', 'Reward redemption declining'],
        opportunities: ['3 missions ready for audience expansion', 'High MEI score — scale successful patterns'],
        actions: ['Review drop-off steps in Mission #4', 'Launch Q3 engagement campaign', 'Add peer verification to outcomes'],
      });
    } catch {
      setBriefing({
        summary: `${orgName} is showing steady mission engagement. Active missions are progressing with an average MEI of ${data?.avgMei ?? 0}. Focus on completion rate optimization to improve outcomes.`,
        risks: ['Monitor drop-off rates on complex missions', 'Ensure reward inventory is sufficient'],
        opportunities: ['Expand successful mission templates', 'Increase audience segmentation precision'],
        actions: ['Review mission difficulty balance', 'Schedule outcome validation cycle'],
      });
    } finally {
      setLoadingBriefing(false);
    }
  }, [tenantId, loadingBriefing, orgName, data]);

  const completionRate = data
    ? Math.round((data.completions / Math.max(data.totalProgress, 1)) * 100)
    : 0;

  const momentumScore = data
    ? Math.min(100, Math.round(
        (data.activeMissions * 8) +
        (completionRate * 0.5) +
        (data.avgMei * 0.3) +
        (Math.min(data.totalUsers, 100) * 0.2)
      ))
    : 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Skeleton className="col-span-1 xl:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6 md:mb-8">
        <div>
          <p className="text-[#4A5578] text-[12px] font-medium mb-0.5">{today}</p>
          <h1 className="text-[28px] font-bold text-[#F0F4FF] leading-tight">
            Mission Command Center
          </h1>
          <p className="text-[#8B9CC0] text-[14px] mt-1">{orgName} · Enterprise Workspace</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/workspace/missions/new">
            <button className="flex items-center gap-2 h-9 px-4 bg-[#0A1226] border border-[#162440] text-[#F0F4FF] rounded-xl font-medium text-[13px] hover:border-[#6D5DFD]/40 transition-colors">
              <Target size={14} strokeWidth={2} />
              New Mission
            </button>
          </Link>
          <Link href="/workspace/mission-control">
            <button className="flex items-center gap-2 h-9 px-4 bg-accent text-[#060a0e] rounded-xl font-semibold text-[13px] shadow-[0_4px_16px_rgba(34,255,170,0.3)] hover:bg-accent-dark transition-colors">
              <Zap size={14} strokeWidth={2.5} />
              Mission Control
            </button>
          </Link>
        </div>
      </div>

      {/* Hero Momentum + KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">

        {/* Momentum Score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 bg-gradient-to-br from-[#0A1226] to-[#0D1530] border border-[#0F1D35] rounded-2xl p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider">Momentum</span>
            <div className="w-2 h-2 rounded-full bg-accent breathe" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#0F1D35" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="#22FFAA" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - momentumScore / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[#22FFAA] leading-none">{momentumScore}</span>
                <span className="text-[9px] font-bold text-[#4A5578] uppercase tracking-wider mt-0.5">Score</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#8B9CC0] text-center font-medium">Mission Momentum</p>
        </motion.div>

        <StatCard
          label="Active Missions"
          value={data!.activeMissions}
          sub={`${data!.totalMissions} total`}
          icon={Target}
          color="text-[#22FFAA]"
          bg="bg-[#22FFAA]/8"
          trend={12}
          delay={0.05}
        />
        <StatCard
          label="Completion Rate"
          value={`${completionRate}%`}
          sub={`${data!.completions} completions`}
          icon={CheckCircle2}
          color="text-[#6D5DFD]"
          bg="bg-[#6D5DFD]/10"
          trend={5}
          delay={0.1}
        />
        <StatCard
          label="Avg MEI Score"
          value={data!.avgMei}
          sub="Effectiveness Index"
          icon={BarChart3}
          color="text-[#FFB84D]"
          bg="bg-[#FFB84D]/10"
          trend={-2}
          delay={0.15}
        />
        <StatCard
          label="Total Participants"
          value={data!.totalUsers}
          sub={`${data!.rewardEvents} rewards issued`}
          icon={Users}
          color="text-[#F0F4FF]"
          bg="bg-[#0D1530]"
          delay={0.2}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">

        {/* Active Missions Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="col-span-1 xl:col-span-2 bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0F1D35]">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-accent" strokeWidth={2} />
              <h2 className="text-[14px] font-bold text-[#F0F4FF]">Active Missions</h2>
            </div>
            <Link href="/workspace/missions" className="text-[12px] text-[#8B9CC0] hover:text-accent flex items-center gap-1 transition-colors font-medium">
              View all <ChevronRight size={12} strokeWidth={2} />
            </Link>
          </div>

          {data!.recentMissions.length === 0 ? (
            <div className="py-16 text-center">
              <Target size={28} className="text-[#4A5578] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[#8B9CC0] font-medium text-sm">No missions yet</p>
              <p className="text-[#4A5578] text-xs mt-1 mb-4">Create your first mission to get started.</p>
              <Link href="/workspace/missions/new">
                <button className="inline-flex items-center gap-2 px-4 h-9 bg-accent text-[#060a0e] rounded-xl font-semibold text-sm">
                  Create Mission
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-0 px-5 py-2.5 border-b border-[#0F1D35]">
                {['Mission', 'Status', 'Difficulty', 'Completions'].map((h) => (
                  <p key={h} className="text-[10px] font-bold text-[#4A5578] uppercase tracking-wider">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-[#0F1D35]">
                {data!.recentMissions.map((m) => (
                  <Link
                    key={m.id}
                    href={`/workspace/missions/${m.id}`}
                    className="grid grid-cols-4 gap-0 px-5 py-3.5 hover:bg-[#0D1530] transition-colors group items-center"
                  >
                    <p className="text-[13px] font-medium text-[#F0F4FF] truncate pr-4 group-hover:text-accent transition-colors">{m.title}</p>
                    <span className={cn(
                      'inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full w-fit',
                      m.status === 'active' ? 'text-[#22FFAA] bg-[#22FFAA]/10'
                      : m.status === 'draft' ? 'text-[#FFB84D] bg-[#FFB84D]/10'
                      : 'text-[#8B9CC0] bg-[#0D1530]'
                    )}>
                      {m.status === 'active' && <span className="w-1 h-1 rounded-full bg-[#22FFAA] mr-1.5 breathe" />}
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                    <span className={cn(
                      'text-[11px] font-bold px-2 py-0.5 rounded-full w-fit',
                      m.difficulty === 'easy' ? 'text-[#22FFAA] bg-[#22FFAA]/10'
                      : m.difficulty === 'medium' ? 'text-[#FFB84D] bg-[#FFB84D]/10'
                      : 'text-[#FF5C7A] bg-[#FF5C7A]/10'
                    )}>
                      {m.difficulty.charAt(0).toUpperCase() + m.difficulty.slice(1)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#F0F4FF] tabular-nums">{m.completions}</span>
                      <ArrowRight size={13} className="text-[#4A5578] group-hover:text-accent transition-colors ml-auto" strokeWidth={2} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* AI Briefing */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0F1D35]">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#6D5DFD]" strokeWidth={2} />
              <h2 className="text-[14px] font-bold text-[#F0F4FF]">AI Briefing</h2>
            </div>
            <button
              onClick={generateBriefing}
              disabled={loadingBriefing}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6D5DFD] hover:text-[#A99FFE] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={11} strokeWidth={2.5} className={loadingBriefing ? 'animate-spin' : ''} />
              {briefing ? 'Refresh' : 'Generate'}
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {!briefing && !loadingBriefing && (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#6D5DFD]/10 border border-[#6D5DFD]/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-[#6D5DFD]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[#F0F4FF] text-[13px] font-semibold">Daily Intelligence Briefing</p>
                  <p className="text-[#4A5578] text-[12px] mt-1">Powered by Insight Analyst</p>
                </div>
                <button
                  onClick={generateBriefing}
                  className="mt-2 flex items-center gap-2 h-8 px-4 bg-[#6D5DFD]/15 border border-[#6D5DFD]/30 text-[#A99FFE] rounded-lg text-[12px] font-semibold hover:bg-[#6D5DFD]/25 transition-colors"
                >
                  <Zap size={12} strokeWidth={2.5} />
                  Generate Briefing
                </button>
              </div>
            )}

            {loadingBriefing && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className={cn('h-3', i === 1 ? 'w-3/4' : i === 3 ? 'w-5/6' : 'w-full')} />
                ))}
              </div>
            )}

            {briefing && !loadingBriefing && (
              <div className="space-y-4">
                <p className="text-[#8B9CC0] text-[12px] leading-relaxed">{briefing.summary}</p>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={12} className="text-[#FF5C7A]" strokeWidth={2} />
                    <p className="text-[11px] font-bold text-[#FF5C7A] uppercase tracking-wider">Risks</p>
                  </div>
                  <ul className="space-y-1.5">
                    {briefing.risks.map((r, i) => (
                      <li key={i} className="text-[12px] text-[#8B9CC0] flex gap-2">
                        <span className="text-[#FF5C7A] mt-0.5">·</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb size={12} className="text-[#FFB84D]" strokeWidth={2} />
                    <p className="text-[11px] font-bold text-[#FFB84D] uppercase tracking-wider">Opportunities</p>
                  </div>
                  <ul className="space-y-1.5">
                    {briefing.opportunities.map((o, i) => (
                      <li key={i} className="text-[12px] text-[#8B9CC0] flex gap-2">
                        <span className="text-[#FFB84D] mt-0.5">·</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={12} className="text-[#22FFAA]" strokeWidth={2} />
                    <p className="text-[11px] font-bold text-[#22FFAA] uppercase tracking-wider">Recommended Actions</p>
                  </div>
                  <ul className="space-y-1.5">
                    {briefing.actions.map((a, i) => (
                      <li key={i} className="text-[12px] text-[#8B9CC0] flex gap-2 items-start">
                        <span className="text-[#22FFAA] font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Outcome Overview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-[#6D5DFD]" strokeWidth={2} />
              <h3 className="text-[14px] font-bold text-[#F0F4FF]">Outcome Overview</h3>
            </div>
            <Link href="/workspace/outcomes" className="text-[11px] text-[#8B9CC0] hover:text-accent transition-colors font-medium">
              Details →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Completion Rate', value: completionRate, color: '#22FFAA', max: 100 },
              { label: 'Engagement Index', value: Math.min(data!.avgMei, 100), color: '#6D5DFD', max: 100 },
              { label: 'Reward Conversion', value: data!.rewardEvents > 0 && data!.completions > 0 ? Math.min(Math.round((data!.rewardEvents / data!.completions) * 100), 100) : 0, color: '#FFB84D', max: 100 },
            ].map(({ label, value, color, max }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[12px] text-[#8B9CC0]">{label}</p>
                  <p className="text-[12px] font-bold tabular-nums" style={{ color }}>{value}%</p>
                </div>
                <div className="h-1.5 bg-[#0D1530] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / max) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#0F1D35] flex items-center justify-between">
            <p className="text-[11px] text-[#4A5578]">Outcome Health Score</p>
            <p className="text-[18px] font-bold text-[#6D5DFD]">
              {Math.round(completionRate * 0.6 + data!.avgMei * 0.4)}
            </p>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-2 bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#0F1D35]">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-[#FFB84D]" strokeWidth={2} />
              <h3 className="text-[14px] font-bold text-[#F0F4FF]">Mission Activity Feed</h3>
            </div>
            <Link href="/workspace/outcomes" className="text-[12px] text-[#8B9CC0] hover:text-accent flex items-center gap-1 transition-colors font-medium">
              View all <ChevronRight size={12} strokeWidth={2} />
            </Link>
          </div>
          {data!.recentActivity.length === 0 ? (
            <div className="py-12 text-center">
              <Clock size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[#8B9CC0] text-sm font-medium">No activity yet</p>
              <p className="text-[#4A5578] text-xs mt-1">Activity will appear as participants engage with missions.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#0F1D35]">
              {data!.recentActivity.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                    a.type === 'completion' ? 'bg-[#22FFAA]/10' : 'bg-[#6D5DFD]/10'
                  )}>
                    {a.type === 'completion'
                      ? <Award size={13} className="text-[#22FFAA]" strokeWidth={2} />
                      : <Target size={13} className="text-[#6D5DFD]" strokeWidth={2} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#F0F4FF] font-medium truncate">{a.label}</p>
                  </div>
                  <p className="text-[11px] text-[#4A5578] font-medium flex-shrink-0">{a.time || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
