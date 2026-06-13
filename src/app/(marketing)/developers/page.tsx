'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Code2, Zap, Globe, Webhook, BookOpen, Terminal, ChevronRight, Copy, Check } from 'lucide-react';
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

const DOC_SECTIONS = [
  { icon: BookOpen, title: 'Overview', desc: 'Platform architecture, key concepts, and integration patterns.', href: '#overview' },
  { icon: Terminal, title: 'Quick Start', desc: 'Get your first API call running in under 5 minutes.', href: '#quickstart' },
  { icon: Code2, title: 'Authentication', desc: 'API keys, OAuth 2.0, JWT scopes, and token management.', href: '#auth' },
  { icon: Globe, title: 'Missions API', desc: 'Create, configure, launch, and monitor mission programmes.', href: '#missions' },
  { icon: Zap, title: 'Audience API', desc: 'Manage participant profiles, segments, and personalisation.', href: '#audience' },
  { icon: Webhook, title: 'Webhooks', desc: 'Real-time event delivery for mission lifecycle and outcomes.', href: '#webhooks' },
];

const SDK_LANGS = ['TypeScript', 'Python', 'Go', 'Ruby', 'Java'];

const QUICK_START_CODE = `import { XhuntClient } from '@xhunt/sdk';

const client = new XhuntClient({
  apiKey: process.env.XHUNT_API_KEY,
});

// Create a mission programme
const mission = await client.missions.create({
  title: 'Employee Onboarding',
  goal: 'Time-to-productivity < 30 days',
  audience: { segment: 'new-hires', count: 50 },
  outcomes: [
    { metric: 'time_to_first_contribution', target: '< 14 days' },
    { metric: 'onboarding_satisfaction', target: '>= 4.5/5' },
  ],
});

console.log(\`Mission created: \${mission.id}\`);
// → Mission created: ms_01J8FGHK...`;

const WEBHOOK_CODE = `// X-hunt sends signed POST requests to your endpoint
// Verify signature with HMAC-SHA256

app.post('/webhooks/xhunt', (req, res) => {
  const sig = req.headers['x-xhunt-signature'];
  const payload = req.body;

  if (!verifySignature(payload, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }

  switch (payload.event) {
    case 'mission.outcome.achieved':
      await markCertified(payload.data.participant_id);
      break;
    case 'mission.participant.dropped':
      await triggerReEngagement(payload.data);
      break;
  }

  res.status(200).send('OK');
});`;

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
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] text-txt-dim hover:text-txt transition-colors"
        >
          {copied ? <Check size={12} strokeWidth={2.5} className="text-accent" /> : <Copy size={12} strokeWidth={2} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[12px] font-mono leading-relaxed overflow-x-auto text-txt-dim whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

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
                A complete API surface for mission creation, audience management, outcome tracking, and AI orchestration. RESTful, documented, and production-ready.
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

            {/* Code preview */}
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

      {/* ── SDKS ── */}
      <Sec className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p variants={fadeUp} className="text-[12px] font-bold text-ai uppercase tracking-widest mb-3">
                SDKs & Libraries
              </motion.p>
              <motion.h2 variants={fadeUp} custom={0.06} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight mb-5">
                Ship faster in any language.
              </motion.h2>
              <motion.p variants={fadeUp} custom={0.12} className="text-[14px] text-txt-dim leading-relaxed mb-6">
                First-party SDKs for every major language with full TypeScript types, async/await support, and auto-pagination.
              </motion.p>
              <motion.div variants={fadeUp} custom={0.18} className="flex flex-wrap gap-2">
                {SDK_LANGS.map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1.5 bg-card border border-[rgba(255,255,255,0.08)] rounded-lg text-[12px] font-semibold text-txt-dim hover:text-txt hover:border-ai/25 transition-all cursor-pointer"
                  >
                    {lang}
                  </span>
                ))}
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={0.2}>
              <CodeBlock code={WEBHOOK_CODE} lang="Webhooks — Node.js" />
            </motion.div>
          </div>
        </div>
      </Sec>

      {/* ── API TABLE ── */}
      <Sec className="py-20 lg:py-28 bg-[#050816] border-y border-[rgba(255,255,255,0.05)]">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <motion.h2 variants={fadeUp} className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-txt leading-tight tracking-tight">
              Complete API surface.
            </motion.h2>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { method: 'POST', path: '/v1/missions', desc: 'Create a new mission programme' },
              { method: 'GET', path: '/v1/missions/{id}', desc: 'Retrieve mission details and status' },
              { method: 'GET', path: '/v1/missions/{id}/participants', desc: 'List mission participants and progress' },
              { method: 'POST', path: '/v1/audience/segments', desc: 'Create audience segment' },
              { method: 'GET', path: '/v1/analytics/mei/{id}', desc: 'Get Mission Effectiveness Index + components' },
              { method: 'POST', path: '/v1/recommendations', desc: 'Generate personalised mission recommendations' },
              { method: 'POST', path: '/v1/outcomes/validations', desc: 'Submit outcome for evidence-based validation' },
              { method: 'GET', path: '/v1/outcomes/validations', desc: 'List validations — filter by status / mission' },
              { method: 'PATCH', path: '/v1/outcomes/validations/{id}', desc: 'Review validation — approve / reject / request evidence' },
              { method: 'POST', path: '/v1/escrow', desc: 'Create outcome-gated escrow account' },
              { method: 'POST', path: '/v1/escrow/{id}/release', desc: 'Release escrowed funds (full or partial)' },
              { method: 'POST', path: '/v1/escrow/{id}/dispute', desc: 'Open escrow dispute with reason' },
              { method: 'GET', path: '/v1/revenue', desc: 'Revenue summary, MRR/ARR, records by category' },
              { method: 'POST', path: '/v1/revenue/invoices', desc: 'Generate invoice with line items' },
              { method: 'POST', path: '/v1/webhooks', desc: 'Register webhook endpoint' },
            ].map((endpoint, i) => (
              <motion.div
                key={endpoint.path}
                variants={fadeUp}
                custom={i * 0.04}
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
              View full API reference
              <ChevronRight size={15} strokeWidth={2.5} />
            </Link>
          </motion.div>
        </div>
      </Sec>

      {/* ── CTA ── */}
      <Sec className="py-20 lg:py-28 text-center">
        <div className="max-w-xl mx-auto px-5">
          <motion.h2 variants={fadeUp} className="text-[clamp(1.8rem,3.8vw,3rem)] font-black text-txt leading-tight tracking-tighter mb-5">
            Start building today.
          </motion.h2>
          <motion.p variants={fadeUp} custom={0.07} className="text-[14px] text-txt-dim mb-8">
            Free tier includes 1,000 API requests/month. No credit card required.
          </motion.p>
          <motion.div variants={fadeUp} custom={0.14} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/get-started" className="flex items-center justify-center gap-2 h-12 px-7 bg-ai text-[#050816] rounded-xl text-[14px] font-bold shadow-[0_0_24px_rgba(109,93,253,0.3)] hover:opacity-90 transition-all">
              Get API Key <ArrowRight size={14} strokeWidth={2.8} />
            </Link>
            <Link href="/developers/api" className="flex items-center justify-center gap-2 h-12 px-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-txt rounded-xl text-[14px] font-semibold hover:bg-[rgba(255,255,255,0.08)] transition-all">
              API Reference
            </Link>
          </motion.div>
        </div>
      </Sec>
    </div>
  );
}
