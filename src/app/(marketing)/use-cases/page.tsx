'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
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

const CATEGORIES = ['All', 'Workforce', 'Customer', 'Learning', 'Government', 'Community'];

const USE_CASES = [
  {
    id: 'onboarding',
    category: 'Workforce',
    emoji: '🚀',
    title: 'Employee Onboarding',
    challenge: 'New hires spend weeks on passive content — watching videos, reading PDFs — but fail to develop capability or understand their role in practice.',
    approach: 'Replace static content with adaptive onboarding missions. Each new hire completes real tasks: shadowing, introductions, first deliverables — all guided by AI and tracked against defined outcome milestones.',
    metrics: ['40% faster time-to-productivity', '92% new-hire satisfaction score', '60% reduction in HR support tickets'],
    example: 'Week 1 Mission: Complete 5 stakeholder introductions → Submit first project analysis → Shadow 3 customer calls → Pass product knowledge assessment',
  },
  {
    id: 'ld',
    category: 'Learning',
    emoji: '📚',
    title: 'Learning & Development',
    challenge: "L&D programmes measure completion rates and hours spent — not whether learning actually changes behaviour or improves performance.",
    approach: 'Design capability missions tied to real job outcomes. Participants complete on-the-job tasks as part of learning sequences. The MEI tracks whether knowledge application actually changes, not just whether content was consumed.',
    metrics: ['94% knowledge application rate', '3.2× higher capability retention', '67% reduction in re-training spend'],
    example: 'Sales Excellence Mission: Complete discovery call framework → Record and analyse 2 real calls → Receive AI coaching → Close a qualified deal',
  },
  {
    id: 'customer-success',
    category: 'Customer',
    emoji: '🎯',
    title: 'Customer Success',
    challenge: 'Customers churn before reaching the first value moment. Onboarding sequences are generic and fail to adapt to the customer\'s specific use case.',
    approach: 'Design first-value missions personalised to each customer\'s industry, role, and integration profile. The mission adapts based on their progress signals and ensures they hit their defined success outcome before the 30-day mark.',
    metrics: ['3× faster product adoption', '54% reduction in 90-day churn', '87% first-value achievement rate'],
    example: 'SaaS Onboarding Mission: Complete integration setup → Configure first automation → Run first report → Share with team → Achieve core use case',
  },
  {
    id: 'engagement',
    category: 'Customer',
    emoji: '💎',
    title: 'Customer Engagement & Loyalty',
    challenge: 'Loyalty programmes reward transactions, not relationships. Points and discounts create price-sensitive customers, not brand advocates.',
    approach: "Design engagement missions that reward exploration, education, and community participation. Customers earn recognition by completing brand experiences — not just purchases. X-hunt's outcome intelligence shows which mission sequences drive lifetime value.",
    metrics: ['3× engagement vs email campaigns', '2.1× increase in LTV', '68% mission repeat participation'],
    example: 'Brand Explorer Mission: Visit flagship store → Try 3 new products → Share experience → Attend a brand event → Invite a friend',
  },
  {
    id: 'innovation',
    category: 'Workforce',
    emoji: '💡',
    title: 'Innovation Programmes',
    challenge: "Hackathons and idea competitions generate excitement but rarely produce actionable output. Ideas die in slides and never reach implementation.",
    approach: 'Structure innovation as outcome missions: from problem framing → solution design → prototype → stakeholder pitch → pilot approval. Each stage has defined outputs and AI-assisted guidance.',
    metrics: ['2.8× more ideas progressed to pilot', '45% faster idea-to-decision cycle', '84% participant engagement rate'],
    example: 'Innovation Sprint Mission: Define problem space → Generate 3 validated insights → Build solution prototype → Present to executive sponsor → Receive pilot approval',
  },
  {
    id: 'sustainability',
    category: 'Workforce',
    emoji: '🌱',
    title: 'Sustainability & ESG',
    challenge: 'ESG commitments fail to translate into daily employee behaviour. Sustainability goals stay on slide decks instead of changing actions.',
    approach: "Build sustainability behaviour missions that translate company commitments into specific daily and weekly actions. The Behavioral Analyst tracks which missions drive the highest actual behaviour change and optimises the programme continuously.",
    metrics: ['62% sustained behaviour change rate', '44% reduction in office carbon footprint', '78% employee ESG engagement'],
    example: 'Green Office Mission: Track energy usage for 2 weeks → Identify 3 reduction opportunities → Implement changes → Measure impact → Share results with team',
  },
  {
    id: 'higher-ed',
    category: 'Learning',
    emoji: '🎓',
    title: 'Higher Education',
    challenge: "Universities struggle to prove that graduates are prepared for the workplace. Credential inflation means degrees alone no longer signal capability.",
    approach: 'Partner with employers to create verified capability missions that students complete during their degree. Graduate outcomes become evidence-based, with mission completion records forming a portable capability portfolio.',
    metrics: ['88% employer satisfaction with graduates', '3.5× higher graduate employment rate', '91% student engagement with missions'],
    example: 'Career Readiness Mission: Complete industry internship brief → Deliver client-grade work product → Receive employer validation → Build capability portfolio → Secure placement',
  },
  {
    id: 'government',
    category: 'Government',
    emoji: '🏛️',
    title: 'Government Programmes',
    challenge: 'Public programmes struggle to measure behavioural impact. Grant funding and welfare support lack feedback loops that show whether interventions worked.',
    approach: 'Design citizen missions that guide participants through programme steps, track real-world actions, and measure outcome achievement against policy goals. The Mission Effectiveness Index provides evidence for programme evaluation.',
    metrics: ['74% programme completion rate (vs 31% baseline)', '3.2× measured behaviour change', '56% reduction in follow-up support costs'],
    example: 'Employability Mission: Complete CV workshop → Apply to 5 roles → Attend interview preparation → Secure first interview → Receive coaching on feedback',
  },
  {
    id: 'community',
    category: 'Community',
    emoji: '🤝',
    title: 'Community Engagement',
    challenge: 'Community organisations struggle to sustain engagement beyond initial events. Members join but rarely deepen their participation.',
    approach: 'Create community onboarding and engagement missions that build relationships and contribution habits. Missions connect new members with existing ones, build contribution streaks, and surface leadership opportunities.',
    metrics: ['4× higher 90-day member retention', '2.8× increase in active contributors', '88% community satisfaction score'],
    example: 'Community Builder Mission: Attend first event → Connect with 5 members → Contribute to a project → Lead a session → Bring in a new member',
  },
];

export default function UseCasesPage() {
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'All' ? USE_CASES : USE_CASES.filter((u) => u.category === filter);

  return (
    <div className="bg-muted text-txt overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent/4 blur-[100px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12px] font-bold text-accent uppercase tracking-widest mb-4"
          >
            Use Cases
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-[clamp(2.5rem,5vw,4rem)] font-black text-txt leading-[1.05] tracking-tighter mb-5"
          >
            Outcomes across
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-dark">
              every industry.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="text-[1rem] text-txt-dim max-w-[480px] mx-auto"
          >
            X-hunt powers measurable outcomes for workforce teams, brands, educators, governments, and communities. Here&apos;s how.
          </motion.p>
        </div>
      </section>

      {/* ── FILTER ── */}
      <Sec className="pb-12 sticky top-16 z-40 bg-muted/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-3">
          <motion.div variants={fadeUp} className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  'whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all flex-shrink-0',
                  filter === cat
                    ? 'bg-accent text-[#050816]'
                    : 'bg-[rgba(255,255,255,0.05)] text-txt-dim hover:text-txt hover:bg-[rgba(255,255,255,0.08)]',
                )}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </Sec>

      {/* ── USE CASES ── */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {filtered.map((uc, i) => (
              <motion.div
                key={uc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === uc.id ? null : uc.id)}
                  className="w-full flex items-start sm:items-center gap-4 p-6 text-left"
                >
                  <span className="text-3xl flex-shrink-0">{uc.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-txt-faint uppercase tracking-wider bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-full">
                        {uc.category}
                      </span>
                    </div>
                    <p className="text-[16px] font-bold text-txt">{uc.title}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uc.metrics.slice(0, 2).map((m) => (
                        <span key={m} className="text-[10px] font-bold text-accent bg-accent/8 px-2 py-0.5 rounded-full">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    strokeWidth={2}
                    className={cn('text-txt-dim flex-shrink-0 transition-transform mt-1 sm:mt-0', expanded === uc.id && 'rotate-90')}
                  />
                </button>

                {expanded === uc.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-[rgba(255,255,255,0.05)] px-6 py-6"
                  >
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-[11px] font-bold text-txt-faint uppercase tracking-wider mb-2">The Challenge</p>
                        <p className="text-[13px] text-txt-dim leading-relaxed">{uc.challenge}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-txt-faint uppercase tracking-wider mb-2">Mission Approach</p>
                        <p className="text-[13px] text-txt-dim leading-relaxed">{uc.approach}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-txt-faint uppercase tracking-wider mb-2">Outcome Metrics</p>
                        <ul className="flex flex-col gap-1.5 mb-4">
                          {uc.metrics.map((m) => (
                            <li key={m} className="text-[12px] text-accent flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] font-bold text-txt-faint uppercase tracking-wider mb-1.5">Example Mission Flow</p>
                        <p className="text-[11px] text-txt-dim leading-relaxed italic">{uc.example}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <Sec className="py-20 lg:py-28 text-center">
        <div className="max-w-xl mx-auto px-5">
          <motion.h2 variants={fadeUp} className="text-[clamp(1.8rem,4vw,3rem)] font-black text-txt leading-tight tracking-tighter mb-5">
            Ready to deploy X-hunt for your use case?
          </motion.h2>
          <motion.div variants={fadeUp} custom={0.08} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact" className="flex items-center justify-center gap-2 h-12 px-7 bg-accent text-[#050816] rounded-xl text-[14px] font-bold shadow-[0_0_24px_rgba(34,255,170,0.3)] hover:bg-accent-dark transition-all">
              Talk to Our Team <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
            <Link href="/enterprise" className="flex items-center justify-center gap-2 h-12 px-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[14px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
              Enterprise Platform
            </Link>
          </motion.div>
        </div>
      </Sec>
    </div>
  );
}
