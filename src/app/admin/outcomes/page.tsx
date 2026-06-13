'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Target, Zap, RefreshCw, Loader2, Trophy,
  CheckCircle2, Activity, ArrowUpRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { DbMissionScore, DbMission, DbOutcomeEvent } from '@/lib/supabase/types';
import { cn } from '@/lib/cn';

interface ScoredMission {
  mission: DbMission;
  score: DbMissionScore;
}

const MEI_BAND = (mei: number) => {
  if (mei >= 75) return { label: 'Excellent', color: 'text-accent', bg: 'bg-accent-light', bar: 'bg-accent' };
  if (mei >= 50) return { label: 'Good', color: 'text-[#6D5DFD]', bg: 'bg-[#001a22]', bar: 'bg-[#6D5DFD]' };
  if (mei >= 25) return { label: 'Developing', color: 'text-[#fbbf24]', bg: 'bg-[#2a1a00]', bar: 'bg-[#fbbf24]' };
  return { label: 'Early', color: 'text-[#7a8fa8]', bg: 'bg-[#162030]', bar: 'bg-[#3d5068]' };
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] font-semibold text-[#3d5068] uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-bold text-[#e8f0fe]">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-[#162030] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' as const }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );
}

export default function AdminOutcomesPage() {
  const [scored, setScored] = useState<ScoredMission[]>([]);
  const [unscored, setUnscored] = useState<DbMission[]>([]);
  const [outcomes, setOutcomes] = useState<DbOutcomeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const supabase = createClient();

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile?.tenant_id) return;

    const [missionsRes, scoresRes, outcomesRes] = await Promise.all([
      supabase.from('missions').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
      supabase.from('mission_scores').select('*').eq('tenant_id', profile.tenant_id),
      supabase.from('outcome_events').select('*').eq('tenant_id', profile.tenant_id).order('measured_at', { ascending: false }).limit(20),
    ]);

    const missions: DbMission[] = missionsRes.data ?? [];
    const scores: DbMissionScore[] = scoresRes.data ?? [];
    const scoreMap = Object.fromEntries(scores.map((s) => [s.mission_id, s]));

    const withScore: ScoredMission[] = [];
    const without: DbMission[] = [];

    missions.forEach((m) => {
      if (scoreMap[m.id]) withScore.push({ mission: m, score: scoreMap[m.id] });
      else without.push(m);
    });

    withScore.sort((a, b) => b.score.mei - a.score.mei);

    setScored(withScore);
    setUnscored(without);
    setOutcomes(outcomesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function computeMEI() {
    setComputing(true);
    try {
      const res = await fetch('/api/mei/compute', { method: 'POST' });
      if (res.ok) await loadData();
    } finally {
      setComputing(false);
    }
  }

  const avgMEI = scored.length > 0
    ? Math.round(scored.reduce((s, m) => s + m.score.mei, 0) / scored.length)
    : 0;

  const topMission = scored[0] ?? null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#e8f0fe]">Outcome Center</h1>
          <p className="text-[#7a8fa8] text-sm mt-0.5">Mission Effectiveness Index (MEI) · Outcome events · Performance rankings</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={computeMEI}
          disabled={computing}
          className="flex items-center gap-2 h-10 px-5 bg-accent text-[#060a0e] rounded-xl font-semibold text-sm shadow-[0_4px_16px_rgba(0,230,118,0.35)] disabled:opacity-60"
        >
          {computing ? <Loader2 size={15} strokeWidth={2} className="animate-spin" /> : <RefreshCw size={15} strokeWidth={2} />}
          Compute MEI
        </motion.button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Average MEI', value: avgMEI, icon: Activity, color: 'text-accent', bg: 'bg-accent-light' },
          { label: 'Scored Missions', value: scored.length, icon: Target, color: 'text-[#6D5DFD]', bg: 'bg-[#001a22]' },
          { label: 'Outcome Events', value: outcomes.length, icon: CheckCircle2, color: 'text-[#818cf8]', bg: 'bg-[#0f0f2a]' },
          { label: 'Top MEI', value: topMission ? Math.round(topMission.score.mei) : '—', icon: Trophy, color: 'text-[#fbbf24]', bg: 'bg-[#2a1a00]' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111927] border border-[#1c2a3a] rounded-2xl p-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', bg)}>
              <Icon size={20} className={color} strokeWidth={2} />
            </div>
            <p className={cn('text-[28px] font-bold', color)}>{value}</p>
            <p className="text-[#7a8fa8] text-[13px] font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* MEI leaderboard */}
          <div>
            <div className="bg-[#111927] border border-[#1c2a3a] rounded-2xl overflow-hidden mb-5">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[#1c2a3a]">
                <TrendingUp size={16} className="text-accent" strokeWidth={2} />
                <h2 className="text-[15px] font-bold text-[#e8f0fe]">MEI Leaderboard</h2>
                <span className="ml-auto text-[11px] text-[#3d5068]">40% completion · 25% engagement · 20% retention · 15% outcome</span>
              </div>

              {scored.length === 0 ? (
                <div className="py-16 text-center">
                  <Activity size={32} className="text-[#3d5068] mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-[#7a8fa8] font-medium mb-1">No scores yet</p>
                  <p className="text-[#3d5068] text-sm">Click &ldquo;Compute MEI&rdquo; to score all missions.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1c2a3a]">
                  {scored.map(({ mission: m, score: s }, i) => {
                    const band = MEI_BAND(s.mei);
                    const isSelected = selected === m.id;
                    return (
                      <div key={m.id}>
                        <button
                          onClick={() => setSelected(isSelected ? null : m.id)}
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#162030] transition-colors text-left"
                        >
                          <span className="text-[13px] font-bold text-[#3d5068] w-6 flex-shrink-0">#{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[#e8f0fe] truncate">{m.title}</p>
                            <p className="text-[11px] text-[#7a8fa8] mt-0.5">{s.sample_size} attempts</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-[#162030] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${s.mei}%` }}
                                transition={{ duration: 0.6, delay: i * 0.04 }}
                                className={cn('h-full rounded-full', band.bar)}
                              />
                            </div>
                            <span className={cn('text-[14px] font-bold w-8 text-right', band.color)}>{Math.round(s.mei)}</span>
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', band.bg, band.color)}>
                              {band.label}
                            </span>
                          </div>
                        </button>

                        {isSelected && (
                          <div className="px-6 pb-4 bg-[#0a1020] border-t border-[#1c2a3a]">
                            <div className="grid grid-cols-2 gap-4 py-4">
                              <ScoreBar label="Completion" value={s.completion_score} color="bg-accent" />
                              <ScoreBar label="Engagement" value={s.engagement_score} color="bg-[#6D5DFD]" />
                              <ScoreBar label="Retention" value={s.retention_score} color="bg-[#818cf8]" />
                              <ScoreBar label="Outcome" value={s.outcome_score} color="bg-[#fbbf24]" />
                            </div>
                            <p className="text-[11px] text-[#3d5068]">
                              Last computed: {new Date(s.computed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Unscored missions */}
            {unscored.length > 0 && (
              <div className="bg-[#111927] border border-[#1c2a3a] rounded-2xl p-5">
                <p className="text-[13px] font-bold text-[#7a8fa8] mb-3">{unscored.length} missions not yet scored</p>
                <div className="flex flex-wrap gap-2">
                  {unscored.map((m) => (
                    <span key={m.id} className="text-[11px] px-2.5 py-1 bg-[#162030] text-[#3d5068] rounded-full">{m.title}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: outcome events + top mission detail */}
          <div className="flex flex-col gap-5">
            {/* Top mission spotlight */}
            {topMission && (
              <div className="bg-gradient-to-br from-[#002918] to-[#001a12] border border-[#004d2a] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={15} className="text-accent" strokeWidth={2} />
                  <p className="text-[12px] font-bold text-accent uppercase tracking-wider">Top Performer</p>
                </div>
                <p className="text-[16px] font-bold text-[#e8f0fe] mb-1">{topMission.mission.title}</p>
                <p className="text-[28px] font-black text-accent leading-none mb-3">{Math.round(topMission.score.mei)}</p>
                <div className="flex flex-col gap-2">
                  <ScoreBar label="Completion" value={topMission.score.completion_score} color="bg-accent" />
                  <ScoreBar label="Engagement" value={topMission.score.engagement_score} color="bg-[#6D5DFD]" />
                  <ScoreBar label="Retention" value={topMission.score.retention_score} color="bg-[#818cf8]" />
                </div>
              </div>
            )}

            {/* Outcome events */}
            <div className="bg-[#111927] border border-[#1c2a3a] rounded-2xl overflow-hidden flex-1">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1c2a3a]">
                <Zap size={15} className="text-[#818cf8]" strokeWidth={2} />
                <h2 className="text-[14px] font-bold text-[#e8f0fe]">Recent Outcomes</h2>
              </div>
              {outcomes.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <p className="text-[#7a8fa8] text-[13px] mb-1">No outcomes recorded</p>
                  <p className="text-[#3d5068] text-[12px]">Write to outcome_events via API when participants achieve real-world results.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1c2a3a]">
                  {outcomes.map((o) => (
                    <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-7 h-7 rounded-lg bg-[#0f0f2a] flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight size={13} className="text-[#818cf8]" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#e8f0fe] capitalize">{o.outcome_type.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-[#3d5068]">
                          {new Date(o.measured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
