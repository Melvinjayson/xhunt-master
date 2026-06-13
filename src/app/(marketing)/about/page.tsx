'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Target, Brain, Globe, Zap } from 'lucide-react';

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

const VALUES = [
  {
    icon: Target,
    title: 'Outcomes over activity',
    desc: "We measure what actually changes — capability, behaviour, achievement. Not clicks, logins, or completion certificates.",
  },
  {
    icon: Brain,
    title: 'Intelligence that adapts',
    desc: "Every mission gets smarter. Every participant gets a more personalised experience. The system learns continuously.",
  },
  {
    icon: Globe,
    title: 'Universal access',
    desc: "Whether you're an individual trying to build a habit or an enterprise transforming 10,000 employees, X-hunt scales to you.",
  },
  {
    icon: Zap,
    title: 'Action over intent',
    desc: "Goals without action are just wishes. X-hunt bridges the intention-action gap with structured, real-world missions.",
  },
];

const FUTURES = [
  {
    title: 'The Future of Work',
    desc: "Workforce capability will no longer be measured by time in seat or training hours. It will be measured by outcomes achieved through real-world mission completion. X-hunt is building the intelligence layer for this future.",
    icon: '🏢',
  },
  {
    title: 'The Future of Learning',
    desc: "Education is moving from knowledge transfer to capability development. The institutions and platforms that survive will be those that can prove their graduates changed — not just learned. X-hunt provides that proof.",
    icon: '📚',
  },
  {
    title: 'The Future of Engagement',
    desc: "Customer loyalty programs, community engagement, and brand advocacy will be built on missions with real outcomes — not points and discounts. X-hunt is the infrastructure layer for the next generation of engagement.",
    icon: '🌐',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-muted text-txt overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent/4 blur-[110px] rounded-full" />
        </div>
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12px] font-bold text-accent uppercase tracking-widest mb-4"
          >
            Our Story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-[clamp(2.5rem,5vw,4rem)] font-black text-txt leading-[1.05] tracking-tighter mb-6"
          >
            We built X-hunt because the world
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-dark">
              {' '}confuses activity with outcomes.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-[1.05rem] text-txt-dim leading-relaxed max-w-[600px] mx-auto"
          >
            Most platforms reward engagement. We reward achievement. Most tools track what you do. We track what changes. That&apos;s the difference between a mission operating system and an app.
          </motion.p>
        </div>
      </section>

      {/* ── ORIGIN ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
          <motion.p variants={fadeUp} className="text-[12px] font-bold text-txt-faint uppercase tracking-widest mb-5">
            Why We Exist
          </motion.p>
          <motion.p variants={fadeUp} custom={0.06} className="text-[1.15rem] text-txt leading-relaxed mb-5">
            Every day, billions of people set goals they never achieve. Not because they lack motivation — but because they lack the infrastructure. Goals without missions are just intentions. Intentions without actions are just wishes.
          </motion.p>
          <motion.p variants={fadeUp} custom={0.12} className="text-[1rem] text-txt-dim leading-relaxed mb-5">
            At the same time, organisations spend trillions on learning, employee engagement, and customer loyalty — and struggle to prove any of it worked. The problem isn&apos;t effort. It&apos;s the absence of an outcome layer.
          </motion.p>
          <motion.p variants={fadeUp} custom={0.18} className="text-[1rem] text-txt-dim leading-relaxed mb-5">
            X-hunt was created to close this gap. We built an AI-native Mission Operating System that converts any goal — personal, professional, organisational — into structured missions with adaptive actions, real-time intelligence, and measurable outcomes.
          </motion.p>
          <motion.p variants={fadeUp} custom={0.24} className="text-[1rem] text-txt-dim leading-relaxed">
            We believe that intelligence should be in service of outcomes. Not clicks. Not completions. Actual, verifiable change.
          </motion.p>
        </div>
      </Sec>

      {/* ── VALUES ── */}
      <Sec className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-[12px] font-bold text-accent uppercase tracking-widest mb-3">
              Our Principles
            </motion.p>
            <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-txt leading-tight tracking-tight">
              What we believe.
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                custom={i * 0.08}
                className="flex gap-4 bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl p-6"
              >
                <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <v.icon size={22} strokeWidth={1.8} className="text-accent" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-txt mb-2">{v.title}</p>
                  <p className="text-[13px] text-txt-dim leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── FUTURES ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-[12px] font-bold text-ai uppercase tracking-widest mb-3">
              Our Thesis
            </motion.p>
            <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-txt leading-tight tracking-tight">
              The world is moving toward outcomes.
              <br />
              We&apos;re building the infrastructure.
            </motion.h2>
          </div>
          <div className="flex flex-col gap-5">
            {FUTURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i * 0.08}
                className="bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl p-7"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-[16px] font-bold text-txt mb-2">{f.title}</p>
                    <p className="text-[13px] text-txt-dim leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Sec>

      {/* ── CTA ── */}
      <Sec className="py-20 lg:py-28 text-center">
        <div className="max-w-xl mx-auto px-5">
          <motion.h2
            variants={fadeUp}
            className="text-[clamp(2rem,4vw,3rem)] font-black text-txt leading-tight tracking-tighter mb-5"
          >
            Join us in building the
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-dark">
              mission-driven future.
            </span>
          </motion.h2>
          <motion.div variants={fadeUp} custom={0.08} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/get-started" className="flex items-center justify-center gap-2 h-12 px-7 bg-accent text-[#050816] rounded-xl text-[14px] font-bold shadow-[0_0_24px_rgba(34,255,170,0.3)] hover:shadow-[0_0_36px_rgba(34,255,170,0.45)] hover:bg-accent-dark transition-all">
              Start Exploring <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
            <Link href="/contact" className="flex items-center justify-center gap-2 h-12 px-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[14px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
              Get in Touch
            </Link>
          </motion.div>
        </div>
      </Sec>
    </div>
  );
}
