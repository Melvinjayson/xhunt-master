'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Code2, Zap, Globe, Webhook, BookOpen, Terminal,
  ChevronRight, Copy, Check, Brain, Shield, Cpu, Network,
  BarChart3, Users, Layers, GitBranch, Sparkles, Lock,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const, delay: d } }),
};

function Sec({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section id={id} ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.section>
  );
}

function CodeBlock({ code, lang = 'typescript' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative bg-[#050816] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(255,255,255,0.06)]">
        <span className="text-[11px] font-mono text-txt-faint">{lang}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[11px] text-txt-dim hover:text-txt transition-colors">
          {copied ? <Check size={12} strokeWidth={2.5} className="text-accent" /> : <Copy size={12} strokeWidth={2} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[12px] font-mono leading-relaxed overflow-x-auto text-txt-dim whitespace-pre">{code}</pre>
    </div>
  );
}

const DOC_SECTIONS = [
  { icon: BookOpen,  title: 'Overview',        desc: 'Platform architecture, key concepts, and integration patterns.',           href: '#overview' },
  { icon: Terminal,  title: 'Quick Start',      desc: 'Get your first API call running in under 5 minutes.',                      href: '#quickstart' },
  { icon: Code2,     title: 'Authentication',   desc: 'API keys, OAuth 2.0, JWT scopes, and token management.',                   href: '#auth' },
  { icon: Globe,     title: 'Missions API',     desc: 'Create, configure, launch, and monitor mission programmes.',               href: '/developers/api' },
  { icon: Brain,     title: 'XIL — Agent OS',   desc: 'Intelligence orchestration: 6 functions, 12 agents, constitutional AI.',   href: '#xil' },
  { icon: Zap,       title: 'Audience API',     desc: 'Manage participant profiles, segments, and personalisation.',              href: '/developers/api' },
  { icon: BarChart3, title: 'MEI & Analytics',  desc: 'Mission Effectiveness Index, skill graphs, and outcome intelligence.',     href: '/developers/api' },
  { icon: Shield,    title: 'Constitutional AI', desc: 'Trust Guardian, double materiality checks, and anti-pattern detection.',  href: '#constitution' },
  { icon: Webhook,   title: 'Webhooks',         desc: 'Real-time event delivery for mission lifecycle and outcomes.',             href: '/developers/api' },
];

const SDK_LANGS = ['TypeScript', 'Python', 'Go', 'Ruby', 'Java'];

const QUICK_START_CODE = `import { XhuntClient } from '@xhunt/sdk';

const client = new XhuntClient({ apiKey: process.env.XHUNT_API_KEY });

// Create a mission programme
const mission = await client.missions.create({
  title: 'Employee Onboarding — Engineering',
  goal: 'Time-to-productivity under 30 days',
  audience: { segment: 'new-hires', count: 50 },
  outcomes: [
    { metric: 'time_to_first_commit',  target: '< 7 days',  weight: 0.4 },
    { metric: 'onboarding_nps',        target: '>= 45',     weight: 0.3 },
    { metric: '30_day_retention',      target: '>= 95%',    weight: 0.3 },
  ],
  config: { adaptive_difficulty: true, ai_nudges: true },
});

// Invoke the XIL intelligence layer
const intel = await client.xil.invoke({
  intelligenceFunction: 'personal',
  objective: 'Find best next missions for user growth',
  context: { userId: 'usr_01AB...', skills: ['python', 'data-analysis'] },
});

console.log(intel.agentsInvoked);  // ['discovery-agent']
console.log(intel.constitutionalCheck.verdict);  // 'approved'`;

const XIL_CODE = `// POST /api/xil — Invoke XIL intelligence orchestration
const response = await fetch('/api/xil', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ...' },
  body: JSON.stringify({
    intelligenceFunction: 'community',   // personal | community | marketplace
    objective: 'Identify collaboration    // impact | governance | foundry
                opportunities in Lagos tech cohort',
    context: {
      communityContext: 'Lagos Web3 builders, 340 members',
      activeMissions: [{ id: 'ms_01', title: 'DeFi Build Sprint', tags: ['tech', 'finance'] }],
    },
    sessionId: 'ses_01AB...',
  }),
});

const result = await response.json();
// result.agentsInvoked       → ['community-catalyst']
// result.constitutionalCheck → { verdict: 'approved', score: 7, redFlags: [] }
// result.results['community-catalyst'].community_health_score → 84
// result.processingMs        → 1240`;

const AGENT_CODE = `// POST /api/agents/mission-architect
// Transforms a plain-language goal into a full mission blueprint
const blueprint = await fetch('/api/agents/mission-architect', {
  method: 'POST',
  body: JSON.stringify({
    goal: 'Reduce customer churn by 15% in Q3',
    audience: 'Customer Success Managers',
    industry: 'SaaS / B2B',
    duration: '6 weeks',
    success_metric: 'NPS >= 50 and churn_rate < 3.5%',
  }),
});

// → { title, story_context, difficulty, steps: [{type, instruction, success_criteria}],
//     rationale, estimated_time, tags, reward }

// POST /api/agents/behavioral-analyst
// Diagnose friction and predict completion lift
const analysis = await fetch('/api/agents/behavioral-analyst', {
  method: 'POST',
  body: JSON.stringify({
    mission_title: 'Q3 Retention Drive',
    total_attempts: 312, total_completions: 187,
    step_drop_offs: [
      { step_index: 2, step_label: 'Upload customer call recording', drop_count: 58 },
      { step_index: 4, step_label: 'Write reflection journal',       drop_count: 34 },
    ],
  }),
});
// → { friction_score: 7, predicted_lift_pct: 22, drop_off_analysis: [...] }`;

const CONSTITUTION_CODE = `// The Trust Guardian evaluates every XIL request before agent invocation.
// A 7-question constitutional test runs first:
//
//  1. Does this help participants flourish?
//  2. Does this strengthen trust?
//  3. Does this create genuine value?
//  4. Does this improve the ecosystem?
//  5. Is this fair to all stakeholders?
//  6. Is this sustainable long-term?
//  7. Would we be proud of this in 10 years?
//
// One 'no' → 'flagged' (conditions required before proceeding)
// Two or more 'no' → 'rejected' (hard block, no agent invocation)

// Example rejected response:
{
  "intelligenceFunction": "personal",
  "agentsInvoked": [],
  "results": {
    "error": "Request rejected by constitutional alignment check",
    "verdict": "rejected",
    "redFlags": ["Engagement maximization detected", "FOMO mechanic in objective"]
  },
  "constitutionalCheck": {
    "verdict": "rejected",
    "score": 3,
    "redFlags": ["engagement_maximization", "artificial_urgency"],
    "conditions": []
  }
}`;

const WEBHOOK_CODE = `// X-hunt sends signed POST requests to your endpoint
// Verify signature with HMAC-SHA256

app.post('/webhooks/xhunt', (req, res) => {
  const sig = req.headers['x-xhunt-signature'];
  if (!verifySignature(req.body, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }

  switch (req.body.event) {
    case 'mission.outcome.achieved':
      await markCertified(req.body.data.participant_id);
      break;
    case 'xil.constitutional.rejected':
      await logSafetyEvent(req.body.data);
      break;
    case 'agent.foundry.spec_created':
      await reviewNewAgentSpec(req.body.data);
      break;
  }

  res.status(200).send('OK');
});`;

const AGENTS = [
  { id: 'mission-architect',       name: 'Mission Architect',       fn: 'Tenant',        color: '#6D5DFD', desc: 'Transforms goals into structured, executable mission blueprints with steps, criteria, and rationale.' },
  { id: 'experience-designer',     name: 'Experience Designer',     fn: 'Tenant',        color: '#6D5DFD', desc: 'Optimizes narrative arc, step variety, and emotional engagement for maximum mission completion.' },
  { id: 'behavioral-analyst',      name: 'Behavioral Analyst',      fn: 'Tenant',        color: '#6D5DFD', desc: 'Diagnoses friction points, predicts drop-offs, and estimates completion lift from optimizations.' },
  { id: 'outcome-planner',         name: 'Outcome Planner',         fn: 'Tenant',        color: '#6D5DFD', desc: 'Reverse-engineers desired outcomes into sequenced mission roadmaps with milestone tracking.' },
  { id: 'insight-analyst',         name: 'Insight Analyst',         fn: 'Tenant',        color: '#6D5DFD', desc: 'Translates engagement analytics into executive-level intelligence with ROI narrative.' },
  { id: 'knowledge-agent',         name: 'Knowledge Agent',         fn: 'Tenant',        color: '#6D5DFD', desc: 'Pattern-recognizes across mission outcomes to synthesize strategic recommendations.' },
  { id: 'discovery-agent',         name: 'Discovery Agent',         fn: 'personal',      color: '#22FFAA', desc: 'Personalised opportunity discovery that optimises for flourishing, never for screen time.' },
  { id: 'community-catalyst',      name: 'Community Catalyst',      fn: 'community',     color: '#22FFAA', desc: 'Systems-thinking community intelligence — maps feedback loops and second-order effects.' },
  { id: 'economy-coordinator',     name: 'Economy Coordinator',     fn: 'marketplace',   color: '#22FFAA', desc: 'Coordinates the participation economy: identity, contribution, trust, and coordination.' },
  { id: 'sustainability-navigator',name: 'Sustainability Navigator', fn: 'impact',        color: '#FFB84D', desc: 'SDG-aligned impact scoring with greenwashing detection and circular economy guidance.' },
  { id: 'trust-guardian',          name: 'Trust Guardian',          fn: 'governance',    color: '#FF5C7A', desc: 'Constitutional integrity agent — 7-question test, anti-pattern detection, double materiality.' },
  { id: 'agent-foundry',           name: 'Agent Foundry',           fn: 'foundry',       color: '#818cf8', desc: 'Meta-agent that designs new specialist agents using the 11-step development framework.' },
];

const XIL_FUNCTIONS = [
  { fn: 'personal',    agents: ['discovery-agent'],            scope: 'All users',   desc: 'Personalised opportunity discovery and skill-path recommendations.' },
  { fn: 'community',   agents: ['community-catalyst'],         scope: 'All users',   desc: 'Community health scoring, collaboration formation, social capital.' },
  { fn: 'marketplace', agents: ['economy-coordinator'],        scope: 'All users',   desc: 'Decentralised participation economy: matching, trust, coordination.' },
  { fn: 'impact',      agents: ['sustainability-navigator'],   scope: 'All users',   desc: 'Environmental/SDG scoring, circular economy, greenwashing detection.' },
  { fn: 'governance',  agents: ['trust-guardian'],             scope: 'Admin only',  desc: 'Constitutional review of features, policies, and agent behaviors.' },
  { fn: 'foundry',     agents: ['agent-foundry'],              scope: 'Admin only',  desc: 'Design and spec new specialized agents with full compliance review.' },
];

const API_ENDPOINTS = [
  { method: 'POST', path: '/api/xil',                              desc: 'Invoke XIL intelligence orchestration (6 functions, 12 agents)' },
  { method: 'GET',  path: '/api/xil?view=registry',                desc: 'Agent registry + constitutional principles' },
  { method: 'GET',  path: '/api/xil?view=health',                  desc: 'Real-time constitutional health + routing metrics' },
  { method: 'POST', path: '/api/agents/mission-architect',         desc: 'Generate mission blueprint from goal + audience' },
  { method: 'POST', path: '/api/agents/experience-designer',       desc: 'Optimize mission narrative, engagement score + step rewrites' },
  { method: 'POST', path: '/api/agents/behavioral-analyst',        desc: 'Friction diagnosis + predicted completion lift %' },
  { method: 'POST', path: '/api/agents/outcome-planner',           desc: 'Reverse-engineer outcomes into sequenced mission roadmap' },
  { method: 'POST', path: '/api/agents/insight-analyst',           desc: 'Analytics → executive intelligence + ROI narrative' },
  { method: 'POST', path: '/api/agents/knowledge-agent',           desc: 'Knowledge graph Q&A with confidence-scored recommendations' },
  { method: 'GET',  path: '/api/skills/infer',                     desc: 'Infer skill profile + SDG contributions from mission history' },
  { method: 'POST', path: '/api/adapt-step',                       desc: 'AI-rewrite a mission step for a participant context' },
  { method: 'POST', path: '/v1/missions',                          desc: 'Create a new mission programme' },
  { method: 'GET',  path: '/v1/missions/{id}',                     desc: 'Retrieve mission details and status' },
  { method: 'GET',  path: '/v1/analytics/mei/{id}',                desc: 'Mission Effectiveness Index + components' },
  { method: 'POST', path: '/v1/outcomes/validations',              desc: 'Submit outcome for evidence-based validation' },
  { method: 'POST', path: '/v1/escrow',                            desc: 'Create outcome-gated escrow account' },
  { method: 'POST', path: '/v1/revenue/invoices',                  desc: 'Generate invoice with line items' },
  { method: 'POST', path: '/v1/webhooks',                          desc: 'Register webhook endpoint' },
];

export default function DevelopersPage() {
  return (
    <div className="bg-muted text-txt overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative pt-28 pb-16 lg:pt-36 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-[600px] h-[400px] bg-ai/4 blur-[100px] rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'linear-gradient(rgba(109,93,253,1) 1px, transparent 1px), linear-gradient(90deg, rgba(109,93,253,1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-ai/8 border border-ai/20 rounded-full px-3.5 py-1.5 mb-8"
              >
                <Terminal size={12} className="text-ai" strokeWidth={2.5} />
                <span className="text-[12px] font-semibold text-ai">Developer Platform</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="text-[clamp(2.2rem,5vw,4rem)] font-black text-txt leading-[1.04] tracking-tighter mb-5"
              >
                Build on the
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ai to-ai-dark">
                  Mission OS.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="text-[1rem] text-txt-dim leading-relaxed mb-8 max-w-[480px]"
              >
                Full API surface for mission creation, audience management, outcome tracking, and AI orchestration — including the XIL intelligence layer with 12 specialized constitutional agents.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="flex flex-wrap gap-3"
              >
                <Link href="/developers/api" className="flex items-center gap-2 h-11 px-5 bg-ai text-[#050816] rounded-xl text-[13px] font-bold hover:opacity-90 transition-all">
                  API Reference <ArrowRight size={13} strokeWidth={2.8} />
                </Link>
                <Link href="/get-started" className="flex items-center gap-2 h-11 px-5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[13px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
                  Get API Key
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <CodeBlock code={QUICK_START_CODE} lang="TypeScript — Quick Start" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── DOC SECTIONS ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-txt leading-tight tracking-tight">
              Everything you need to integrate.
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOC_SECTIONS.map((s, i) => (
              <motion.a
                key={s.title}
                href={s.href}
                variants={fadeUp}
                custom={i * 0.07}
                className="group flex items-start gap-4 bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 hover:border-ai/20 transition-all"
              >
                <div className="w-10 h-10 bg-ai/8 rounded-xl flex items-center justify-center flex-shrink-0">
                  <s.icon size={18} strokeWidth={1.8} className="text-ai" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-txt mb-1 group-hover:text-ai transition-colors">{s.title}</p>
                  <p className="text-[12px] text-txt-dim leading-relaxed">{s.desc}</p>
                </div>
                <ChevronRight size={15} strokeWidth={2} className="text-txt-faint group-hover:text-ai transition-colors ml-auto flex-shrink-0 mt-0.5" />
              </motion.a>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── XIL INTELLIGENCE LAYER ── */}
      <Sec id="xil" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-ai/8 border border-ai/20 rounded-full px-3.5 py-1.5 mb-6">
                <Brain size={12} className="text-ai" strokeWidth={2.5} />
                <span className="text-[12px] font-semibold text-ai">XIL — Xeno Intelligence Layer</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={0.05} className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-txt leading-tight tracking-tight mb-5">
                Agentic intelligence,
                <br />
                <span className="text-ai">constitutionally governed.</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.1} className="text-[14px] text-txt-dim leading-relaxed mb-6">
                The XIL orchestrates 12 specialized AI agents across 6 intelligence functions. Every request passes a constitutional alignment check before any agent is invoked. Agents run in parallel where possible; results carry full provenance.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.15} className="flex flex-col gap-2">
                {XIL_FUNCTIONS.map((fn) => (
                  <div key={fn.fn} className="flex items-start gap-3 bg-card border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 min-w-[130px]">
                      <span className="text-[11px] font-black font-mono text-ai bg-ai/10 px-2 py-0.5 rounded">{fn.fn}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-txt-dim leading-relaxed">{fn.desc}</p>
                      <p className="text-[10px] text-txt-faint mt-0.5">Agents: {fn.agents.join(', ')} · {fn.scope}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={0.2} className="lg:sticky lg:top-28 flex flex-col gap-4">
              <CodeBlock code={XIL_CODE} lang="XIL — Orchestration call" />
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '12 Agents', sub: 'Specialized' },
                  { label: '6 Functions', sub: 'Intelligence' },
                  { label: '7-Q Test', sub: 'Constitutional' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center">
                    <p className="text-[14px] font-black text-ai">{stat.label}</p>
                    <p className="text-[10px] text-txt-faint">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ── AGENT REGISTRY ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-[12px] font-bold text-ai uppercase tracking-widest mb-3">Agent Registry</motion.p>
            <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight">
              12 specialist agents. One orchestrator.
            </motion.h2>
            <motion.p variants={fadeUp} custom={0.12} className="text-[14px] text-txt-dim mt-3 max-w-xl mx-auto">
              Each agent has a strict constitutional mandate, explicit anti-objectives, and a defined output schema. The orchestrator invokes them in parallel and returns results with full provenance.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a.id}
                variants={fadeUp}
                custom={i * 0.05}
                className="bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 hover:border-[rgba(255,255,255,0.12)] transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                  <span className="text-[10px] font-mono font-bold" style={{ color: a.color }}>{a.fn}</span>
                </div>
                <p className="text-[13px] font-bold text-txt mb-1.5">{a.name}</p>
                <p className="text-[12px] text-txt-dim leading-relaxed">{a.desc}</p>
                <code className="text-[10px] font-mono text-txt-faint mt-2 block">/api/agents/{a.id}</code>
              </motion.div>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── CONSTITUTIONAL AI ── */}
      <Sec id="constitution" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-[rgba(255,92,122,0.08)] border border-[rgba(255,92,122,0.2)] rounded-full px-3.5 py-1.5 mb-6">
                <Shield size={12} className="text-error" strokeWidth={2.5} />
                <span className="text-[12px] font-semibold text-error">Constitutional AI</span>
              </motion.div>
              <motion.h2 variants={fadeUp} custom={0.05} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight mb-5">
                Every request, evaluated.
                <br />
                <span className="text-error">Bad actors blocked.</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.1} className="text-[14px] text-txt-dim leading-relaxed mb-6">
                The Trust Guardian runs a 7-question constitutional test before any agent invocation. Requests that fail are hard-blocked with a full audit trail — never silently degraded.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.15} className="flex flex-col gap-3">
                {[
                  { icon: Lock,       color: '#FF5C7A', label: 'Hard blocks',             desc: 'Engagement maximization, FOMO, addictive design, data misuse — always rejected.' },
                  { icon: GitBranch,  color: '#FFB84D', label: 'Double materiality',       desc: 'Financial AND impact dimensions evaluated simultaneously. Neither may be ignored.' },
                  { icon: Layers,     color: '#6D5DFD', label: 'Anti-pattern detection',   desc: 'Dark patterns, manipulation, extraction, and addictive mechanics are auto-flagged.' },
                  { icon: Network,    color: '#22FFAA', label: 'Full provenance',           desc: 'Every agent invocation, constitutional score, and routing decision is persisted.' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 bg-card border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                      <item.icon size={15} strokeWidth={1.8} style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-txt">{item.label}</p>
                      <p className="text-[12px] text-txt-dim leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={0.2} className="lg:sticky lg:top-28">
              <CodeBlock code={CONSTITUTION_CODE} lang="Constitutional check — rejected example" />
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ── DIRECT AGENT CALLS ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <motion.p variants={fadeUp} className="text-[12px] font-bold text-ai uppercase tracking-widest mb-3">Direct Agent APIs</motion.p>
              <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight mb-5">
                Call agents directly
                <br />for tenant workflows.
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.12} className="text-[14px] text-txt-dim leading-relaxed mb-6">
                Tenant-facing agents (Mission Architect, Experience Designer, Behavioral Analyst, Outcome Planner, Insight Analyst, Knowledge Agent) are callable directly for B2B integrations — bypassing the XIL orchestrator for lower latency.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.18} className="flex flex-col gap-2">
                {[
                  { path: '/api/agents/mission-architect',   latency: '~1.2s', out: 'MissionBlueprint' },
                  { path: '/api/agents/experience-designer', latency: '~0.9s', out: 'ExperienceReport' },
                  { path: '/api/agents/behavioral-analyst',  latency: '~0.8s', out: 'FrictionAnalysis' },
                  { path: '/api/agents/outcome-planner',     latency: '~1.4s', out: 'OutcomeRoadmap' },
                  { path: '/api/agents/insight-analyst',     latency: '~1.0s', out: 'InsightReport' },
                  { path: '/api/agents/knowledge-agent',     latency: '~0.7s', out: 'KnowledgeGraph' },
                ].map((row) => (
                  <div key={row.path} className="flex items-center gap-3 bg-card border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-2.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-accent/15 text-accent">POST</span>
                    <code className="text-[11px] font-mono text-txt flex-1 truncate">{row.path}</code>
                    <span className="text-[10px] text-txt-faint hidden sm:block">{row.latency}</span>
                    <span className="text-[10px] font-mono text-ai hidden lg:block">{row.out}</span>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={0.2}>
              <CodeBlock code={AGENT_CODE} lang="Direct agent calls" />
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ── SDKs & WEBHOOKS ── */}
      <Sec className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} className="text-[12px] font-bold text-ai uppercase tracking-widest mb-3">SDKs & Webhooks</motion.p>
              <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight mb-5">
                Ship faster in any language.
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.12} className="text-[14px] text-txt-dim leading-relaxed mb-4">
                First-party SDKs with full TypeScript types, async/await, and auto-pagination. Webhook events cover the full lifecycle — missions, outcomes, escrow, and XIL constitutional events.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.18} className="flex flex-wrap gap-2 mb-6">
                {SDK_LANGS.map((lang) => (
                  <span key={lang} className="px-3 py-1.5 bg-card border border-[rgba(255,255,255,0.08)] rounded-lg text-[12px] font-semibold text-txt-dim hover:text-txt hover:border-ai/25 transition-all cursor-pointer">
                    {lang}
                  </span>
                ))}
              </motion.div>
              <motion.div variants={fadeUp} custom={0.22} className="flex flex-col gap-1.5">
                {[
                  'mission.outcome.achieved',
                  'mission.participant.completed',
                  'xil.constitutional.rejected',
                  'xil.agent.foundry.spec_created',
                  'escrow.released',
                  'escrow.disputed',
                ].map((ev) => (
                  <div key={ev} className="flex items-center gap-2">
                    <Cpu size={10} className="text-ai flex-shrink-0" />
                    <code className="text-[11px] font-mono text-txt-dim">{ev}</code>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={0.2}>
              <CodeBlock code={WEBHOOK_CODE} lang="Webhooks — Node.js" />
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ── COMPLETE API SURFACE ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <motion.h2 variants={fadeUp} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight">
              Complete API surface.
            </motion.h2>
          </div>
          <div className="flex flex-col gap-2">
            {API_ENDPOINTS.map((endpoint, i) => (
              <motion.div
                key={endpoint.path}
                variants={fadeUp}
                custom={i * 0.03}
                className="flex items-center gap-3 bg-card border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 font-mono hover:border-[rgba(255,255,255,0.1)] transition-all"
              >
                <span className={cn(
                  'text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 min-w-[44px] text-center',
                  endpoint.method === 'GET'   ? 'bg-ai/15 text-ai' :
                  endpoint.method === 'PATCH' ? 'bg-[#818cf8]/15 text-[#818cf8]' :
                  'bg-accent/15 text-accent',
                )}>
                  {endpoint.method}
                </span>
                <span className="text-[12px] text-txt flex-1 truncate">{endpoint.path}</span>
                <span className="text-[11px] text-txt-dim hidden sm:block">{endpoint.desc}</span>
              </motion.div>
            ))}
          </div>
          <motion.div variants={fadeUp} custom={0.4} className="flex justify-center mt-8">
            <Link href="/developers/api" className="flex items-center gap-2 text-[13px] font-semibold text-ai hover:text-ai-dark transition-colors">
              View full API reference <ChevronRight size={15} strokeWidth={2.5} />
            </Link>
          </motion.div>
        </div>
      </Sec>

      {/* ── CTA ── */}
      <Sec className="py-20 lg:py-28 text-center">
        <div className="max-w-xl mx-auto px-5">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-accent/8 border border-accent/20 rounded-full px-3.5 py-1.5 mb-6">
            <Sparkles size={12} className="text-accent" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-accent">Ready to build</span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.8vw,3rem)] font-black text-txt leading-tight tracking-tighter mb-5">
            Start building today.
          </motion.h2>
          <motion.p variants={fadeUp} custom={0.12} className="text-[14px] text-txt-dim mb-8">
            Free tier includes 1,000 API requests/month and access to all 12 agents. No credit card required.
          </motion.p>
          <motion.div variants={fadeUp} custom={0.18} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/get-started" className="flex items-center justify-center gap-2 h-12 px-7 bg-ai text-[#050816] rounded-xl text-[14px] font-bold shadow-[0_0_24px_rgba(109,93,253,0.3)] hover:opacity-90 transition-all">
              Get API Key <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
            <Link href="/developers/api" className="flex items-center justify-center gap-2 h-12 px-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[14px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
              <Users size={14} strokeWidth={2} />
              API Reference
            </Link>
          </motion.div>
        </div>
      </Sec>
    </div>
  );
}
