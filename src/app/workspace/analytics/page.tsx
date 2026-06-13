'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Target, CheckCircle2, Award,
  ArrowUpRight, Calendar, Download, Filter, Activity, Zap,
  Clock, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';

interface AnalyticsData {
  totalMissions: number;
  activeMissions: number;
  totalUsers: number;
  totalCompletions: number;
  totalProgress: number;
  totalRewards: number;
  avgMei: number;
  missionsByStatus: Record<string, number>;
  completionsByDifficulty: Record<string, { total: number; completed: number }>;
  recentActivity: { date: string; completions: number; starts: number }[];
  topMissions: { id: string; title: string; completions: number; mei: number | null }[];
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-[#0D1530] animate-pulse rounded-lg', className)} />;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-20 flex items-end">
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: `${pct}%` }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full rounded-t-sm min-h-[2px]"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) return;

      const [missionsRes, progressRes, usersRes, scoresRes, rewardsRes] = await Promise.all([
        supabase.from('missions').select('id, title, status, difficulty').eq('tenant_id', profile.tenant_id),
        supabase.from('mission_progress').select('mission_id, completed_at, started_at').eq('tenant_id', profile.tenant_id),
        supabase.from('user_profiles').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id),
        supabase.from('mission_scores').select('mission_id, mei').eq('tenant_id', profile.tenant_id),
        supabase.from('reward_events').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id),
      ]);

      const missions = missionsRes.data ?? [];
      const progress = progressRes.data ?? [];
      const scores = scoresRes.data ?? [];

      const missionsByStatus: Record<string, number> = {};
      missions.forEach((m) => { missionsByStatus[m.status] = (missionsByStatus[m.status] ?? 0) + 1; });

      const completionsByDifficulty: Record<string, { total: number; completed: number }> = {};
      const missionDiffMap: Record<string, string> = {};
      missions.forEach((m) => { missionDiffMap[m.id] = m.difficulty; });
      progress.forEach((p) => {
        const diff = missionDiffMap[p.mission_id] ?? 'unknown';
        if (!completionsByDifficulty[diff]) completionsByDifficulty[diff] = { total: 0, completed: 0 };
        completionsByDifficulty[diff].total += 1;
        if (p.completed_at) completionsByDifficulty[diff].completed += 1;
      });

      // Aggregate activity by day (last 7 days)
      const dayMap: Record<string, { completions: number; starts: number }> = {};
      const days = 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayMap[d.toISOString().split('T')[0]] = { completions: 0, starts: 0 };
      }
      progress.forEach((p) => {
        const day = (p.started_at ?? '').split('T')[0];
        if (dayMap[day]) {
          dayMap[day].starts += 1;
          if (p.completed_at) dayMap[day].completions += 1;
        }
      });
      const recentActivity = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

      const meiMap: Record<string, number | null> = {};
      scores.forEach((s) => { meiMap[s.mission_id] = s.mei; });

      const completionMap: Record<string, number> = {};
      progress.filter((p) => p.completed_at).forEach((p) => {
        completionMap[p.mission_id] = (completionMap[p.mission_id] ?? 0) + 1;
      });

      const topMissions = missions
        .map((m) => ({ id: m.id, title: m.title, completions: completionMap[m.id] ?? 0, mei: meiMap[m.id] ?? null }))
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 6);

      const avgMei = scores.length
        ? Math.round(scores.reduce((s, r) => s + (r.mei ?? 0), 0) / scores.length)
        : 0;

      setData({
        totalMissions: missions.length,
        activeMissions: missions.filter((m) => m.status === 'active').length,
        totalUsers: usersRes.count ?? 0,
        totalCompletions: progress.filter((p) => p.completed_at).length,
        totalProgress: progress.length,
        totalRewards: rewardsRes.count ?? 0,
        avgMei,
        missionsByStatus,
        completionsByDifficulty,
        recentActivity,
        topMissions,
      });
      setLoading(false);
    }
    load();
  }, [supabase, period]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const completionRate = data!.totalProgress > 0
    ? Math.round((data!.totalCompletions / data!.totalProgress) * 100)
    : 0;

  const maxActivity = Math.max(...data!.recentActivity.map((d) => Math.max(d.completions, d.starts)), 1);

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22FFAA]/8 border border-[#22FFAA]/15 flex items-center justify-center">
            <BarChart3 size={18} className="text-[#22FFAA]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#F0F4FF]">Analytics Center</h1>
            <p className="text-[#4A5578] text-[12px]">Operational intelligence and performance insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0A1226] border border-[#0F1D35] rounded-xl p-1">
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn('h-7 px-3 rounded-lg text-[11px] font-bold transition-all', period === p ? 'bg-[#0D1530] text-[#F0F4FF]' : 'text-[#4A5578] hover:text-[#8B9CC0]')}
              >{p}</button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 h-9 px-3 bg-[#0A1226] border border-[#0F1D35] rounded-xl text-[12px] font-medium text-[#8B9CC0] hover:text-[#F0F4FF] transition-colors">
            <Download size={13} strokeWidth={2} />Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Missions',   value: data!.totalMissions,   icon: Target,       color: 'text-[#F0F4FF]', bg: 'bg-[#0D1530]',       trend: 8  },
          { label: 'Completion Rate',  value: `${completionRate}%`,  icon: CheckCircle2, color: 'text-[#22FFAA]', bg: 'bg-[#22FFAA]/8',     trend: 5  },
          { label: 'Total Users',      value: data!.totalUsers,      icon: Users,        color: 'text-[#6D5DFD]', bg: 'bg-[#6D5DFD]/10',    trend: 12 },
          { label: 'Avg MEI Score',    value: data!.avgMei,          icon: TrendingUp,   color: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10',    trend: -2 },
        ].map(({ label, value, icon: Icon, color, bg, trend }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
                <Icon size={16} className={color} strokeWidth={1.8} />
              </div>
              <span className={cn('text-[11px] font-bold flex items-center gap-0.5', trend >= 0 ? 'text-[#22FFAA]' : 'text-[#FF5C7A]')}>
                <ArrowUpRight size={11} className={trend < 0 ? 'rotate-180' : ''} strokeWidth={2.5} />
                {Math.abs(trend)}%
              </span>
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-[#4A5578] text-[11px] mt-0.5 font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity Chart + Status Distribution */}
      <div className="grid grid-cols-3 gap-4">

        {/* Activity Chart */}
        <div className="col-span-2 bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#22FFAA]" strokeWidth={2} />
              <p className="text-[13px] font-bold text-[#F0F4FF]">Mission Activity</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#22FFAA]">
                <span className="w-2 h-2 rounded-full bg-[#22FFAA]" />Completions
              </span>
              <span className="flex items-center gap-1.5 text-[#6D5DFD]">
                <span className="w-2 h-2 rounded-full bg-[#6D5DFD]" />Starts
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2 h-32">
            {data!.recentActivity.map((d, i) => (
              <div key={d.date} className="flex-1 flex items-end gap-0.5 h-full">
                <div className="flex-1 flex flex-col justify-end gap-0.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${maxActivity > 0 ? (d.starts / maxActivity) * 100 : 0}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                    className="rounded-t-sm min-h-[2px] bg-[#6D5DFD]/50"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-end gap-0.5">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${maxActivity > 0 ? (d.completions / maxActivity) * 100 : 0}%` }}
                    transition={{ delay: i * 0.05 + 0.3, duration: 0.5 }}
                    className="rounded-t-sm min-h-[2px] bg-[#22FFAA]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            {data!.recentActivity.map((d) => (
              <p key={d.date} className="flex-1 text-center text-[9px] text-[#4A5578]">
                {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
            ))}
          </div>
        </div>

        {/* Mission Status Distribution */}
        <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Target size={14} className="text-[#FFB84D]" strokeWidth={2} />
            <p className="text-[13px] font-bold text-[#F0F4FF]">Mission Status</p>
          </div>
          <div className="space-y-3">
            {Object.entries(data!.missionsByStatus).map(([status, count]) => {
              const pct = data!.totalMissions > 0 ? Math.round((count / data!.totalMissions) * 100) : 0;
              const colors: Record<string, string> = {
                active: '#22FFAA', draft: '#FFB84D', paused: '#8B9CC0', archived: '#4A5578', published: '#22FFAA',
              };
              const color = colors[status] ?? '#8B9CC0';
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span className="text-[#8B9CC0] capitalize">{status}</span>
                    <span className="font-bold tabular-nums" style={{ color }}>{count}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1530] rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Missions + Difficulty Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {/* Top Missions */}
        <div className="col-span-2 bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0F1D35] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#22FFAA]" strokeWidth={2} />
              <p className="text-[13px] font-bold text-[#F0F4FF]">Top Performing Missions</p>
            </div>
            <Link href="/workspace/missions" className="text-[11px] text-[#8B9CC0] hover:text-accent transition-colors font-medium flex items-center gap-1">
              All missions <ChevronRight size={11} strokeWidth={2} />
            </Link>
          </div>
          {data!.topMissions.length === 0 ? (
            <div className="py-12 text-center">
              <Target size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[#8B9CC0] text-sm font-medium">No data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#0F1D35]">
              {data!.topMissions.map((m, i) => (
                <Link key={m.id} href={`/workspace/missions/${m.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#0D1530] transition-colors group">
                  <span className="text-[12px] font-bold text-[#4A5578] w-4 flex-shrink-0">{i + 1}</span>
                  <p className="flex-1 text-[13px] text-[#F0F4FF] font-medium truncate group-hover:text-accent transition-colors">{m.title}</p>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-[12px] text-[#8B9CC0]">{m.completions} completions</span>
                    {m.mei !== null && (
                      <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full',
                        m.mei >= 70 ? 'text-[#22FFAA] bg-[#22FFAA]/10' : m.mei >= 40 ? 'text-[#FFB84D] bg-[#FFB84D]/10' : 'text-[#FF5C7A] bg-[#FF5C7A]/10'
                      )}>MEI {m.mei}</span>
                    )}
                    <ChevronRight size={13} className="text-[#4A5578] group-hover:text-accent transition-colors" strokeWidth={2} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={14} className="text-[#6D5DFD]" strokeWidth={2} />
            <p className="text-[13px] font-bold text-[#F0F4FF]">By Difficulty</p>
          </div>
          <div className="space-y-4">
            {[
              { key: 'easy',   label: 'Easy',   color: '#22FFAA' },
              { key: 'medium', label: 'Medium', color: '#FFB84D' },
              { key: 'hard',   label: 'Hard',   color: '#FF5C7A' },
            ].map(({ key, label, color }) => {
              const d = data!.completionsByDifficulty[key] ?? { total: 0, completed: 0 };
              const rate = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
              return (
                <div key={key} className="p-3 bg-[#07101F] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold" style={{ color }}>{label}</span>
                    <span className="text-[11px] text-[#8B9CC0] tabular-nums">{d.completed}/{d.total}</span>
                  </div>
                  <div className="h-1.5 bg-[#0D1530] rounded-full mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rate}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <p className="text-[10px] font-bold" style={{ color }}>{rate}% completion rate</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[#0F1D35]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#4A5578]">Total rewards issued</p>
              <p className="text-[16px] font-bold text-[#FFB84D]">{data!.totalRewards}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
