'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Code2, Key, Webhook, BarChart3, Eye, EyeOff, Copy, Plus,
  Check, RefreshCw, ExternalLink, Terminal, AlertCircle,
  Zap, Globe, Activity, ChevronRight, BookOpen
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';

const API_ENDPOINTS = [
  // Missions
  { method: 'GET',    path: '/api/missions',                    desc: 'List all missions for your tenant', group: 'Missions' },
  { method: 'POST',   path: '/api/missions',                    desc: 'Create a new mission', group: 'Missions' },
  { method: 'GET',    path: '/api/missions/{id}',               desc: 'Get mission details', group: 'Missions' },
  { method: 'POST',   path: '/api/generate-hunts',              desc: 'AI-generate mission from description', group: 'Missions' },
  // Outcomes & Revenue
  { method: 'GET',    path: '/api/outcomes/validations',        desc: 'List outcome validations', group: 'Outcomes' },
  { method: 'GET',    path: '/api/revenue',                     desc: 'Revenue records for your tenant', group: 'Revenue' },
  // AI Agents
  { method: 'POST',   path: '/api/agents/insight-analyst',      desc: 'Generate AI operational briefing', group: 'AI Agents' },
  { method: 'POST',   path: '/api/agents/mission-architect',    desc: 'AI mission design assistance', group: 'AI Agents' },
  { method: 'POST',   path: '/api/agents/experience-designer',  desc: 'Design adaptive participant experiences', group: 'AI Agents' },
  { method: 'POST',   path: '/api/agents/knowledge-agent',      desc: 'Query the organizational knowledge graph', group: 'AI Agents' },
  // Economy Protocol
  { method: 'GET',    path: '/api/economy/contributions',       desc: 'List value contributions for your tenant', group: 'Economy' },
  { method: 'GET',    path: '/api/economy/trust',               desc: 'Get composite trust score and dimensions', group: 'Economy' },
  { method: 'GET',    path: '/api/economy/match',               desc: 'Get opportunity matches based on trust profile', group: 'Economy' },
  { method: 'GET',    path: '/api/economy/governance',          desc: 'Economy governance audit log', group: 'Economy' },
  // XIL
  { method: 'GET',    path: '/api/xil',                         desc: 'Get XIL agent registry (view=registry) or constitutional health (view=health)', group: 'XIL' },
  { method: 'POST',   path: '/api/xil',                         desc: 'Invoke XIL intelligence function (personal/community/marketplace/impact)', group: 'XIL' },
  // Workspace Features
  { method: 'GET',    path: '/api/workspace/features',          desc: 'Get tenant feature configuration (nav flags, feature toggles, branding)', group: 'Workspace' },
  { method: 'PATCH',  path: '/api/workspace/features',          desc: 'Update feature flags, nav visibility, branding or theme for your tenant', group: 'Workspace' },
];

const EVENTS = [
  { name: 'mission.completed',        desc: 'Triggered when a participant completes a mission' },
  { name: 'mission.started',          desc: 'Triggered when a participant begins a mission' },
  { name: 'mission.published',        desc: 'Triggered when a mission goes live' },
  { name: 'outcome.validated',        desc: 'Triggered when an outcome is validated' },
  { name: 'reward.issued',            desc: 'Triggered when a reward is issued to a participant' },
  { name: 'economy.contribution',     desc: 'Triggered when a value contribution is recorded' },
  { name: 'economy.trust_updated',    desc: 'Triggered when a trust score is recomputed' },
  { name: 'economy.match_available',  desc: 'Triggered when a new opportunity match is available' },
  { name: 'xil.constitutional_flag',  desc: 'Triggered when the XIL constitution flags a concern' },
  { name: 'feature.config_updated',   desc: 'Triggered when tenant feature config or branding changes' },
];

const METHOD_COLOR: Record<string, string> = {
  GET:    'text-[#22FFAA] bg-[#22FFAA]/10',
  POST:   'text-[#6D5DFD] bg-[#6D5DFD]/10',
  PUT:    'text-[#FFB84D] bg-[#FFB84D]/10',
  PATCH:  'text-[#FFB84D] bg-[#FFB84D]/10',
  DELETE: 'text-[#FF5C7A] bg-[#FF5C7A]/10',
};

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'webhooks' | 'logs'>('overview');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [usageStats] = useState({ requests: 4291, errors: 12, latencyMs: 143 });

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const apiKey = 'xhunt_sk_live_••••••••••••••••••••••••••••••••';
  const apiKeyFull = 'xhunt_sk_live_t3st_k3y_p1ac3h0ld3r_12345';

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6D5DFD]/10 border border-[#6D5DFD]/20 flex items-center justify-center">
            <Code2 size={18} className="text-[#6D5DFD]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#F0F4FF]">Developer Portal</h1>
            <p className="text-[#4A5578] text-[12px]">API keys, webhooks, and usage</p>
          </div>
        </div>
        <a
          href="https://docs.xhunt.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 h-9 px-4 bg-[#0A1226] border border-[#162440] text-[#F0F4FF] rounded-xl font-medium text-[13px] hover:border-[#6D5DFD]/40 transition-colors"
        >
          <BookOpen size={13} strokeWidth={2} />
          Documentation
        </a>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'API Requests (30d)', value: usageStats.requests.toLocaleString(), icon: Activity,  color: 'text-[#22FFAA]', bg: 'bg-[#22FFAA]/8' },
          { label: 'Error Rate',         value: `${((usageStats.errors / usageStats.requests) * 100).toFixed(1)}%`, icon: AlertCircle, color: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10' },
          { label: 'Avg Latency',        value: `${usageStats.latencyMs}ms`, icon: Zap, color: 'text-[#6D5DFD]', bg: 'bg-[#6D5DFD]/10' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bg)}>
              <Icon size={16} className={color} strokeWidth={1.8} />
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-[#4A5578] text-[11px] mt-0.5 font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0A1226] border border-[#0F1D35] rounded-xl p-1 w-fit">
        {(['overview', 'api', 'webhooks', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn('h-7 px-4 rounded-lg text-[12px] font-semibold transition-all capitalize', activeTab === tab ? 'bg-[#0D1530] text-[#F0F4FF]' : 'text-[#4A5578] hover:text-[#8B9CC0]')}
          >{tab}</button>
        ))}
      </div>

      {/* API Keys */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key size={14} className="text-[#22FFAA]" strokeWidth={2} />
                <p className="text-[13px] font-bold text-[#F0F4FF]">API Keys</p>
              </div>
              <button className="flex items-center gap-1.5 h-8 px-3 bg-accent/10 border border-accent/20 text-accent rounded-xl text-[11px] font-semibold hover:bg-accent/15 transition-colors">
                <Plus size={11} strokeWidth={2.5} />Generate Key
              </button>
            </div>

            <div className="bg-[#07101F] border border-[#0F1D35] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-bold text-[#F0F4FF]">Live API Key</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22FFAA] breathe" />
                  <span className="text-[10px] font-bold text-[#22FFAA]">Active</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#0A1226] border border-[#0F1D35] rounded-xl px-3 py-2.5">
                <Terminal size={12} className="text-[#4A5578] flex-shrink-0" strokeWidth={2} />
                <code className="flex-1 text-[12px] font-mono text-[#8B9CC0] truncate">
                  {apiKeyVisible ? apiKeyFull : apiKey}
                </code>
                <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="text-[#4A5578] hover:text-[#8B9CC0] transition-colors">
                  {apiKeyVisible ? <EyeOff size={13} strokeWidth={2} /> : <Eye size={13} strokeWidth={2} />}
                </button>
                <button onClick={() => copy(apiKeyFull, 'key')} className="text-[#4A5578] hover:text-[#22FFAA] transition-colors">
                  {copied === 'key' ? <Check size={13} strokeWidth={2.5} className="text-[#22FFAA]" /> : <Copy size={13} strokeWidth={2} />}
                </button>
              </div>
              <p className="text-[10px] text-[#4A5578] mt-2">Created Dec 1, 2025 · Last used 2 hours ago</p>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5">
            <p className="text-[13px] font-bold text-[#F0F4FF] mb-4">Quick Start</p>
            <div className="bg-[#07101F] border border-[#0F1D35] rounded-xl p-4 font-mono text-[11px]">
              <p className="text-[#4A5578] mb-1"># Get all active missions</p>
              <p className="text-[#22FFAA]">curl</p>
              <p className="text-[#F0F4FF] ml-2">-H <span className="text-[#FFB84D]">&quot;Authorization: Bearer {'<api-key>'}&quot;</span></p>
              <p className="text-[#F0F4FF] ml-2">-H <span className="text-[#FFB84D]">&quot;Content-Type: application/json&quot;</span></p>
              <p className="text-[#F0F4FF] ml-2">https://app.xhunt.io/api/missions</p>
              <div className="mt-2 flex justify-end">
                <button onClick={() => copy('curl -H "Authorization: Bearer <api-key>" https://app.xhunt.io/api/missions', 'curl')} className="flex items-center gap-1 text-[10px] text-[#4A5578] hover:text-[#22FFAA] transition-colors">
                  {copied === 'curl' ? <><Check size={10} strokeWidth={2.5} className="text-[#22FFAA]" />Copied</> : <><Copy size={10} strokeWidth={2} />Copy</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Reference */}
      {activeTab === 'api' && (
        <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0F1D35]">
            <p className="text-[13px] font-bold text-[#F0F4FF]">API Reference</p>
            <p className="text-[11px] text-[#4A5578] mt-0.5">Base URL: https://app.xhunt.io</p>
          </div>
          <div className="divide-y divide-[#0F1D35]">
            {API_ENDPOINTS.map((ep, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#0D1530] transition-colors group">
                <span className={cn('text-[10px] font-bold px-2 py-1 rounded-md w-12 text-center flex-shrink-0', METHOD_COLOR[ep.method] ?? 'text-[#8B9CC0] bg-[#0D1530]')}>
                  {ep.method}
                </span>
                <code className="text-[12px] font-mono text-[#22FFAA] flex-1">{ep.path}</code>
                <p className="text-[12px] text-[#4A5578] flex-1">{ep.desc}</p>
                <button className="opacity-0 group-hover:opacity-100 text-[#4A5578] hover:text-[#8B9CC0] transition-all">
                  <ExternalLink size={12} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-[#6D5DFD]" strokeWidth={2} />
                <p className="text-[13px] font-bold text-[#F0F4FF]">Webhook Endpoints</p>
              </div>
              <button className="flex items-center gap-1.5 h-8 px-3 bg-[#6D5DFD]/10 border border-[#6D5DFD]/20 text-[#A99FFE] rounded-xl text-[11px] font-semibold">
                <Plus size={11} strokeWidth={2.5} />Add Endpoint
              </button>
            </div>
            <div className="py-8 text-center">
              <Globe size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[#8B9CC0] text-sm font-medium">No webhook endpoints configured</p>
              <p className="text-[#4A5578] text-xs mt-1">Add an endpoint URL to receive real-time event notifications.</p>
            </div>
          </div>

          <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden">
            <p className="text-[13px] font-bold text-[#F0F4FF] px-5 pt-4 pb-3">Available Events</p>
            <div className="divide-y divide-[#0F1D35]">
              {EVENTS.map((ev) => (
                <div key={ev.name} className="flex items-center gap-4 px-5 py-3.5">
                  <code className="text-[12px] font-mono text-[#6D5DFD] w-52 flex-shrink-0">{ev.name}</code>
                  <p className="text-[12px] text-[#4A5578]">{ev.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl">
          <div className="px-5 py-4 border-b border-[#0F1D35]">
            <p className="text-[13px] font-bold text-[#F0F4FF]">API Request Logs</p>
          </div>
          <div className="py-12 text-center">
            <Activity size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-[#8B9CC0] font-medium">No request logs</p>
            <p className="text-[#4A5578] text-sm mt-1">API request logs will appear here in real time.</p>
          </div>
        </div>
      )}
    </div>
  );
}
