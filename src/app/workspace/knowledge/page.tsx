'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Network, Search, Filter, Plus, Users, Target, TrendingUp, Award,
  Building2, Briefcase, Zap, ChevronRight, GitBranch, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import type { DbKgNode, DbKgEdge } from '@/lib/supabase/types';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-[#0D1530] animate-pulse rounded-lg', className)} />;
}

const NODE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  user:         { label: 'User',         icon: Users,     color: '#6D5DFD', bg: '#6D5DFD20' },
  mission:      { label: 'Mission',      icon: Target,    color: '#22FFAA', bg: '#22FFAA15' },
  outcome:      { label: 'Outcome',      icon: TrendingUp,color: '#FFB84D', bg: '#FFB84D15' },
  reward:       { label: 'Reward',       icon: Award,     color: '#FF5C7A', bg: '#FF5C7A15' },
  skill:        { label: 'Skill',        icon: Zap,       color: '#22FFAA', bg: '#22FFAA10' },
  organization: { label: 'Organization', icon: Building2, color: '#8B9CC0', bg: '#8B9CC020' },
  industry:     { label: 'Industry',     icon: Briefcase, color: '#FFB84D', bg: '#FFB84D10' },
};

const REL_LABELS: Record<string, string> = {
  completes: 'Completes',
  requires: 'Requires',
  develops: 'Develops',
  unlocks: 'Unlocks',
  leads_to: 'Leads To',
  similar_to: 'Similar To',
};

export default function KnowledgePage() {
  const [nodes, setNodes] = useState<DbKgNode[]>([]);
  const [edges, setEdges] = useState<DbKgEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DbKgNode | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) return;

      const [nodesRes, edgesRes] = await Promise.all([
        supabase.from('kg_nodes').select('*').eq('tenant_id', profile.tenant_id).limit(100),
        supabase.from('kg_edges').select('*').eq('tenant_id', profile.tenant_id).limit(200),
      ]);

      setNodes(nodesRes.data ?? []);
      setEdges(edgesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = nodes.filter((n) => {
    if (typeFilter !== 'all' && n.node_type !== typeFilter) return false;
    if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const nodeCounts: Record<string, number> = {};
  nodes.forEach((n) => { nodeCounts[n.node_type] = (nodeCounts[n.node_type] ?? 0) + 1; });

  const selectedEdges = selected
    ? edges.filter((e) => e.from_node_id === selected.id || e.to_node_id === selected.id)
    : [];

  const connectedIds = new Set(selectedEdges.flatMap((e) => [e.from_node_id, e.to_node_id]));
  const connectedNodes = selected
    ? nodes.filter((n) => connectedIds.has(n.id) && n.id !== selected.id)
    : [];

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22FFAA]/8 border border-[#22FFAA]/15 flex items-center justify-center">
            <Network size={18} className="text-[#22FFAA]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#F0F4FF]">Knowledge Graph</h1>
            <p className="text-[#4A5578] text-[12px]">{nodes.length} nodes · {edges.length} relationships</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/knowledge-graph">
            <button className="flex items-center gap-2 h-9 px-4 bg-[#0A1226] border border-[#162440] text-[#F0F4FF] rounded-xl font-medium text-[13px] hover:border-[#22FFAA]/30 transition-colors">
              <GitBranch size={13} strokeWidth={2} />
              Full Graph View
            </button>
          </Link>
        </div>
      </div>

      {/* Node Type Summary */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(NODE_CONFIG).slice(0, 4).map(([type, cfg], i) => (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
            className={cn(
              'bg-[#0A1226] border rounded-xl p-4 cursor-pointer transition-all',
              typeFilter === type ? 'border-[#22FFAA]/30' : 'border-[#0F1D35] hover:border-[#162440]'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                <cfg.icon size={15} strokeWidth={1.8} style={{ color: cfg.color }} />
              </div>
              <span className="text-[20px] font-bold tabular-nums" style={{ color: cfg.color }}>
                {nodeCounts[type] ?? 0}
              </span>
            </div>
            <p className="text-[#8B9CC0] text-[11px] font-medium mt-2">{cfg.label}s</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Node List */}
        <div className="col-span-2 bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#0F1D35]">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5578]" strokeWidth={2} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes…"
                className="w-full h-9 pl-8 pr-3 bg-[#07101F] border border-[#0F1D35] rounded-xl text-[13px] text-[#F0F4FF] placeholder:text-[#4A5578] focus:outline-none focus:border-[#162440]"
              />
            </div>
            <div className="flex items-center gap-1 bg-[#07101F] border border-[#0F1D35] rounded-xl p-1">
              <button onClick={() => setTypeFilter('all')} className={cn('px-2.5 h-7 rounded-lg text-[10px] font-bold transition-all', typeFilter === 'all' ? 'bg-[#0D1530] text-[#F0F4FF]' : 'text-[#4A5578] hover:text-[#8B9CC0]')}>All</button>
              {Object.keys(NODE_CONFIG).slice(0, 4).map((t) => (
                <button key={t} onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)} className={cn('px-2.5 h-7 rounded-lg text-[10px] font-bold transition-all capitalize', typeFilter === t ? 'bg-[#0D1530] text-[#F0F4FF]' : 'text-[#4A5578] hover:text-[#8B9CC0]')}>{t}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex-1 py-16 text-center">
              <Network size={28} className="text-[#4A5578] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[#8B9CC0] font-medium">No nodes found</p>
              <p className="text-[#4A5578] text-sm mt-1">
                {nodes.length === 0
                  ? 'Knowledge graph is being populated as users complete missions.'
                  : 'No nodes match your current filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#0F1D35] overflow-y-auto flex-1">
              {filtered.map((node) => {
                const cfg = NODE_CONFIG[node.node_type] ?? NODE_CONFIG.user;
                const edgeCount = edges.filter((e) => e.from_node_id === node.id || e.to_node_id === node.id).length;
                const isSelected = selected?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelected(isSelected ? null : node)}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors',
                      isSelected ? 'bg-[#22FFAA]/5 border-l-2 border-[#22FFAA]' : 'hover:bg-[#0D1530] border-l-2 border-transparent'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                      <cfg.icon size={14} strokeWidth={1.8} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[13px] font-medium truncate', isSelected ? 'text-[#22FFAA]' : 'text-[#F0F4FF]')}>{node.label}</p>
                      <p className="text-[10px] text-[#4A5578] capitalize">{node.node_type} · {edgeCount} connections</p>
                    </div>
                    <ChevronRight size={13} className={cn('flex-shrink-0', isSelected ? 'text-[#22FFAA]' : 'text-[#4A5578]')} strokeWidth={2} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Node Detail / Connections */}
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  {(() => {
                    const cfg = NODE_CONFIG[selected.node_type] ?? NODE_CONFIG.user;
                    return (
                      <>
                        <div>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: cfg.bg }}>
                            <cfg.icon size={18} strokeWidth={1.8} style={{ color: cfg.color }} />
                          </div>
                          <p className="text-[14px] font-bold text-[#F0F4FF]">{selected.label}</p>
                          <p className="text-[11px] text-[#4A5578] capitalize mt-0.5">{selected.node_type}</p>
                        </div>
                        <button onClick={() => setSelected(null)} className="text-[#4A5578] hover:text-[#8B9CC0] text-[12px]">✕</button>
                      </>
                    );
                  })()}
                </div>

                <div className="pt-3 border-t border-[#0F1D35]">
                  <p className="text-[10px] font-bold text-[#4A5578] uppercase tracking-wider mb-2">Properties</p>
                  {Object.entries(selected.properties ?? {}).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1">
                      <span className="text-[11px] text-[#4A5578] capitalize">{k.replace('_', ' ')}</span>
                      <span className="text-[11px] text-[#8B9CC0] font-medium">{String(v).slice(0, 30)}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-[#4A5578] mt-2">
                    Added {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-4">
                <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-3">
                  Connections ({connectedNodes.length})
                </p>
                {connectedNodes.length === 0 ? (
                  <p className="text-[12px] text-[#4A5578]">No connections found for this node.</p>
                ) : (
                  <div className="space-y-2">
                    {connectedNodes.slice(0, 8).map((cn_node) => {
                      const edge = selectedEdges.find((e) => e.from_node_id === cn_node.id || e.to_node_id === cn_node.id);
                      const cfg2 = NODE_CONFIG[cn_node.node_type] ?? NODE_CONFIG.user;
                      return (
                        <div key={cn_node.id} className="flex items-center gap-2 p-2 bg-[#07101F] rounded-xl">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg2.bg }}>
                            <cfg2.icon size={11} strokeWidth={2} style={{ color: cfg2.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-[#F0F4FF] font-medium truncate">{cn_node.label}</p>
                            <p className="text-[9px] text-[#4A5578] capitalize">{REL_LABELS[edge?.relationship ?? ''] ?? edge?.relationship ?? 'connected'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5 flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#22FFAA]/8 border border-[#22FFAA]/15 flex items-center justify-center">
                <Network size={20} className="text-[#22FFAA]" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-bold text-[#F0F4FF]">Select a Node</p>
              <p className="text-[12px] text-[#4A5578]">Click any node to explore its connections and properties.</p>
            </div>
          )}

          {/* Type Legend */}
          <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-4">
            <p className="text-[11px] font-bold text-[#4A5578] uppercase tracking-wider mb-3">Node Types</p>
            <div className="space-y-2">
              {Object.entries(NODE_CONFIG).map(([type, cfg]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                      <cfg.icon size={11} strokeWidth={2} style={{ color: cfg.color }} />
                    </div>
                    <span className="text-[11px] text-[#8B9CC0] capitalize">{cfg.label}</span>
                  </div>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: cfg.color }}>
                    {nodeCounts[type] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
