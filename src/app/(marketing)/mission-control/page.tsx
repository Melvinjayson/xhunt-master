'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Brain, Target, Zap, BarChart3, BookOpen, TrendingUp, ChevronRight, Shield, CheckCircle2, FileText, Star, Link2, Award } from 'lucide-react';
import { cn } from '@/lib/cn';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const, delay: d } }),
};

function Sec({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} className={className}>
      {children}
    </motion.section>
  );
}

const VALIDATION_TYPES = [
  { icon: Shield, label: 'Self-Reported', desc: 'Participant submits evidence of real-world outcome attainment.' },
  { icon: CheckCircle2, label: 'Peer Verified', desc: 'A trusted peer or colleague confirms the outcome occurred.' },
  { icon: Zap, label: 'Automated', desc: 'System events or integrations verify outcomes without human review.' },
  { icon: Brain, label: 'Manager Verified', desc: 'Line manager or supervisor formally approves outcome claims.' },
];

const EVIDENCE_TYPES = [
  { icon: FileText, label: 'Document', example: 'Certificate, report, or proof of completion' },
  { icon: Link2, label: 'URL / Link', example: 'Live artefact, portfolio, public output' },
  { icon: BarChart3, label: 'Metric', example: 'KPI value, time-to-result, score' },
  { icon: Star, label: 'Attestation', example: 'Written statement from a witness' },
  { icon: Award, label: 'Certificate', example: 'Accredited credential or badge issuer' },
];

const ESCROW_CONDITIONS = [
  { label: 'MEI Threshold', color: 'text-accent', bg: 'bg-accent/8', desc: 'Funds release automatically when mission MEI exceeds the agreed threshold.' },
  { label: 'Outcome Count', color: 'text-[#6D5DFD]', bg: 'bg-[#6D5DFD]/8', desc: 'Release triggered once a set number of verified outcomes are recorded.' },
  { label: 'Manual Approval', color: 'text-[#818cf8]', bg: 'bg-[#818cf8]/8', desc: 'Designated reviewer explicitly confirms conditions are met before release.' },
  { label: 'Deadline-Based', color: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/8', desc: 'Scheduled automatic release at a contractually agreed programme end date.' },
  { label: 'Hybrid', color: 'text-[#f472b6]', bg: 'bg-[#f472b6]/8', desc: 'Combine MEI threshold and outcome count — both must be satisfied.' },
];

const LIFECYCLE = [
  { step: '01', title: 'Goal Ingestion', desc: 'Raw objective enters the system — a career goal, an employee KPI, a customer success target. The Mission Architect parses intent and maps it to outcome parameters.' },
  { step: '02', title: 'Mission Architecture', desc: 'AI decomposes the goal into a structured mission: phases, checkpoints, action sequences, success criteria, and adaptive branching paths.' },
  { step: '03', title: 'Audience Personalisation', desc: 'The Behavioral Analyst profiles the participant — demographics, past behaviour, learning style — and personalises the mission experience before launch.' },
  { step: '04', title: 'Live Orchestration', desc: 'As participants execute, Mission Control monitors every signal: action completion, timing, engagement depth, and environmental context.' },
  { step: '05', title: 'Adaptive Intervention', desc: 'When deviation is detected, AI agents intervene: adjusting difficulty, surfacing contextual knowledge, or sending personalised nudges to re-engage.' },
  { step: '06', title: 'Outcome Verification', desc: 'Outcome attainment is verified against pre-defined success criteria, not just task completion. The MEI updates with validated data.' },
  { step: '07', title: 'Intelligence Feedback', desc: 'Every mission result feeds the Knowledge Graph, improving future mission architecture, personalisation, and outcome predictions.' },
];

const AGENTS = [
  { name: 'Mission Architect', icon: Brain, color: 'accent', desc: 'Decomposes goals into structured missions with phases, checkpoints, and adaptive branching.' },
  { name: 'Outcome Planner', icon: Target, color: 'ai', desc: 'Maps desired outcomes to measurable KPIs and designs verification frameworks.' },
  { name: 'Experience Designer', icon: Zap, color: 'accent', desc: 'Crafts the engagement layer with rewards, narrative, and motivation hooks.' },
  { name: 'Behavioral Analyst', icon: BarChart3, color: 'ai', desc: 'Monitors participant signals and adjusts mission parameters dynamically.' },
  { name: 'Knowledge Agent', icon: BookOpen, color: 'accent', desc: 'Surfaces the right knowledge at the right moment within the mission flow.' },
  { name: 'Insight Analyst', icon: TrendingUp, color: 'ai', desc: 'Synthesises mission data into operator intelligence and predictive insights.' },
];

export default function MissionControlPage() {
  return (
    <div className="bg-muted text-txt overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-ai/5 blur-[120px] rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(109,93,253,1) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12px] font-bold text-ai uppercase tracking-widest mb-4"
          >
            AI Mission Control
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-black text-txt leading-[1.04] tracking-tighter mb-6"
          >
            The intelligence engine
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ai to-ai-dark">
              behind every mission.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-[1.05rem] text-txt-dim leading-relaxed max-w-[560px] mx-auto mb-8"
          >
            Six specialised AI agents work in concert — architecting, analysing, designing, and optimising every mission across its entire lifecycle.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            className="flex flex-wrap gap-3 justify-center"
          >
            <Link href="/contact" className="flex items-center gap-2 h-12 px-6 bg-ai text-[#050816] rounded-xl text-[14px] font-bold shadow-[0_0_24px_rgba(109,93,253,0.3)] hover:opacity-90 transition-all">
              Book a Demo <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
            <Link href="/developers" className="flex items-center gap-2 h-12 px-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[14px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
              API Documentation
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <Sec className="py-24 lg:py-32 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-[clamp(1.9rem,3.8vw,3rem)] font-black text-txt leading-tight tracking-tight">
              Six specialised agents.
              <br />
              One unified intelligence.
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a.name}
                variants={fadeUp}
                custom={i * 0.07}
                className={cn(
                  'bg-card border rounded-2xl p-6 hover:border-[rgba(255,255,255,0.12)] transition-all',
                  a.color === 'accent' ? 'border-accent/8' : 'border-ai/8',
                )}
              >
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4', a.color === 'accent' ? 'bg-accent/10' : 'bg-ai/10')}>
                  <a.icon size={22} strokeWidth={1.8} className={a.color === 'accent' ? 'text-accent' : 'text-ai'} />
                </div>
                <p className="text-[15px] font-bold text-txt mb-2">{a.name}</p>
                <p className="text-[13px] text-txt-dim leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── LIFECYCLE ── */}
      <Sec className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-[12px] font-bold text-ai uppercase tracking-widest mb-3">
              Mission Lifecycle
            </motion.p>
            <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.9rem,3.5vw,2.8rem)] font-black text-txt leading-tight tracking-tight">
              From goal to validated outcome.
            </motion.h2>
          </div>
          <div className="flex flex-col gap-4">
            {LIFECYCLE.map((l, i) => (
              <motion.div
                key={l.step}
                variants={fadeUp}
                custom={i * 0.06}
                className="flex items-start gap-5 bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 hover:border-ai/15 transition-all"
              >
                <div className="w-10 h-10 bg-ai/10 border border-ai/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-black text-ai">{l.step}</span>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-txt mb-1">{l.title}</p>
                  <p className="text-[13px] text-txt-dim leading-relaxed">{l.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── OUTCOME ENGINE ── */}
      <Sec className="py-24 lg:py-32 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} className="text-[12px] font-bold text-accent uppercase tracking-widest mb-3">
                Outcome Intelligence
              </motion.p>
              <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-txt leading-tight tracking-tight mb-6">
                The Mission Effectiveness Index.
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.12} className="text-[14px] text-txt-dim leading-relaxed mb-6">
                MEI is a composite intelligence signal that aggregates completion, engagement depth, outcome attainment, and adaptation success into a single, actionable performance score for every mission, cohort, and programme.
              </motion.p>
              {[
                { label: 'Completion Rate', pct: 91 },
                { label: 'Engagement Depth', pct: 87 },
                { label: 'Outcome Attainment', pct: 78 },
                { label: 'Adaptation Success', pct: 94 },
              ].map((m) => (
                <div key={m.label} className="mb-3">
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-txt-dim">{m.label}</span>
                    <span className="text-txt font-semibold tabular-nums">{m.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#192428] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent to-accent-dark rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <motion.div variants={fadeUp} custom={0.2} className="bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl p-6">
              <p className="text-[13px] font-semibold text-txt mb-4">Knowledge Graph Intelligence</p>
              <p className="text-[13px] text-txt-dim leading-relaxed mb-5">
                X-hunt maintains a semantic knowledge graph linking goals, missions, actions, participants, and outcomes. This graph powers:
              </p>
              {[
                'Personalised mission recommendations',
                'Outcome pathway optimisation',
                'Cross-mission learning transfer',
                'Predictive intervention triggers',
                'Cohort comparison and benchmarking',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-1.5 h-1.5 bg-ai rounded-full flex-shrink-0" />
                  <span className="text-[12px] text-txt-dim">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ── OUTCOME VALIDATION ENGINE ── */}
      <Sec className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <motion.p variants={fadeUp} className="text-[12px] font-bold text-accent uppercase tracking-widest mb-3">
              Outcome Validation
            </motion.p>
            <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.9rem,3.5vw,2.8rem)] font-black text-txt leading-tight tracking-tight mb-4">
              Evidence-backed. Confidence-scored.
            </motion.h2>
            <motion.p variants={fadeUp} custom={0.12} className="text-[14px] text-txt-dim max-w-[500px] mx-auto leading-relaxed">
              Every outcome claim goes through a structured validation pipeline before it counts toward MEI or triggers escrow release.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start mb-14">
            {/* Validation types */}
            <div>
              <motion.p variants={fadeUp} className="text-[12px] font-bold text-txt-faint uppercase tracking-widest mb-5">
                Validation Methods
              </motion.p>
              <div className="flex flex-col gap-3">
                {VALIDATION_TYPES.map((v, i) => (
                  <motion.div
                    key={v.label}
                    variants={fadeUp}
                    custom={i * 0.06}
                    className="flex items-start gap-4 bg-card border border-[rgba(255,255,255,0.07)] rounded-xl p-4 hover:border-accent/15 transition-all"
                  >
                    <div className="w-9 h-9 bg-accent/8 rounded-xl flex items-center justify-center flex-shrink-0">
                      <v.icon size={17} strokeWidth={1.8} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-txt mb-0.5">{v.label}</p>
                      <p className="text-[12px] text-txt-dim leading-relaxed">{v.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Evidence types + confidence score */}
            <div>
              <motion.p variants={fadeUp} className="text-[12px] font-bold text-txt-faint uppercase tracking-widest mb-5">
                Accepted Evidence Types
              </motion.p>
              <div className="flex flex-col gap-2 mb-6">
                {EVIDENCE_TYPES.map((e, i) => (
                  <motion.div
                    key={e.label}
                    variants={fadeUp}
                    custom={i * 0.05}
                    className="flex items-center gap-3 bg-card border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3"
                  >
                    <div className="w-7 h-7 bg-ai/8 rounded-lg flex items-center justify-center flex-shrink-0">
                      <e.icon size={13} strokeWidth={2} className="text-ai" />
                    </div>
                    <span className="text-[12px] font-semibold text-txt flex-1">{e.label}</span>
                    <span className="text-[11px] text-txt-faint">{e.example}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                variants={fadeUp}
                custom={0.3}
                className="bg-gradient-to-br from-accent/5 to-transparent border border-accent/15 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={16} strokeWidth={2} className="text-accent" />
                  <p className="text-[13px] font-bold text-txt">Confidence Score</p>
                </div>
                <p className="text-[12px] text-txt-dim leading-relaxed mb-3">
                  Reviewers assign a 0–100% confidence score during validation. Scores weight the outcome contribution to MEI — a 95% confidence approval counts more than a 60% borderline approval.
                </p>
                <div className="space-y-1.5">
                  {[['≥ 80%', 'Full MEI contribution'], ['50–79%', 'Partial MEI contribution'], ['< 50%', 'Flagged for re-review']].map(([range, effect]) => (
                    <div key={range} className="flex justify-between text-[11px]">
                      <span className="text-accent font-bold">{range}</span>
                      <span className="text-txt-dim">{effect}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Validation lifecycle */}
          <motion.div variants={fadeUp} custom={0.2} className="bg-[#050816] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <p className="text-[12px] font-bold text-txt-faint uppercase tracking-widest mb-4">Validation Lifecycle</p>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Submitted', color: 'bg-[#3d5068]/20 text-[#7a8fa8]' },
                { label: '→', color: 'text-txt-faint' },
                { label: 'Pending', color: 'bg-[#2a1a00] text-[#fbbf24]' },
                { label: '→', color: 'text-txt-faint' },
                { label: 'Under Review', color: 'bg-[#001a22] text-[#6D5DFD]' },
                { label: '→', color: 'text-txt-faint' },
                { label: 'Approved ✓', color: 'bg-accent/10 text-accent' },
                { label: '/', color: 'text-txt-faint' },
                { label: 'Rejected', color: 'bg-[#2a0a0a] text-[#f87171]' },
                { label: '/', color: 'text-txt-faint' },
                { label: 'Needs Evidence', color: 'bg-[#1a0a2a] text-[#a78bfa]' },
              ].map((item, i) => (
                item.label === '→' || item.label === '/' ? (
                  <span key={i} className={cn('text-[13px]', item.color)}>{item.label}</span>
                ) : (
                  <span key={i} className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full', item.color)}>{item.label}</span>
                )
              ))}
            </div>
          </motion.div>
        </div>
      </Sec>

      {/* ── ESCROW & INCENTIVE LAYER ── */}
      <Sec className="py-24 lg:py-32 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-start">
            <div>
              <motion.p variants={fadeUp} className="text-[12px] font-bold text-[#818cf8] uppercase tracking-widest mb-3">
                Escrow Services
              </motion.p>
              <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-txt leading-tight tracking-tight mb-5">
                Outcome-gated payments. Zero trust required.
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.12} className="text-[14px] text-txt-dim leading-relaxed mb-6">
                Funds are held in escrow and released automatically — or by approval — only when verified outcomes are achieved. Enterprises can now tie incentive budgets directly to mission results.
              </motion.p>

              {/* Escrow lifecycle visual */}
              <motion.div variants={fadeUp} custom={0.18} className="space-y-2 mb-6">
                {[
                  { label: 'Created', pct: 0, color: 'bg-[#3d5068]' },
                  { label: 'Funded', pct: 25, color: 'bg-[#6D5DFD]' },
                  { label: 'Locked', pct: 50, color: 'bg-[#fbbf24]' },
                  { label: 'Released', pct: 100, color: 'bg-accent' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-txt-dim w-16 text-right flex-shrink-0">{s.label}</span>
                    <div className="flex-1 h-2 bg-[#192428] rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', s.color)} style={{ width: `${s.pct}%` }} />
                    </div>
                    <span className="text-[11px] text-txt-faint w-8 flex-shrink-0">{s.pct}%</span>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} custom={0.24} className="flex gap-2 flex-wrap">
                <Link href="/contact" className="flex items-center gap-2 h-10 px-5 bg-[#818cf8] text-[#0a0520] rounded-xl text-[13px] font-bold hover:opacity-90 transition-all">
                  Talk to Sales <ArrowRight size={13} strokeWidth={2.8} />
                </Link>
                <Link href="/developers/api" className="flex items-center gap-2 h-10 px-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[13px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
                  Escrow API <ChevronRight size={13} strokeWidth={2.5} />
                </Link>
              </motion.div>
            </div>

            {/* Release conditions */}
            <div>
              <motion.p variants={fadeUp} className="text-[12px] font-bold text-txt-faint uppercase tracking-widest mb-5">
                Release Conditions
              </motion.p>
              <div className="flex flex-col gap-3">
                {ESCROW_CONDITIONS.map((c, i) => (
                  <motion.div
                    key={c.label}
                    variants={fadeUp}
                    custom={i * 0.06}
                    className={cn('rounded-xl p-4 border border-[rgba(255,255,255,0.06)]', c.bg)}
                  >
                    <p className={cn('text-[13px] font-bold mb-1', c.color)}>{c.label}</p>
                    <p className="text-[12px] text-txt-dim leading-relaxed">{c.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Sec>

      {/* ── CTA ── */}
      <Sec className="py-20 lg:py-28 text-center">
        <div className="max-w-xl mx-auto px-5">
          <motion.h2 variants={fadeUp} className="text-[clamp(1.8rem,4vw,3rem)] font-black text-txt leading-tight tracking-tighter mb-5">
            Ready to see Mission Control in action?
          </motion.h2>
          <motion.div variants={fadeUp} custom={0.08} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="flex items-center justify-center gap-2 h-12 px-7 bg-ai text-[#050816] rounded-xl text-[14px] font-bold shadow-[0_0_24px_rgba(109,93,253,0.3)] hover:opacity-90 transition-all">
              Request a Demo <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
            <Link href="/developers" className="flex items-center justify-center gap-2 h-12 px-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[14px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
              Explore API Docs <ChevronRight size={14} strokeWidth={2.5} />
            </Link>
          </motion.div>
        </div>
      </Sec>
    </div>
  );
}
