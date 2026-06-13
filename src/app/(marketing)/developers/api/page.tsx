'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Copy, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-[#060c0d] border border-[rgba(255,255,255,0.07)] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.05)]">
        <span className="text-[10px] font-mono text-txt-faint uppercase tracking-wider">{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-[11px] text-txt-dim hover:text-txt transition-colors"
        >
          {copied ? <Check size={11} className="text-accent" /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto text-txt-dim whitespace-pre">{code}</pre>
    </div>
  );
}

const API_SECTIONS = [
  {
    id: 'authentication',
    title: 'Authentication',
    method: null,
    path: null,
    desc: 'All API requests must be authenticated using an API key passed in the Authorization header.',
    request: null,
    response: null,
    notes: `# API Authentication

All requests require an API key in the Authorization header:

Authorization: Bearer xhunt_live_sk_...

API keys are scoped (read-only, write, admin) and can be rotated from your dashboard.
Rate limits: 1,000 req/hr (Starter) · 10,000 req/hr (Growth) · Unlimited (Enterprise)`,
  },
  {
    id: 'create-mission',
    title: 'Create Mission',
    method: 'POST',
    path: '/v1/missions',
    desc: 'Creates a new mission programme. The AI agents will automatically architect the mission structure based on your goal and audience parameters.',
    request: `{
  "title": "Employee Onboarding — Engineering",
  "goal": "Achieve time-to-productivity under 30 days",
  "audience": {
    "segment_id": "seg_engineers",
    "max_participants": 50
  },
  "outcomes": [
    {
      "metric": "time_to_first_commit",
      "target": "< 7 days",
      "weight": 0.4
    },
    {
      "metric": "onboarding_nps",
      "target": ">= 45",
      "weight": 0.3
    },
    {
      "metric": "30_day_retention",
      "target": ">= 95%",
      "weight": 0.3
    }
  ],
  "config": {
    "adaptive_difficulty": true,
    "ai_nudges": true,
    "completion_window_days": 30
  }
}`,
    response: `{
  "id": "ms_01J8FGHKPXQRS9T2UV3WXY4Z",
  "status": "draft",
  "title": "Employee Onboarding — Engineering",
  "goal": "Achieve time-to-productivity under 30 days",
  "created_at": "2025-06-09T10:24:00Z",
  "phases": [
    {
      "id": "ph_01",
      "title": "Week 1: Orientation",
      "actions": 6,
      "outcomes": ["first_commit", "team_introductions"]
    },
    {
      "id": "ph_02",
      "title": "Week 2: Contribution",
      "actions": 8,
      "outcomes": ["pr_review_participation", "stand_up_cadence"]
    }
  ],
  "mei_baseline": null,
  "participant_count": 0
}`,
  },
  {
    id: 'get-mei',
    title: 'Get Mission Effectiveness Index',
    method: 'GET',
    path: '/v1/analytics/mei/{mission_id}',
    desc: 'Retrieve the Mission Effectiveness Index and constituent metrics for a mission. MEI updates in real-time as participants progress.',
    request: null,
    response: `{
  "mission_id": "ms_01J8FGHKPXQRS9T2UV3WXY4Z",
  "mei": 87.4,
  "updated_at": "2025-06-09T14:30:00Z",
  "components": {
    "completion_rate": { "value": 0.91, "weight": 0.25, "score": 22.75 },
    "engagement_depth": { "value": 0.88, "weight": 0.2, "score": 17.6 },
    "outcome_attainment": { "value": 0.82, "weight": 0.35, "score": 28.7 },
    "adaptation_success": { "value": 0.93, "weight": 0.2, "score": 18.6 }
  },
  "trend": "+4.2 vs last_period",
  "percentile": "top_8_percent",
  "participants": {
    "total": 47,
    "active": 39,
    "completed": 12,
    "at_risk": 4
  }
}`,
  },
  {
    id: 'webhooks',
    title: 'Webhook Events',
    method: 'POST',
    path: 'Your endpoint',
    desc: 'X-hunt delivers real-time webhook events to your registered endpoint. All payloads are signed with HMAC-SHA256.',
    request: `// Register a webhook
POST /v1/webhooks
{
  "url": "https://api.yourapp.com/webhooks/xhunt",
  "events": [
    "mission.outcome.achieved",
    "mission.participant.completed",
    "mission.participant.dropped",
    "mission.mei.updated"
  ],
  "secret": "whsec_..."
}`,
    response: `// Sample event payload — mission.outcome.achieved
{
  "id": "evt_01J8FGHKPX...",
  "event": "mission.outcome.achieved",
  "created_at": "2025-06-09T15:22:00Z",
  "data": {
    "mission_id": "ms_01J8FGHK...",
    "participant_id": "usr_01AB...",
    "outcome": {
      "metric": "time_to_first_commit",
      "target": "< 7 days",
      "achieved_value": "4 days",
      "achieved_at": "2025-06-09T15:21:00Z"
    },
    "mei_impact": "+1.8"
  }
}`,
  },
  {
    id: 'recommendations',
    title: 'Mission Recommendations',
    method: 'POST',
    path: '/v1/recommendations',
    desc: 'Generate personalised mission recommendations for a participant based on their profile, history, and goals.',
    request: `{
  "participant_id": "usr_01AB...",
  "context": {
    "current_goal": "Improve fitness consistency",
    "location": "Lagos, Nigeria",
    "available_time_per_day": 45,
    "completed_missions": ["ms_fitness_01", "ms_nutrition_02"]
  },
  "limit": 5
}`,
    response: `{
  "recommendations": [
    {
      "mission_id": "ms_fitness_advanced_03",
      "title": "30-Day Athletic Foundation",
      "relevance_score": 0.94,
      "reason": "Builds on completed fitness missions; matches 45min daily window",
      "predicted_completion_rate": 0.88,
      "predicted_outcome_attainment": 0.82
    }
  ],
  "generated_at": "2025-06-09T16:00:00Z"
}`,
  },
  {
    id: 'outcome-validations',
    title: 'Outcome Validations',
    method: 'POST',
    path: '/v1/outcomes/validations',
    desc: 'Submit a real-world outcome for evidence-based validation. Supports self-reported, peer-verified, automated, and manager-verified validation types. Approved validations contribute to the MEI outcome_score component.',
    request: `// POST /v1/outcomes/validations — Submit validation
{
  "mission_id": "ms_01J8FGHK...",
  "outcome_event_id": "oe_01AB...",  // optional — links to existing outcome_event
  "validation_type": "manager_verified",
  "evidence": [
    {
      "type": "document",
      "label": "Q2 Performance Review",
      "url": "https://drive.company.com/review-q2.pdf",
      "submitted_at": "2025-06-09T10:00:00Z"
    },
    {
      "type": "metric",
      "label": "Time-to-first-commit",
      "value": "4 days",
      "submitted_at": "2025-06-09T10:00:00Z"
    }
  ]
}

// PATCH /v1/outcomes/validations/{id} — Review
{
  "status": "approved",           // approved | rejected | requires_evidence
  "confidence_score": 92,         // 0–100 (influences MEI weight)
  "reviewer_notes": "Confirmed via Q2 review. Excellent result."
}`,
    response: `// POST 201 Created
{
  "validation": {
    "id": "val_01J8...",
    "status": "pending",
    "validation_type": "manager_verified",
    "evidence": [...],
    "confidence_score": null,
    "submitted_at": "2025-06-09T10:00:00Z"
  }
}

// GET /v1/outcomes/validations?status=approved&mission_id=ms_01J8...
{
  "validations": [
    {
      "id": "val_01J8...",
      "status": "approved",
      "confidence_score": 92,
      "reviewer_notes": "Confirmed via Q2 review.",
      "reviewed_at": "2025-06-09T14:30:00Z",
      "evidence": [
        { "type": "document", "label": "Q2 Performance Review" },
        { "type": "metric", "label": "Time-to-first-commit", "value": "4 days" }
      ]
    }
  ]
}`,
    notes: null,
  },
  {
    id: 'escrow',
    title: 'Escrow Services',
    method: 'POST',
    path: '/v1/escrow',
    desc: 'Create outcome-gated escrow accounts. Funds are held and released only when configured conditions (MEI threshold, outcome count, manual approval, deadline, or hybrid) are satisfied. Every action is recorded in an immutable transaction log.',
    request: `// POST /v1/escrow — Create escrow account
{
  "mission_id": "ms_01J8FGHK...",
  "amount_cents": 500000,           // $5,000.00 USD
  "currency": "usd",
  "release_condition": "hybrid",    // mei_threshold | outcome_count | manual_approval | deadline_based | hybrid
  "release_config": {
    "mei_threshold": 75,            // release when MEI ≥ 75
    "outcome_count": 10             // AND 10+ validated outcomes
  }
}

// POST /v1/escrow/{id}/release
{
  "release_amount_cents": 250000,   // partial release — omit for full release
  "notes": "Milestone 1 conditions met — MEI 78, 12 validations"
}

// POST /v1/escrow/{id}/dispute
{
  "reason": "Outcome count threshold not independently verified"
}`,
    response: `// POST 201 Created
{
  "escrow": {
    "id": "esc_01J8...",
    "status": "created",
    "amount_cents": 500000,
    "released_amount_cents": 0,
    "release_condition": "hybrid",
    "release_config": { "mei_threshold": 75, "outcome_count": 10 },
    "created_at": "2025-06-09T10:00:00Z"
  }
}

// POST /v1/escrow/{id}/release — 200 OK
{
  "escrow": {
    "id": "esc_01J8...",
    "status": "partially_released",
    "released_amount_cents": 250000,
    "amount_cents": 500000
  },
  "released_amount_cents": 250000
}`,
    notes: `# Escrow status lifecycle

created → funded → locked → partially_released
                           → fully_released
                           → disputed → (admin) → refunded / released

Release auto-records a revenue_record with category "escrow_release".
Dispute holds the unreleased balance until resolved.`,
  },
  {
    id: 'revenue',
    title: 'Revenue & Invoicing',
    method: 'GET',
    path: '/v1/revenue',
    desc: 'Access revenue summaries, records by category, and invoice generation. Revenue is automatically tracked on escrow releases, subscription events, and mission fees. Invoices are generated with line items and due dates.',
    request: `// GET /v1/revenue?category=escrow_release&from=2025-01-01
// GET /v1/revenue/invoices?status=open

// POST /v1/revenue/invoices — Generate invoice
{
  "due_days": 30,
  "currency": "usd",
  "line_items": [
    {
      "description": "Mission Programme — Q2 2025",
      "quantity": 1,
      "unit_price_cents": 250000,
      "amount_cents": 250000,
      "category": "mission_fee"
    },
    {
      "description": "Outcome Bonus — 12 verified outcomes",
      "quantity": 12,
      "unit_price_cents": 5000,
      "amount_cents": 60000,
      "category": "outcome_bonus"
    }
  ]
}`,
    response: `// GET /v1/revenue
{
  "summary": {
    "total_revenue_cents": 1840000,
    "mrr_cents": 310000,
    "arr_cents": 1540000,
    "by_category": {
      "subscription": 840000,
      "escrow_release": 500000,
      "mission_fee": 310000,
      "outcome_bonus": 190000
    }
  },
  "records": [
    {
      "id": "rev_01J8...",
      "category": "escrow_release",
      "amount_cents": 250000,
      "description": "Escrow release — full (escrow esc_01J8...)",
      "recognized_at": "2025-06-09T14:30:00Z"
    }
  ]
}

// POST /v1/revenue/invoices — 201 Created
{
  "invoice": {
    "id": "inv_01J8...",
    "invoice_number": "INV-2025-0007",
    "status": "open",
    "amount_cents": 310000,
    "issued_at": "2025-06-09T10:00:00Z",
    "due_at": "2025-07-09T10:00:00Z"
  }
}`,
    notes: null,
  },
];

const NAV_ITEMS = [
  { id: 'authentication',       label: 'Authentication',       group: 'Core' },
  { id: 'create-mission',       label: 'Create Mission',       group: 'Missions' },
  { id: 'get-mei',              label: 'MEI',                  group: 'Analytics' },
  { id: 'webhooks',             label: 'Webhooks',             group: 'Core' },
  { id: 'recommendations',      label: 'Recommendations',      group: 'Intelligence' },
  { id: 'outcome-validations',  label: 'Outcome Validations',  group: 'Outcomes' },
  { id: 'escrow',               label: 'Escrow Services',      group: 'Outcomes' },
  { id: 'revenue',              label: 'Revenue & Invoicing',  group: 'Outcomes' },
];

export default function ApiReferencePage() {
  const [activeEndpoint, setActiveEndpoint] = useState('authentication');
  const active = API_SECTIONS.find((s) => s.id === activeEndpoint) ?? API_SECTIONS[0];

  return (
    <div className="bg-muted text-txt overflow-x-hidden">
      {/* Header */}
      <section className="pt-20 pb-6 border-b border-[rgba(255,255,255,0.06)] bg-[#050816]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[12px] text-txt-faint mb-4">
            <Link href="/developers" className="hover:text-txt transition-colors">Developers</Link>
            <ChevronRight size={12} strokeWidth={2} />
            <span className="text-txt">API Reference</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[2.2rem] font-black text-txt tracking-tight mb-2"
          >
            API Reference
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[14px] text-txt-dim"
          >
            RESTful API. Base URL:{' '}
            <code className="font-mono text-ai bg-ai/8 px-1.5 py-0.5 rounded">
              https://api.xhunt.app
            </code>
          </motion.p>
        </div>
      </section>

      {/* Split layout */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex gap-0 min-h-screen">
          {/* Sidebar */}
          <nav className="hidden md:flex flex-col w-56 flex-shrink-0 py-8 pr-6 border-r border-[rgba(255,255,255,0.05)]">
            {Array.from(new Set(NAV_ITEMS.map(n => n.group))).map(group => (
              <div key={group} className="mb-4">
                <p className="text-[10px] font-bold text-txt-faint uppercase tracking-widest mb-2 px-3">{group}</p>
                {NAV_ITEMS.filter(n => n.group === group).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveEndpoint(item.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors mb-0.5',
                      activeEndpoint === item.id
                        ? 'bg-[rgba(255,255,255,0.06)] text-txt'
                        : 'text-txt-dim hover:text-txt hover:bg-[rgba(255,255,255,0.04)]',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Mobile nav */}
          <div className="md:hidden w-full">
            <div className="py-4 flex gap-2 overflow-x-auto no-scrollbar">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveEndpoint(item.id)}
                  className={cn(
                    'whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all flex-shrink-0',
                    activeEndpoint === item.id ? 'bg-ai text-[#050816]' : 'bg-card text-txt-dim',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 md:pl-10 py-8 md:py-10 min-w-0">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Title row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {active.method && (
                  <span className={cn(
                    'text-[11px] font-black px-2.5 py-1 rounded-lg',
                    active.method === 'GET'   ? 'bg-ai/15 text-ai' :
                    active.method === 'PATCH' ? 'bg-[#818cf8]/15 text-[#818cf8]' :
                    'bg-accent/15 text-accent',
                  )}>
                    {active.method}
                  </span>
                )}
                {active.path && (
                  <code className="text-[13px] font-mono text-txt">{active.path}</code>
                )}
              </div>
              <h2 className="text-[1.6rem] font-black text-txt tracking-tight mb-3">{active.title}</h2>
              <p className="text-[14px] text-txt-dim leading-relaxed mb-8 max-w-[560px]">{active.desc}</p>

              {active.notes && (
                <div className="mb-6">
                  <CodeBlock code={active.notes} lang="Notes" />
                </div>
              )}

              {active.request && (
                <div className="mb-6">
                  <p className="text-[11px] font-bold text-txt-faint uppercase tracking-widest mb-2">
                    {active.id === 'webhooks' ? 'Setup & Sample Request' : 'Request Body'}
                  </p>
                  <CodeBlock code={active.request} lang="JSON" />
                </div>
              )}

              {active.response && (
                <div className="mb-6">
                  <p className="text-[11px] font-bold text-txt-faint uppercase tracking-widest mb-2">
                    {active.id === 'webhooks' ? 'Webhook Payload' : 'Response'}
                  </p>
                  <CodeBlock code={active.response} lang="JSON" />
                </div>
              )}

              {/* Navigation between endpoints */}
              <div className="flex justify-between items-center mt-10 pt-8 border-t border-[rgba(255,255,255,0.05)]">
                {NAV_ITEMS.findIndex((n) => n.id === active.id) > 0 ? (
                  <button
                    onClick={() => setActiveEndpoint(NAV_ITEMS[NAV_ITEMS.findIndex((n) => n.id === active.id) - 1].id)}
                    className="flex items-center gap-2 text-[13px] font-semibold text-txt-dim hover:text-txt transition-colors"
                  >
                    ← {NAV_ITEMS[NAV_ITEMS.findIndex((n) => n.id === active.id) - 1]?.label}
                  </button>
                ) : <div />}
                {NAV_ITEMS.findIndex((n) => n.id === active.id) < NAV_ITEMS.length - 1 && (
                  <button
                    onClick={() => setActiveEndpoint(NAV_ITEMS[NAV_ITEMS.findIndex((n) => n.id === active.id) + 1].id)}
                    className="flex items-center gap-2 text-[13px] font-semibold text-txt-dim hover:text-txt transition-colors"
                  >
                    {NAV_ITEMS[NAV_ITEMS.findIndex((n) => n.id === active.id) + 1]?.label} →
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
