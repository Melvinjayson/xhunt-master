'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Coins, Activity, ShieldCheck, TrendingUp,
  CheckCircle2, Clock, XCircle, Award, Users,
  Link2, ArrowUpRight, Plus, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface ContributionItem {
  id: string;
  contribution_type: string;
  description: string | null;
  value_points: number;
  status: string;
  created_at: string;
}

interface ContributionSummary {
  total_contributions: number;
  total_value_points: number;
  validated_contributions: number;
  pending_validations: number;
}

interface TrustProfile {
  reliability_score: number;
  skill_score: number;
  ethical_score: number;
  domain_expertise_score: number;
  composite_score: number;
}

interface MatchResult {
  id: string;
  mission_title: string;
  match_score: number;
  skill_match: number;
  trust_match: number;
  status: string;
}

type TabId = 'overview' | 'contributions' | 'trust' | 'matches';

const CONTRIBUTION_TYPE_LABELS: Record<string, string> = {
  mission_completion: 'Mission Completed',
  peer_review:        'Peer Review',
  content_creation:   'Content Created',
  skill_verification: 'Skill Verified',
  community_vote:     'Community Vote',
  governance_action:  'Governance Action',
  knowledge_contribution: 'Knowledge Added',
  mentorship:         'Mentorship',
};

export default function WorkspaceEconomyPage() {
  const [tab, setTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [summary, setSummary] = useState<ContributionSummary | null>(null);
  const [trust, setTrust] = useState<TrustProfile | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [cSumRes, cRes, tRes, mRes] = await Promise.all([
          fetch('/api/economy/contributions?summary=true'),
          fetch('/api/economy/contributions?limit=10'),
          fetch('/api/economy/trust'),
          fetch('/api/economy/match'),
        ]);
        const [cSum, c, t, m] = await Promise.all([
          cSumRes.json(), cRes.json(), tRes.json(), mRes.json(),
        ]);
        setSummary(cSum.summary ?? null);
        setContributions(c.contributions ?? []);
        setTrust(t.profile ?? null);
        setMatches(m.matches ?? []);
      } catch (err) {
        console.error('[economy]', err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const trustPct = trust ? Math.round(trust.composite_score * 100) : null;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#fbbf24]/10 border border-[#fbbf24]/20 flex items-center justify-center">
              <Coins size={17} className="text-[#fbbf24]" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-[24px] font-bold text-[#F0F4FF] leading-tight">Economy</h1>
              <p className="text-[11px] text-[#4A5578]">Your participation ledger</p>
            </div>
          </div>
          <p className="text-[#8B9CC0] text-[13px]">
            Every contribution you make is tracked, validated, and rewarded fairly
          </p>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Contributions', value: summary?.total_contributions ?? '—', icon: Activity, color: 'text-accent' },
          { label: 'Value Points', value: summary?.total_value_points ?? '—', icon: TrendingUp, color: 'text-[#6D5DFD]' },
          { label: 'Validated', value: summary?.validated_contributions ?? '—', icon: CheckCircle2, color: 'text-[#34d399]' },
          { label: 'Trust Score', value: trustPct != null ? `${trustPct}%` : '—', icon: ShieldCheck, color: 'text-[#fbbf24]' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#07101F] border border-[#0F1D35] rounded-xl px-4 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={13} className={color} strokeWidth={1.8} />
              <p className="text-[10px] font-bold text-[#4A5578] uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-[20px] font-bold text-[#F0F4FF]">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['overview', 'contributions', 'trust', 'matches'] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 h-9 rounded-xl text-[13px] font-semibold transition-all capitalize',
              tab === t
                ? 'bg-accent text-[#060a0e]'
                : 'bg-[#07101F] text-[#8B9CC0] border border-[#0F1D35] hover:border-[#1A2E50]'
            )}
          >
            {t === 'matches' ? 'Opportunity Matches' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'overview' ? (
        <OverviewTab contributions={contributions} summary={summary} trust={trust} matches={matches} />
      ) : tab === 'contributions' ? (
        <ContributionsTab contributions={contributions} />
      ) : tab === 'trust' ? (
        <TrustTab trust={trust} />
      ) : (
        <MatchesTab matches={matches} />
      )}
    </div>
  );
}

function OverviewTab({ contributions, summary, trust, matches }: {
  contributions: ContributionItem[];
  summary: ContributionSummary | null;
  trust: TrustProfile | null;
  matches: MatchResult[];
}) {
  return (
    <div className="space-y-6">
      {/* Progress rings row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Validation rate */}
        <div className="bg-[#07101F] border border-[#0F1D35] rounded-2xl p-5">
          <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-3">Validation Rate</p>
          {summary && summary.total_contributions > 0 ? (
            <>
              <p className="text-[32px] font-bold text-accent leading-none">
                {Math.round((summary.validated_contributions / summary.total_contributions) * 100)}%
              </p>
              <p className="text-[11px] text-[#8B9CC0] mt-1">
                {summary.validated_contributions} of {summary.total_contributions} validated
              </p>
              <div className="mt-3 h-1.5 bg-[#0A1226] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(summary.validated_contributions / summary.total_contributions) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
            </>
          ) : (
            <p className="text-[#4A5578] text-sm">No data yet</p>
          )}
        </div>

        {/* Trust score */}
        <div className="bg-[#07101F] border border-[#0F1D35] rounded-2xl p-5">
          <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-3">Composite Trust</p>
          {trust ? (
            <>
              <p className="text-[32px] font-bold text-[#fbbf24] leading-none">
                {(trust.composite_score * 100).toFixed(1)}%
              </p>
              <p className="text-[11px] text-[#8B9CC0] mt-1">Weighted across 4 dimensions</p>
              <div className="mt-3 h-1.5 bg-[#0A1226] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${trust.composite_score * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-[#fbbf24] rounded-full"
                />
              </div>
            </>
          ) : (
            <p className="text-[#4A5578] text-sm">No trust data</p>
          )}
        </div>

        {/* Matches */}
        <div className="bg-[#07101F] border border-[#0F1D35] rounded-2xl p-5">
          <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-3">Opportunity Matches</p>
          <p className="text-[32px] font-bold text-[#6D5DFD] leading-none">{matches.length}</p>
          <p className="text-[11px] text-[#8B9CC0] mt-1">
            {matches.filter((m) => m.match_score >= 0.7).length} high-quality matches
          </p>
        </div>
      </div>

      {/* Recent contributions */}
      <div className="bg-[#07101F] border border-[#0F1D35] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#0F1D35]">
          <p className="text-[14px] font-bold text-[#F0F4FF]">Recent Contributions</p>
        </div>
        {contributions.length === 0 ? (
          <div className="py-12 text-center">
            <Activity size={28} className="text-[#2A3550] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-[#4A5578] text-sm">No contributions yet</p>
            <p className="text-[#2A3550] text-[12px] mt-1">Complete missions and collaborate to earn value points</p>
          </div>
        ) : (
          <div className="divide-y divide-[#0F1D35]">
            {contributions.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                  item.status === 'validated' ? 'bg-accent/10' : item.status === 'pending' ? 'bg-[#fbbf24]/10' : 'bg-[#ff5252]/10'
                )}>
                  {item.status === 'validated' ? (
                    <CheckCircle2 size={13} className="text-accent" strokeWidth={2} />
                  ) : item.status === 'pending' ? (
                    <Clock size={13} className="text-[#fbbf24]" strokeWidth={2} />
                  ) : (
                    <XCircle size={13} className="text-[#ff5252]" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#F0F4FF] truncate">
                    {CONTRIBUTION_TYPE_LABELS[item.contribution_type] ?? item.contribution_type}
                  </p>
                  {item.description && (
                    <p className="text-[11px] text-[#4A5578] truncate">{item.description}</p>
                  )}
                </div>
                <span className="text-[13px] font-bold text-accent flex-shrink-0">+{item.value_points}</span>
                <span className="text-[11px] text-[#4A5578] flex-shrink-0">
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top match preview */}
      {matches.length > 0 && (
        <div className="bg-[#07101F] border border-[#0F1D35] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0F1D35]">
            <p className="text-[14px] font-bold text-[#F0F4FF]">Top Opportunity Matches</p>
          </div>
          <div className="divide-y divide-[#0F1D35]">
            {matches.slice(0, 3).map((match) => (
              <div key={match.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-[#6D5DFD]/10 border border-[#6D5DFD]/20 flex items-center justify-center flex-shrink-0">
                  <Award size={15} className="text-[#A99FFE]" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#F0F4FF] truncate">{match.mission_title}</p>
                  <p className="text-[11px] text-[#4A5578]">
                    Skill: {Math.round(match.skill_match * 100)}% · Trust: {Math.round(match.trust_match * 100)}%
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[14px] font-bold text-accent">{Math.round(match.match_score * 100)}%</p>
                  <p className="text-[10px] text-[#4A5578]">match</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContributionsTab({ contributions }: { contributions: ContributionItem[] }) {
  return (
    <div className="bg-[#07101F] border border-[#0F1D35] rounded-2xl overflow-hidden">
      <div className="grid grid-cols-[2fr_1fr_80px_80px_100px] gap-4 px-5 py-3 border-b border-[#0F1D35]">
        {['Contribution', 'Type', 'Points', 'Status', 'Date'].map((h) => (
          <span key={h} className="text-[10px] font-bold text-[#4A5578] uppercase tracking-wider">{h}</span>
        ))}
      </div>
      {contributions.length === 0 ? (
        <div className="py-16 text-center">
          <Activity size={28} className="text-[#2A3550] mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-[#4A5578] text-sm">No contributions yet</p>
        </div>
      ) : (
        <div className="divide-y divide-[#0F1D35]">
          {contributions.map((item) => (
            <div key={item.id} className="grid grid-cols-[2fr_1fr_80px_80px_100px] gap-4 items-center px-5 py-3">
              <div className="min-w-0">
                <p className="text-[13px] text-[#F0F4FF] truncate">
                  {item.description ?? CONTRIBUTION_TYPE_LABELS[item.contribution_type] ?? item.contribution_type}
                </p>
              </div>
              <span className="text-[11px] text-[#8B9CC0] capitalize">
                {(CONTRIBUTION_TYPE_LABELS[item.contribution_type] ?? item.contribution_type).split(' ')[0]}
              </span>
              <span className="text-[13px] font-bold text-accent">+{item.value_points}</span>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full self-start',
                item.status === 'validated' ? 'text-accent bg-accent/10' :
                item.status === 'pending' ? 'text-[#fbbf24] bg-[#fbbf24]/10' : 'text-[#ff5252] bg-[#ff5252]/10'
              )}>
                {item.status}
              </span>
              <span className="text-[11px] text-[#4A5578]">
                {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrustTab({ trust }: { trust: TrustProfile | null }) {
  if (!trust) {
    return (
      <div className="py-24 text-center bg-[#07101F] border border-[#0F1D35] rounded-2xl">
        <ShieldCheck size={36} className="text-[#2A3550] mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-[#8B9CC0]">No trust profile yet</p>
        <p className="text-[#4A5578] text-sm mt-1">Complete contributions and earn peer validations to build trust</p>
      </div>
    );
  }

  const dimensions = [
    { key: 'reliability_score', label: 'Reliability', weight: '35%', value: trust.reliability_score, color: '#22FFAA',
      description: 'Consistent delivery, follow-through on commitments' },
    { key: 'skill_score', label: 'Skill', weight: '30%', value: trust.skill_score, color: '#6D5DFD',
      description: 'Demonstrated competence and knowledge depth' },
    { key: 'ethical_score', label: 'Ethical', weight: '25%', value: trust.ethical_score, color: '#34d399',
      description: 'Honest, fair, and beneficial conduct' },
    { key: 'domain_expertise_score', label: 'Domain Expertise', weight: '10%', value: trust.domain_expertise_score, color: '#fbbf24',
      description: 'Specialized knowledge in your focus areas' },
  ];

  return (
    <div className="space-y-5">
      {/* Composite score */}
      <div className="bg-[#07101F] border border-[#0F1D35] rounded-2xl p-6 flex items-center gap-6">
        <div className="flex-shrink-0">
          <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-1">Composite Trust Score</p>
          <p className="text-[48px] font-bold text-accent leading-none">{(trust.composite_score * 100).toFixed(1)}%</p>
        </div>
        <div className="flex-1">
          <div className="h-3 bg-[#0A1226] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trust.composite_score * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-accent to-[#6D5DFD] rounded-full"
            />
          </div>
          <p className="text-[11px] text-[#4A5578] mt-2">
            Weighted composite of 4 dimensions · Updates as peers validate your work
          </p>
        </div>
      </div>

      {/* Dimension breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensions.map(({ label, weight, value, color, description }) => (
          <div key={label} className="bg-[#07101F] border border-[#0F1D35] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13px] font-bold text-[#F0F4FF]">{label}</p>
                <p className="text-[11px] text-[#4A5578] mt-0.5">{description}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-[22px] font-bold leading-none" style={{ color }}>
                  {(value * 100).toFixed(0)}
                </p>
                <p className="text-[9px] text-[#4A5578]">weight: {weight}</p>
              </div>
            </div>
            <div className="h-1.5 bg-[#0A1226] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value * 100}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchesTab({ matches }: { matches: MatchResult[] }) {
  const [recomputing, setRecomputing] = useState(false);

  async function recompute() {
    setRecomputing(true);
    try {
      await fetch('/api/economy/match?recompute=true');
    } catch (err) {
      console.error('[recompute]', err);
    } finally {
      setRecomputing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#8B9CC0]">{matches.length} opportunities matched to your profile</p>
        <button
          onClick={recompute}
          disabled={recomputing}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#07101F] border border-[#0F1D35] text-[#8B9CC0] rounded-lg text-[12px] font-medium hover:border-accent/30 hover:text-accent transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={recomputing ? 'animate-spin' : ''} strokeWidth={2} />
          Recompute
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="py-24 text-center bg-[#07101F] border border-[#0F1D35] rounded-2xl">
          <Users size={36} className="text-[#2A3550] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[#8B9CC0]">No matches computed yet</p>
          <p className="text-[#4A5578] text-sm mt-1">Update your match signals to find opportunities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#07101F] border border-[#0F1D35] rounded-2xl p-5 hover:border-[#1A2E50] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-[14px] font-bold text-[#F0F4FF] flex-1 pr-3">{match.mission_title}</p>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[20px] font-bold text-accent leading-none">{Math.round(match.match_score * 100)}%</p>
                  <p className="text-[10px] text-[#4A5578]">match</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Skill', value: match.skill_match, color: '#6D5DFD' },
                  { label: 'Trust', value: match.trust_match, color: '#fbbf24' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#4A5578]">{label}</span>
                      <span style={{ color }}>{Math.round(value * 100)}%</span>
                    </div>
                    <div className="h-1 bg-[#0A1226] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${value * 100}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  match.status === 'accepted' ? 'text-accent bg-accent/10' :
                  match.status === 'pending' ? 'text-[#fbbf24] bg-[#fbbf24]/10' : 'text-[#8B9CC0] bg-[#0A1226]'
                )}>
                  {match.status}
                </span>
                <ArrowUpRight size={14} className="text-[#4A5578]" strokeWidth={1.8} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
