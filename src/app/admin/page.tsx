'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import { Target, Users, CheckCircle2, Trophy, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DbMission, DbTenant } from '@/lib/supabase/types';
import { cn } from '@/lib/cn';

const DIFFICULTY_COLORS = {
  easy: 'text-[#00e676] bg-[#002918]',
  medium: 'text-[#fbbf24] bg-[#2a1a00]',
  hard: 'text-[#ff5252] bg-[#2a0a0a]',
};

export default function AdminOverviewPage() {
  const [missions, setMissions] = useState<DbMission[]>([]);
  const [tenant, setTenant] = useState<DbTenant | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [completions, setCompletions] = useState(0);
  const [loading, setLoading] = useState(true);

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

      const [tenantRes, missionsRes, usersRes, completionsRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', profile.tenant_id).single(),
        supabase.from('missions').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id),
        supabase.from('mission_progress').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id).not('completed_at', 'is', null),
      ]);

      setTenant(tenantRes.data);
      setMissions(missionsRes.data ?? []);
      setTotalUsers(usersRes.count ?? 0);
      setCompletions(completionsRes.count ?? 0);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const activeMissions = missions.filter((m) => m.status === 'active').length;

  const stats = [
    { label: 'Active Missions', value: activeMissions, icon: Target, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-[#6D5DFD]', bg: 'bg-[#001a22]' },
    { label: 'Completions', value: completions, icon: CheckCircle2, color: 'text-[#00e676]', bg: 'bg-[#002918]' },
    { label: 'Missions Created', value: missions.length, icon: Trophy, color: 'text-[#fbbf24]', bg: 'bg-[#2a1a00]' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[#7a8fa8] text-sm font-medium mb-0.5">
            {tenant?.name ?? 'Your workspace'}
          </p>
          <h1 className="text-[28px] font-bold text-[#e8f0fe]">Mission Overview</h1>
        </div>
        <Link href="/admin/missions/new">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 h-10 px-5 bg-accent text-[#060a0e] rounded-xl font-semibold text-sm shadow-[0_4px_16px_rgba(0,230,118,0.35)]"
          >
            <Plus size={16} strokeWidth={2.5} />
            New Mission
          </motion.button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#111927] border border-[#1c2a3a] rounded-2xl p-5"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', bg)}>
              <Icon size={20} className={color} strokeWidth={2} />
            </div>
            <p className={cn('text-[28px] font-bold', color)}>{value}</p>
            <p className="text-[#7a8fa8] text-[13px] font-medium mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent missions */}
      <div className="bg-[#111927] border border-[#1c2a3a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1c2a3a]">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-accent" strokeWidth={2} />
            <h2 className="text-[15px] font-bold text-[#e8f0fe]">Recent Missions</h2>
          </div>
          <Link href="/admin/missions" className="text-[13px] text-accent font-medium flex items-center gap-1 hover:text-accent-dark transition-colors">
            View all <ArrowRight size={13} strokeWidth={2.5} />
          </Link>
        </div>

        {missions.length === 0 ? (
          <div className="py-16 text-center">
            <Target size={32} className="text-[#3d5068] mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[#7a8fa8] font-medium mb-1">No missions yet</p>
            <p className="text-[#3d5068] text-sm mb-5">Create your first mission to get started.</p>
            <Link href="/admin/missions/new">
              <button className="inline-flex items-center gap-2 px-5 h-10 bg-accent text-[#060a0e] rounded-xl font-semibold text-sm">
                <Plus size={15} strokeWidth={2.5} /> Create Mission
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#1c2a3a]">
            {missions.slice(0, 6).map((m) => (
              <Link
                key={m.id}
                href={`/admin/missions/${m.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#162030] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#e8f0fe] truncate group-hover:text-accent transition-colors">
                    {m.title}
                  </p>
                  <p className="text-[12px] text-[#7a8fa8] mt-0.5 truncate">
                    {m.estimated_time ?? '—'} · {(m.steps as unknown[]).length} steps
                  </p>
                </div>

                <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full', DIFFICULTY_COLORS[m.difficulty])}>
                  {m.difficulty.charAt(0).toUpperCase() + m.difficulty.slice(1)}
                </span>

                <span className={cn(
                  'text-[11px] font-semibold px-2.5 py-1 rounded-full',
                  m.status === 'active' ? 'text-[#00e676] bg-[#002918]'
                  : m.status === 'draft' ? 'text-[#fbbf24] bg-[#2a1a00]'
                  : 'text-[#7a8fa8] bg-[#162030]'
                )}>
                  {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                </span>

                <ArrowRight size={15} className="text-[#3d5068] group-hover:text-accent transition-colors flex-shrink-0" strokeWidth={2} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
