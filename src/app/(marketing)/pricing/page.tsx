'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check, X, ChevronRight, Zap } from 'lucide-react';
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

const PLANS = [
  {
    name: 'Starter',
    tag: 'Free forever',
    price: { monthly: 0, annual: 0 },
    desc: 'For individuals exploring the platform and getting started with AI missions.',
    color: 'neutral',
    cta: 'Get Started Free',
    ctaHref: '/get-started',
    features: [
      { text: '5 AI-generated hunts per month', included: true },
      { text: 'Core hunt categories', included: true },
      { text: 'Basic progress tracking', included: true },
      { text: 'Achievement badges', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'Unlimited missions', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority AI agents', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    name: 'Growth',
    tag: 'Most popular',
    price: { monthly: 19, annual: 15 },
    desc: 'For serious individuals and small teams who want unlimited AI-powered missions.',
    color: 'accent',
    featured: true,
    cta: 'Start 14-Day Trial',
    ctaHref: '/get-started',
    features: [
      { text: 'Unlimited AI-generated missions', included: true },
      { text: 'All hunt categories', included: true },
      { text: 'Advanced progress analytics', included: true },
      { text: 'Priority AI agent access', included: true },
      { text: 'Rewards & loyalty program', included: true },
      { text: 'Mission Effectiveness Index', included: true },
      { text: 'Team collaboration (up to 5)', included: true },
      { text: 'API access (1,000 req/mo)', included: true },
      { text: 'Enterprise features', included: false },
    ],
  },
  {
    name: 'Enterprise',
    tag: 'Custom pricing',
    price: null,
    desc: 'For organisations running large-scale mission programs with governance and analytics.',
    color: 'ai',
    cta: 'Request Demo',
    ctaHref: '/contact',
    features: [
      { text: 'Everything in Growth', included: true },
      { text: 'Unlimited seats & missions', included: true },
      { text: 'Mission Studio & Control', included: true },
      { text: 'Multi-tenant governance', included: true },
      { text: 'RBAC & approval workflows', included: true },
      { text: 'SSO / SAML authentication', included: true },
      { text: 'Custom AI agent training', included: true },
      { text: 'Unlimited API access', included: true },
      { text: 'Dedicated success manager', included: true },
    ],
  },
];

const ADD_ONS = [
  { name: 'AI Credits Pack', desc: 'Extra AI mission generation credits', price: '$9 / 500 credits' },
  { name: 'Analytics Pro', desc: 'Advanced outcome dashboards and exports', price: '$29 / mo' },
  { name: 'Custom Branding', desc: 'White-label the platform for your audience', price: '$49 / mo' },
  { name: 'API Expansion', desc: 'Additional API request capacity', price: '$19 / 10K req' },
];

const FAQ = [
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: "Yes. You can change your plan at any time from your account settings. Upgrades take effect immediately; downgrades take effect at the end of your billing period.",
  },
  {
    q: 'What counts as a mission?',
    a: "A mission is one complete AI-generated hunt with a defined outcome, actions, and tracking. Completing a mission and starting a new one both count. Re-running an archived mission doesn't use a new credit.",
  },
  {
    q: 'How does Enterprise pricing work?',
    a: "Enterprise pricing is based on seat count, mission volume, and required modules. We'll work with you to build a deployment that fits your budget and outcome goals.",
  },
  {
    q: 'Is there a free trial for Growth?',
    a: "Yes — all Growth plan features are available free for 14 days, no credit card required. After the trial, you'll choose to subscribe or continue on the free Starter plan.",
  },
  {
    q: 'What data do you store and how is it secured?',
    a: "We are SOC 2 Type II certified and GDPR compliant. Mission data, behavioural signals, and outcomes are stored encrypted at rest and in transit. Enterprise customers can choose data residency regions.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            Pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-[clamp(2.5rem,5vw,4rem)] font-black text-txt leading-[1.05] tracking-tighter mb-5"
          >
            Simple, outcome-focused
            <br />
            pricing.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="text-[1rem] text-txt-dim mb-8"
          >
            Start free. Scale when you need. No hidden fees, no per-seat traps.
          </motion.p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.24 }}
            className="inline-flex items-center gap-1 bg-[#07101F] border border-[rgba(255,255,255,0.08)] rounded-xl p-1"
          >
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all',
                !annual ? 'bg-[rgba(255,255,255,0.08)] text-txt' : 'text-txt-dim',
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5',
                annual ? 'bg-[rgba(255,255,255,0.08)] text-txt' : 'text-txt-dim',
              )}
            >
              Annual
              <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section className="pb-24 lg:pb-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.1 }}
                className={cn(
                  'relative rounded-2xl p-7 border flex flex-col',
                  plan.featured
                    ? 'bg-gradient-to-b from-accent/8 to-[#050816] border-accent/25 shadow-[0_0_40px_rgba(34,255,170,0.1)]'
                    : plan.color === 'ai'
                    ? 'bg-card border-ai/15'
                    : 'bg-card border-[rgba(255,255,255,0.07)]',
                )}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-[#050816] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    {plan.tag}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[15px] font-bold text-txt">{plan.name}</p>
                    {!plan.featured && (
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        plan.color === 'ai' ? 'bg-ai/10 text-ai' : 'bg-[rgba(255,255,255,0.06)] text-txt-dim',
                      )}>
                        {plan.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-txt-dim mb-5">{plan.desc}</p>

                  {plan.price !== null ? (
                    <div className="flex items-end gap-1">
                      <span className="text-[3rem] font-black text-txt leading-none tabular-nums">
                        ${annual ? plan.price.annual : plan.price.monthly}
                      </span>
                      <span className="text-[13px] text-txt-dim mb-1">/ month</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[2rem] font-black text-ai">Custom</span>
                      <p className="text-[12px] text-txt-dim mt-0.5">Talk to sales for a quote</p>
                    </div>
                  )}
                  {plan.price !== null && plan.price.monthly > 0 && annual && (
                    <p className="text-[11px] text-txt-faint mt-1">
                      Billed annually · ${plan.price.annual * 12}/yr
                    </p>
                  )}
                </div>

                <Link
                  href={plan.ctaHref}
                  className={cn(
                    'flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-bold transition-all duration-200 mb-6',
                    plan.color === 'accent'
                      ? 'bg-accent text-[#050816] shadow-[0_0_20px_rgba(34,255,170,0.25)] hover:shadow-[0_0_30px_rgba(34,255,170,0.4)] hover:bg-accent-dark'
                      : plan.color === 'ai'
                      ? 'bg-ai text-[#050816] hover:opacity-90'
                      : 'bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] text-txt hover:bg-[rgba(255,255,255,0.1)]',
                  )}
                >
                  {plan.cta}
                  <ArrowRight size={13} strokeWidth={2.8} />
                </Link>

                <div className="h-px bg-[rgba(255,255,255,0.05)] mb-5" />

                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat.text} className="flex items-start gap-2.5">
                      {feat.included ? (
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                          plan.color === 'accent' ? 'bg-accent/15' : plan.color === 'ai' ? 'bg-ai/15' : 'bg-[rgba(255,255,255,0.06)]',
                        )}>
                          <Check size={9} strokeWidth={3} className={plan.color === 'accent' ? 'text-accent' : plan.color === 'ai' ? 'text-ai' : 'text-txt-dim'} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[rgba(255,255,255,0.03)]">
                          <X size={9} strokeWidth={2.5} className="text-txt-faint" />
                        </div>
                      )}
                      <span className={cn('text-[12px]', feat.included ? 'text-txt-dim' : 'text-txt-faint')}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADD-ONS ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-[12px] font-bold text-txt-faint uppercase tracking-widest mb-3">
              Add-ons
            </motion.p>
            <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight">
              Extend your plan.
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {ADD_ONS.map((a, i) => (
              <motion.div
                key={a.name}
                variants={fadeUp}
                custom={i * 0.07}
                className="bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-[14px] font-bold text-txt mb-0.5">{a.name}</p>
                  <p className="text-[12px] text-txt-dim">{a.desc}</p>
                </div>
                <span className="text-[13px] font-bold text-accent whitespace-nowrap">{a.price}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── FAQ ── */}
      <Sec className="py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight">
              Frequently asked questions.
            </motion.h2>
          </div>

          <div className="flex flex-col gap-2">
            {FAQ.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i * 0.06}
                className="bg-card border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[14px] font-semibold text-txt">{f.q}</span>
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    className={cn(
                      'text-txt-dim flex-shrink-0 transition-transform duration-200',
                      openFaq === i ? 'rotate-90' : '',
                    )}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-[rgba(255,255,255,0.05)]">
                    <p className="text-[13px] text-txt-dim leading-relaxed pt-3">{f.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} custom={0.5} className="text-center text-[13px] text-txt-dim mt-8">
            Still have questions?{' '}
            <Link href="/contact" className="text-accent font-semibold hover:text-accent-dark transition-colors">
              Talk to our team →
            </Link>
          </motion.p>
        </div>
      </Sec>

      {/* ── CTA ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-t border-[rgba(255,255,255,0.05)]">
        <div className="max-w-xl mx-auto px-5 text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-accent/8 border border-accent/18 rounded-full px-3.5 py-1.5 mb-6">
            <Zap size={12} className="text-accent" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-accent">No credit card required</span>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={0.07} className="text-[clamp(2rem,4vw,3rem)] font-black text-txt leading-[1.05] tracking-tighter mb-5">
            Start free, scale with outcomes.
          </motion.h2>
          <motion.div variants={fadeUp} custom={0.14} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/get-started" className="flex items-center justify-center gap-2 h-13 px-7 bg-accent text-[#050816] rounded-xl text-[15px] font-bold shadow-[0_0_28px_rgba(34,255,170,0.35)] hover:shadow-[0_0_40px_rgba(34,255,170,0.5)] hover:bg-accent-dark transition-all">
              Get Started Free <ArrowRight size={15} strokeWidth={2.8} />
            </Link>
            <Link href="/contact" className="flex items-center justify-center gap-2 h-13 px-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[15px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
              Talk to Sales
            </Link>
          </motion.div>
        </div>
      </Sec>
    </div>
  );
}
