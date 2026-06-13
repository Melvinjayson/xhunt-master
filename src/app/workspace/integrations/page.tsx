'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plug, Check, ExternalLink, Plus, Settings, Zap, RefreshCw,
  MessageSquare, Monitor, Users, Database, Code2, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  bg: string;
  status: 'connected' | 'available' | 'coming_soon';
  docsUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  { id: 'slack',          name: 'Slack',              description: 'Send mission notifications and completions to channels.',  category: 'Communication', icon: '🔲', color: '#4A154B', bg: '#4A154B20', status: 'available' },
  { id: 'teams',          name: 'Microsoft Teams',    description: 'Push mission updates to Teams channels and bots.',         category: 'Communication', icon: '🔷', color: '#6264A7', bg: '#6264A720', status: 'available' },
  { id: 'salesforce',     name: 'Salesforce',         description: 'Sync outcomes and participant data with CRM.',             category: 'CRM',           icon: '☁️', color: '#00A1E0', bg: '#00A1E020', status: 'available' },
  { id: 'hubspot',        name: 'HubSpot',            description: 'Connect mission completions to contact records.',          category: 'CRM',           icon: '🟠', color: '#FF7A59', bg: '#FF7A5920', status: 'available' },
  { id: 'workday',        name: 'Workday',            description: 'Map mission outcomes to performance reviews.',             category: 'HR',            icon: '🔶', color: '#F5A623', bg: '#F5A62320', status: 'coming_soon' },
  { id: 'google',         name: 'Google Workspace',   description: 'Calendar events, Drive storage, and Gmail notifications.', category: 'Productivity', icon: '🔵', color: '#4285F4', bg: '#4285F420', status: 'available' },
  { id: 'ms365',          name: 'Microsoft 365',      description: 'Outlook, SharePoint, and OneDrive integration.',           category: 'Productivity', icon: '🟦', color: '#D83B01', bg: '#D83B0120', status: 'available' },
  { id: 'moodle',         name: 'Moodle',             description: 'Import courses and track learning outcomes.',              category: 'LMS',           icon: '🟫', color: '#F7633B', bg: '#F7633B20', status: 'coming_soon' },
  { id: 'canvas',         name: 'Canvas LMS',         description: 'Sync assignments and learning missions with Canvas.',      category: 'LMS',           icon: '🔴', color: '#E66000', bg: '#E6600020', status: 'coming_soon' },
  { id: 'zapier',         name: 'Zapier',             description: 'Connect X-hunt to 5000+ apps via automated Zaps.',        category: 'Automation',    icon: '⚡', color: '#FF4A00', bg: '#FF4A0020', status: 'available' },
  { id: 'webhooks',       name: 'Webhooks',           description: 'Send real-time event notifications to your endpoints.',    category: 'Developer',     icon: '🔗', color: '#22FFAA', bg: '#22FFAA15', status: 'connected' },
  { id: 'rest-api',       name: 'REST API',           description: 'Full programmatic access to missions, outcomes, and data.',category: 'Developer',     icon: '⚙️', color: '#6D5DFD', bg: '#6D5DFD15', status: 'connected' },
];

const CATEGORIES = ['All', 'Communication', 'CRM', 'HR', 'Productivity', 'LMS', 'Automation', 'Developer'];

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState<Set<string>>(new Set(['webhooks', 'rest-api']));

  function toggleConnect(id: string) {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filtered = INTEGRATIONS.filter((i) => {
    if (activeCategory !== 'All' && i.category !== activeCategory) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const connectedCount = connected.size;

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22FFAA]/8 border border-[#22FFAA]/15 flex items-center justify-center">
            <Plug size={18} className="text-[#22FFAA]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#F0F4FF]">Integrations Hub</h1>
            <p className="text-[#4A5578] text-[12px]">{connectedCount} connected · {INTEGRATIONS.length} available</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Connected', value: connectedCount, icon: Check, color: 'text-[#22FFAA]', bg: 'bg-[#22FFAA]/8' },
          { label: 'Available', value: INTEGRATIONS.filter(i => i.status !== 'coming_soon').length, icon: Plug, color: 'text-[#6D5DFD]', bg: 'bg-[#6D5DFD]/10' },
          { label: 'Coming Soon', value: INTEGRATIONS.filter(i => i.status === 'coming_soon').length, icon: Zap, color: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0A1226] border border-[#0F1D35] rounded-xl p-4 flex items-center gap-3"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
              <Icon size={16} className={color} strokeWidth={1.8} />
            </div>
            <div>
              <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
              <p className="text-[#4A5578] text-[11px] font-medium">{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-[#0A1226] border border-[#0F1D35] rounded-xl p-1 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn('h-7 px-3 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all', activeCategory === cat ? 'bg-[#0D1530] text-[#F0F4FF]' : 'text-[#4A5578] hover:text-[#8B9CC0]')}
            >{cat}</button>
          ))}
        </div>
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations…"
            className="w-56 h-9 pl-3 pr-3 bg-[#0A1226] border border-[#0F1D35] rounded-xl text-[12px] text-[#F0F4FF] placeholder:text-[#4A5578] focus:outline-none focus:border-[#162440]"
          />
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.map((integration, i) => {
          const isConnected = connected.has(integration.id);
          const isComingSoon = integration.status === 'coming_soon';
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'bg-[#0A1226] border rounded-2xl p-5 transition-all',
                isConnected ? 'border-[#22FFAA]/20' : 'border-[#0F1D35] hover:border-[#162440]',
                isComingSoon && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: integration.bg }}>
                    {integration.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#F0F4FF]">{integration.name}</p>
                    <p className="text-[10px] text-[#4A5578] font-medium">{integration.category}</p>
                  </div>
                </div>
                {isConnected && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#22FFAA]/10 border border-[#22FFAA]/20 rounded-full">
                    <div className="w-1 h-1 rounded-full bg-[#22FFAA] breathe" />
                    <span className="text-[9px] font-bold text-[#22FFAA]">Live</span>
                  </div>
                )}
              </div>

              <p className="text-[12px] text-[#4A5578] mb-4 leading-relaxed">{integration.description}</p>

              <div className="flex items-center gap-2">
                {isComingSoon ? (
                  <button disabled className="flex-1 h-8 bg-[#07101F] border border-[#0F1D35] rounded-xl text-[11px] font-semibold text-[#4A5578]">
                    Coming Soon
                  </button>
                ) : (
                  <button
                    onClick={() => toggleConnect(integration.id)}
                    className={cn(
                      'flex-1 h-8 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all',
                      isConnected
                        ? 'bg-[#FF5C7A]/10 border border-[#FF5C7A]/20 text-[#FF5C7A] hover:bg-[#FF5C7A]/15'
                        : 'bg-accent/10 border border-accent/20 text-accent hover:bg-accent/15'
                    )}
                  >
                    {isConnected ? (
                      <><RefreshCw size={11} strokeWidth={2} />Disconnect</>
                    ) : (
                      <><Plus size={11} strokeWidth={2.5} />Connect</>
                    )}
                  </button>
                )}
                <button className="h-8 w-8 flex items-center justify-center bg-[#07101F] border border-[#0F1D35] rounded-xl text-[#4A5578] hover:text-[#8B9CC0] transition-colors">
                  <ExternalLink size={12} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
