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
  // ── CORE ──────────────────────────────────────────────────────────────────
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

API keys are scoped (read-only, write, admin) and rotated from your dashboard.

Rate limits
  Starter:    1,000 req/hr
  Growth:    10,000 req/hr
  Enterprise:  unlimited

Agent API calls count at 5× the base rate (each call invokes one or more LLMs).
XIL orchestration calls count at 10× (constitutional check + parallel agent invocations).`,
  },

  // ── XIL ───────────────────────────────────────────────────────────────────
  {
    id: 'xil-invoke',
    title: 'XIL — Invoke Intelligence',
    method: 'POST',
    path: '/api/xil',
    desc: 'Invoke the XIL intelligence orchestration layer. Routes the request to one or more specialist agents based on intelligenceFunction, runs a constitutional alignment check first, and returns all results with full provenance. Governance and Foundry functions require admin role.',
    request: `{
  "intelligenceFunction": "community",
  // one of: personal | community | marketplace | impact | governance | foundry

  "objective": "Identify collaboration opportunities in the Lagos tech cohort",
  // Plain-language goal passed to the agent(s)

  "context": {
    // Free-form context object — agent-specific fields go here
    "communityContext": "Lagos Web3 builders, 340 active members",
    "activeMissions": [
      { "id": "ms_01", "title": "DeFi Build Sprint", "participantCount": 68, "tags": ["tech", "finance"] }
    ],
    "participantCohort": [
      { "interests": ["web3", "open-source"], "skills": ["Solidity", "React"], "location": "Lagos" }
    ]
  },
  "sessionId": "ses_01AB..."    // optional — used for routing log correlation
}`,
    response: `{
  "intelligenceFunction": "community",
  "agentsInvoked": ["community-catalyst"],
  "results": {
    "community-catalyst": {
      "collaboration_opportunities": [
        {
          "title": "Cross-domain DeFi × Climate Hackathon",
          "participants_needed": 12,
          "rationale": "High skill overlap between finance and climate cohorts",
          "expected_impact": "3–5 fundable prototypes",
          "formation_mechanism": "Opt-in mission with paired team matching"
        }
      ],
      "community_health_score": 84,
      "engagement_strategy": "Facilitate opt-in peer mentoring before competitive events",
      "feedback_loops": {
        "reinforcing": ["Top contributors gain visibility → attract new talent"],
        "balancing":   ["Diversity mandate prevents expertise hoarding"],
        "risks":       ["Clique formation if team matching is not randomized"]
      },
      "second_order_effects": ["May accelerate local venture ecosystem"],
      "desiderata_alignment": ["Human Flourishing", "Meaningful Engagement", "Community Benefit"]
    }
  },
  "constitutionalCheck": {
    "verdict": "approved",
    "score": 7,
    "redFlags": [],
    "conditions": []
  },
  "constitutionalCheckId": "cc_01J8...",
  "processingMs": 1240
}`,
  },
  {
    id: 'xil-registry',
    title: 'XIL — Agent Registry',
    method: 'GET',
    path: '/api/xil?view=registry',
    desc: 'Returns the live agent registry with metadata, categories, and the six constitutional principles governing all XIL decisions.',
    request: null,
    response: `{
  "totalAgents": 12,
  "categories": ["Tenant", "Personal", "Community", "Marketplace", "Impact", "Governance", "Foundry"],
  "agents": [
    {
      "agent_id": "mission-architect",
      "name": "Mission Architect",
      "category": "Tenant",
      "purpose": "Transforms organizational goals into structured mission blueprints",
      "anti_objectives": ["Generic missions", "Unmeasurable outcomes"],
      "constitutional_score": 7
    }
    // ... 11 more agents
  ],
  "constitutionalPrinciples": [
    "Human agency takes precedence over optimization objectives",
    "Trust is the platform's most valuable asset",
    "Neither financial nor impact materiality may be ignored",
    "Recommendations must be relevant, explainable, fair, and beneficial",
    "Fairness means maximizing opportunity, not reinforcing advantages",
    "Engage for value, not for engagement itself"
  ]
}`,
  },
  {
    id: 'xil-health',
    title: 'XIL — System Health',
    method: 'GET',
    path: '/api/xil?view=health',
    desc: 'Returns real-time constitutional health metrics, agent evaluation scores, and routing performance data for the past 100 XIL requests.',
    request: null,
    response: `{
  "constitutionalHealth": {
    "approvalRate": 94,         // % of recent requests approved
    "totalChecks": 100,
    "recentChecks": [
      { "verdict": "approved", "constitutional_score": 7, "created_at": "2025-06-09T14:30:00Z" },
      { "verdict": "flagged",  "constitutional_score": 5, "created_at": "2025-06-09T13:10:00Z" },
      { "verdict": "rejected", "constitutional_score": 2, "created_at": "2025-06-09T12:00:00Z" }
    ]
  },
  "recentEvaluations": [
    {
      "agent_id": "discovery-agent",
      "composite_score": 0.91,
      "utility_score":   0.88,
      "trust_score":     0.94
    }
  ],
  "routingMetrics": {
    "avgProcessingMs": 1180,
    "recentCalls": [
      { "intelligence_function": "personal",   "processing_ms": 890  },
      { "intelligence_function": "community",  "processing_ms": 1240 }
    ]
  }
}`,
  },

  // ── DIRECT AGENTS ─────────────────────────────────────────────────────────
  {
    id: 'agent-mission-architect',
    title: 'Mission Architect',
    method: 'POST',
    path: '/api/agents/mission-architect',
    desc: 'Transforms a plain-language goal into a structured, executable mission blueprint — steps, success criteria, narrative context, and estimated timing. Requires tenant_admin role.',
    request: `{
  "goal": "Reduce customer churn by 15% in Q3",
  "audience": "Customer Success Managers",
  "industry": "SaaS / B2B",
  "duration": "6 weeks",
  "success_metric": "NPS >= 50 and monthly_churn_rate < 3.5%"
}`,
    response: `{
  "title": "The Retention Architect",
  "story_context": "You are a trusted advisor, not a support rep. Your mission is to uncover the real reasons customers leave — and build systems that stop it before it starts.",
  "difficulty": "medium",
  "estimated_time": "6 weeks",
  "tags": ["retention", "customer-success", "communication"],
  "reward": "Certified: Retention Specialist",
  "steps": [
    {
      "type": "discovery",
      "instruction": "Interview 5 churned customers from the past 90 days. Document their real departure reason — not the stated one.",
      "success_criteria": "5 interview summaries uploaded with root-cause classification"
    },
    {
      "type": "action",
      "instruction": "Build a churn early-warning dashboard tracking 3 leading indicators you discovered.",
      "success_criteria": "Dashboard live in CRM with 30-day backfill; share link for review"
    },
    {
      "type": "reflection",
      "instruction": "Write a 200-word retrospective: what assumption did you start with that the data disproved?",
      "success_criteria": "Reflection submitted; demonstrates evidence-based reasoning"
    }
  ],
  "rationale": "Steps progress from diagnosis → instrumentation → synthesis, ensuring the team builds on evidence rather than assumption."
}`,
  },
  {
    id: 'agent-experience-designer',
    title: 'Experience Designer',
    method: 'POST',
    path: '/api/agents/experience-designer',
    desc: 'Reviews an existing mission and optimizes it for narrative arc, emotional engagement, and step variety. Returns concrete rewrites and an engagement score.',
    request: `{
  "title": "The Retention Architect",
  "story_context": "Reduce churn by improving customer relationships.",
  "steps": [
    { "type": "action",     "instruction": "Call customers.",             "success_criteria": "5 calls done" },
    { "type": "action",     "instruction": "Make a dashboard.",           "success_criteria": "Dashboard live" },
    { "type": "reflection", "instruction": "Write what you learned.",     "success_criteria": "Reflection uploaded" }
  ],
  "audience": "Customer Success Managers"
}`,
    response: `{
  "improved_story": "You are a retention detective — your job is to find the patterns hiding in plain sight before they become lost customers.",
  "engagement_score": 4,
  "improvements": [
    {
      "step_index": 0,
      "original": "Call customers.",
      "improved": "Interview 5 recently churned customers. Dig for the real reason — not the polite one they gave in the exit survey.",
      "reason": "Specificity increases perceived purpose; 'call' is vague, 'interview with a goal' is a mission"
    },
    {
      "step_index": 1,
      "original": "Make a dashboard.",
      "improved": "Build a churn early-warning dashboard that fires when a customer hits 2 of your 3 leading indicators.",
      "reason": "Outcome-framed instructions drive completion 28% better than task-framed ones"
    }
  ],
  "narrative_tips": [
    "Use second-person 'you' framing throughout — it creates personal stakes",
    "Add a discovery step before any action step to build context and buy-in"
  ],
  "motivation_hooks": [
    "Reveal the 'hidden pattern' framing — humans are motivated by insight, not tasks",
    "Name the antagonist (churn) and make the participant the protagonist who defeats it"
  ]
}`,
  },
  {
    id: 'agent-behavioral-analyst',
    title: 'Behavioral Analyst',
    method: 'POST',
    path: '/api/agents/behavioral-analyst',
    desc: 'Analyzes mission performance data to diagnose friction points, identify drop-off causes, and estimate completion lift from implementing recommendations.',
    request: `{
  "mission_title": "The Retention Architect",
  "total_attempts": 312,
  "total_completions": 187,
  "step_drop_offs": [
    { "step_index": 1, "step_label": "Upload interview summaries", "drop_count": 58 },
    { "step_index": 3, "step_label": "Write reflection",           "drop_count": 34 }
  ],
  "avg_time_minutes": 47
}`,
    response: `{
  "friction_score": 7,
  "top_friction_point": "Step 1 — evidence upload adds 25–35min outside the platform, breaking flow",
  "drop_off_analysis": [
    {
      "step_index": 1,
      "reason": "External artifact creation (interview notes) requires leaving the app; cognitive switching cost is high",
      "recommendation": "Provide an in-app interview template with structured fields; reduce to 3 interviews minimum"
    },
    {
      "step_index": 3,
      "reason": "Open-ended reflection after cognitively demanding steps creates decision fatigue",
      "recommendation": "Add 3 sentence-starter prompts; cap reflection at 150 words"
    }
  ],
  "overall_recommendations": [
    "Add progress save at every step — 40% of drops happen at navigation events",
    "Surface estimated time-to-completion at step start",
    "Move reflection to step 2 (lower fatigue) and action to step 3"
  ],
  "predicted_lift_pct": 22
}`,
  },
  {
    id: 'agent-outcome-planner',
    title: 'Outcome Planner',
    method: 'POST',
    path: '/api/agents/outcome-planner',
    desc: 'Reverse-engineers a desired organizational outcome into a sequenced mission roadmap with milestones, risk factors, and a confidence estimate.',
    request: `{
  "desired_outcome": "90% of engineers ship their first PR within 7 days of joining",
  "current_state": "Avg time-to-first-PR is 18 days; no structured onboarding",
  "audience": "New engineering hires (1–3 years experience)",
  "industry": "FinTech",
  "timeline_weeks": 12,
  "constraints": "No dedicated onboarding manager; async-first team"
}`,
    response: `{
  "roadmap_title": "Engineering Fast Start",
  "outcome_definition": "First PR merged within 7 days; 90% cohort success rate over 3 hire classes",
  "success_milestones": [
    { "week": 2,  "milestone": "Dev environment setup + first repo commit",      "measurement": "commit timestamp in audit log" },
    { "week": 4,  "milestone": "First PR reviewed (not necessarily merged)",      "measurement": "PR opened in target repo" },
    { "week": 8,  "milestone": "First PR merged — time recorded",                "measurement": "merge_ts − hire_date < 7 days" },
    { "week": 12, "milestone": "90% cohort hit milestone 3 across 2 hire classes","measurement": "cohort success rate from HR system" }
  ],
  "mission_sequence": [
    { "phase": 1, "mission_type": "onboarding",     "purpose": "Environment + codebase orientation", "estimated_duration": "3 days",  "prerequisite_phase": null },
    { "phase": 2, "mission_type": "skill-building",  "purpose": "First contribution with guided review", "estimated_duration": "4 days", "prerequisite_phase": 1 },
    { "phase": 3, "mission_type": "assessment",      "purpose": "Reflect + calibrate mentor pairing",  "estimated_duration": "1 day",  "prerequisite_phase": 2 }
  ],
  "risk_factors": [
    "Codebase complexity varies by team — standardize entry-point PRs",
    "Async-first means review latency can block milestone 2; set SLA on PR review"
  ],
  "predicted_timeline_weeks": 10,
  "confidence_pct": 82,
  "key_assumptions": ["PR complexity is controlled by onboarding task design", "Mentor availability >= 30 min/day for first 2 weeks"]
}`,
  },
  {
    id: 'agent-insight-analyst',
    title: 'Insight Analyst',
    method: 'POST',
    path: '/api/agents/insight-analyst',
    desc: 'Synthesizes engagement analytics into executive-level intelligence — headline findings, opportunities, risks, recommended actions, and an ROI narrative.',
    request: `{
  "tenant_name": "Acme Corp",
  "period_days": 30,
  "total_missions": 14,
  "active_missions": 9,
  "total_users": 340,
  "total_attempts": 1820,
  "total_completions": 1247,
  "completion_rate_pct": 68.5,
  "top_missions": [
    { "title": "Engineering Fast Start",       "completions": 312, "rate_pct": 91 },
    { "title": "Q3 Retention Drive",           "completions": 187, "rate_pct": 60 },
    { "title": "Leadership Presence — L3+",    "completions": 98,  "rate_pct": 49 }
  ]
}`,
    response: `{
  "headline": "Acme Corp's mission completion outperforms sector median by 22 points — but leadership programme is at risk",
  "summary": "30-day data shows strong operational momentum: 68.5% completion and 340 active participants. The Engineering Fast Start mission is a standout (91% completion). However, the Leadership Presence programme at 49% indicates a design or audience fit issue that warrants immediate attention.",
  "key_findings": [
    "Top-quartile completion rate (68.5%) driven by well-structured onboarding missions",
    "Leadership mission completion 20 points below cohort average — likely a friction or relevance issue",
    "340 participants across 9 missions exceeds Q2 target by 15%"
  ],
  "opportunities": [
    "Replicate Engineering Fast Start's step structure across 3 underperforming missions",
    "Introduce peer accountability pairing in Leadership programme — projected +18% completion"
  ],
  "risks": [
    "Leadership mission attrition will compound: participants who drop rarely re-enroll",
    "5 missions with < 40% completion are dragging the portfolio average"
  ],
  "recommended_actions": [
    "Immediately run Behavioral Analyst on Leadership Presence mission",
    "Archive or redesign the 2 missions with < 30% completion before next cycle"
  ],
  "roi_narrative": "At current trajectory, Acme will deliver 18,000 verified mission completions this year — equivalent to $2.1M in traditional L&D spend at market rates, with measurable outcome evidence instead of attendance records."
}`,
  },
  {
    id: 'agent-knowledge-agent',
    title: 'Knowledge Agent',
    method: 'POST',
    path: '/api/agents/knowledge-agent',
    desc: 'Answers questions about mission strategy and outcome patterns, synthesizes relationships across the knowledge graph, and returns confidence-scored recommendations with identified knowledge gaps.',
    request: `{
  "query": "What mission structures are most effective for behavior-change goals in health domains?",
  "context": "We are designing a 30-day fitness habit formation programme for corporate employees",
  "node_types": ["mission_type", "completion_pattern", "behavior"],
  "max_recommendations": 4
}`,
    response: `{
  "answer": "Behavior-change missions in health domains show the highest completion rates (avg 74%) when they use: (1) micro-habit stacking — small daily actions attached to existing routines; (2) social accountability pairing — completion rate lifts 31% with a named accountability partner; (3) reflection after every 3 action steps rather than at the end.",
  "reasoning": "Pattern derived from 340+ health domain missions. The key differentiator is specificity of the daily habit (time + location + trigger) vs vague intent ('exercise more').",
  "recommendations": [
    {
      "label": "Micro-habit stacking",
      "node_type": "mission_type",
      "relationship": "highest_completion_in_domain",
      "confidence_pct": 91,
      "rationale": "Attaching new habit to existing trigger reduces activation energy; proven in 68% of programs studied"
    },
    {
      "label": "Accountability pairing",
      "node_type": "completion_pattern",
      "relationship": "strong_lift_mechanism",
      "confidence_pct": 87,
      "rationale": "Social commitment increases follow-through; effect strongest in weeks 2–3 where novelty wears off"
    }
  ],
  "related_concepts": ["habit loop", "temptation bundling", "implementation intentions"],
  "knowledge_gaps": ["Long-term (90+ day) retention data is sparse in this domain — recommend tracking post-mission habit persistence"]
}`,
  },

  // ── PARTICIPANT INTELLIGENCE ──────────────────────────────────────────────
  {
    id: 'skills-infer',
    title: 'Skills Inference',
    method: 'GET',
    path: '/api/skills/infer',
    desc: 'Infers a participant\'s skill profile, top categories, and SDG contribution map from their completed mission history. Skills are tagged with evidence missions and proficiency levels. No request body — derives from the authenticated user\'s mission_progress records.',
    request: null,
    response: `{
  "skills": [
    {
      "name": "Software Development",
      "level": "Advanced",
      "confidence": 91,
      "evidence": ["Engineering Fast Start", "Open Source Sprint", "DeFi Build Sprint"]
    },
    {
      "name": "Community Building",
      "level": "Intermediate",
      "confidence": 74,
      "evidence": ["Lagos Hackathon", "Peer Mentoring Initiative"]
    }
  ],
  "topCategories": [
    { "catId": "tech",      "count": 8, "label": "Technology",      "emoji": "💻", "color": "#6D5DFD" },
    { "catId": "community", "count": 4, "label": "Community",       "emoji": "🤝", "color": "#22FFAA" },
    { "catId": "climate",   "count": 2, "label": "Climate",         "emoji": "🌍", "color": "#4ADE80" }
  ],
  "sdgContributions": [
    { "sdg": 4,  "count": 6 },   // Quality Education
    { "sdg": 8,  "count": 5 },   // Decent Work & Economic Growth
    { "sdg": 17, "count": 3 }    // Partnerships for the Goals
  ]
}`,
  },

  // ── MISSIONS ──────────────────────────────────────────────────────────────
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
    { "metric": "time_to_first_commit", "target": "< 7 days", "weight": 0.4 },
    { "metric": "onboarding_nps",       "target": ">= 45",    "weight": 0.3 },
    { "metric": "30_day_retention",     "target": ">= 95%",   "weight": 0.3 }
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
    { "id": "ph_01", "title": "Week 1: Orientation",  "actions": 6, "outcomes": ["first_commit", "team_introductions"] },
    { "id": "ph_02", "title": "Week 2: Contribution", "actions": 8, "outcomes": ["pr_review_participation", "stand_up_cadence"] }
  ],
  "mei_baseline": null,
  "participant_count": 0
}`,
  },

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  {
    id: 'get-mei',
    title: 'Mission Effectiveness Index',
    method: 'GET',
    path: '/v1/analytics/mei/{mission_id}',
    desc: 'Retrieve the Mission Effectiveness Index and constituent metrics. MEI updates in real-time as participants progress. Components: completion_rate, engagement_depth, outcome_attainment, and adaptation_success.',
    request: null,
    response: `{
  "mission_id": "ms_01J8FGHKPXQRS9T2UV3WXY4Z",
  "mei": 87.4,
  "updated_at": "2025-06-09T14:30:00Z",
  "components": {
    "completion_rate":    { "value": 0.91, "weight": 0.25, "score": 22.75 },
    "engagement_depth":   { "value": 0.88, "weight": 0.20, "score": 17.60 },
    "outcome_attainment": { "value": 0.82, "weight": 0.35, "score": 28.70 },
    "adaptation_success": { "value": 0.93, "weight": 0.20, "score": 18.60 }
  },
  "trend": "+4.2 vs last_period",
  "percentile": "top_8_percent",
  "participants": { "total": 47, "active": 39, "completed": 12, "at_risk": 4 }
}`,
  },

  // ── OUTCOMES ──────────────────────────────────────────────────────────────
  {
    id: 'webhooks',
    title: 'Webhook Events',
    method: 'POST',
    path: 'Your endpoint',
    desc: 'X-hunt delivers real-time webhook events to your registered endpoint. All payloads are signed with HMAC-SHA256. Events cover the full lifecycle including XIL constitutional decisions and agent foundry activity.',
    request: `// Register a webhook
POST /v1/webhooks
{
  "url": "https://api.yourapp.com/webhooks/xhunt",
  "events": [
    "mission.outcome.achieved",
    "mission.participant.completed",
    "mission.participant.dropped",
    "mission.mei.updated",
    "xil.constitutional.rejected",
    "xil.constitutional.flagged",
    "agent.foundry.spec_created",
    "escrow.released",
    "escrow.disputed"
  ],
  "secret": "whsec_..."
}`,
    response: `// mission.outcome.achieved
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
}

// xil.constitutional.rejected
{
  "event": "xil.constitutional.rejected",
  "data": {
    "intelligence_function": "personal",
    "objective": "[redacted]",
    "red_flags": ["engagement_maximization", "artificial_urgency"],
    "constitutional_score": 2,
    "check_id": "cc_01J8..."
  }
}`,
  },
  {
    id: 'outcome-validations',
    title: 'Outcome Validations',
    method: 'POST',
    path: '/v1/outcomes/validations',
    desc: 'Submit a real-world outcome for evidence-based validation. Supports self-reported, peer-verified, automated, and manager-verified types. Approved validations contribute to the MEI outcome_score component.',
    request: `// POST /v1/outcomes/validations — Submit validation
{
  "mission_id": "ms_01J8FGHK...",
  "outcome_event_id": "oe_01AB...",
  "validation_type": "manager_verified",
  "evidence": [
    { "type": "document", "label": "Q2 Performance Review",   "url": "https://drive.company.com/review-q2.pdf" },
    { "type": "metric",   "label": "Time-to-first-commit",    "value": "4 days" }
  ]
}

// PATCH /v1/outcomes/validations/{id} — Review
{
  "status": "approved",           // approved | rejected | requires_evidence
  "confidence_score": 92,         // 0–100 — influences MEI weight
  "reviewer_notes": "Confirmed via Q2 review. Excellent result."
}`,
    response: `// POST 201 Created
{
  "validation": {
    "id": "val_01J8...",
    "status": "pending",
    "validation_type": "manager_verified",
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
        { "type": "metric",   "label": "Time-to-first-commit", "value": "4 days" }
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
    desc: 'Create outcome-gated escrow accounts. Funds are held and released only when configured conditions are satisfied. Every action is recorded in an immutable transaction log.',
    request: `// POST /v1/escrow — Create
{
  "mission_id": "ms_01J8FGHK...",
  "amount_cents": 500000,           // $5,000.00 USD
  "currency": "usd",
  "release_condition": "hybrid",    // mei_threshold | outcome_count | manual_approval | deadline_based | hybrid
  "release_config": {
    "mei_threshold": 75,
    "outcome_count": 10
  }
}

// POST /v1/escrow/{id}/release
{
  "release_amount_cents": 250000,   // omit for full release
  "notes": "Milestone 1 — MEI 78, 12 validations"
}

// POST /v1/escrow/{id}/dispute
{ "reason": "Outcome count not independently verified" }`,
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
  "escrow": { "id": "esc_01J8...", "status": "partially_released", "released_amount_cents": 250000 },
  "released_amount_cents": 250000
}`,
    notes: `# Escrow status lifecycle

created → funded → locked → partially_released
                           → fully_released
                           → disputed → (admin) → refunded / released

Release auto-records a revenue_record with category "escrow_release".
Dispute holds the unreleased balance until admin resolves.`,
  },
  {
    id: 'revenue',
    title: 'Revenue & Invoicing',
    method: 'GET',
    path: '/v1/revenue',
    desc: 'Access revenue summaries, records by category, and invoice generation. Revenue is automatically tracked on escrow releases, subscription events, and mission fees.',
    request: `// GET /v1/revenue?category=escrow_release&from=2025-01-01
// GET /v1/revenue/invoices?status=open

// POST /v1/revenue/invoices
{
  "due_days": 30,
  "currency": "usd",
  "line_items": [
    { "description": "Mission Programme — Q2 2025", "quantity": 1,  "unit_price_cents": 250000, "amount_cents": 250000, "category": "mission_fee" },
    { "description": "Outcome Bonus — 12 verified", "quantity": 12, "unit_price_cents": 5000,   "amount_cents": 60000,  "category": "outcome_bonus" }
  ]
}`,
    response: `// GET /v1/revenue
{
  "summary": {
    "total_revenue_cents": 1840000,
    "mrr_cents": 310000,
    "arr_cents": 1540000,
    "by_category": {
      "subscription":   840000,
      "escrow_release": 500000,
      "mission_fee":    310000,
      "outcome_bonus":  190000
    }
  }
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
  { id: 'authentication',           label: 'Authentication',          group: 'Core' },
  { id: 'xil-invoke',               label: 'Invoke Intelligence',      group: 'XIL' },
  { id: 'xil-registry',             label: 'Agent Registry',           group: 'XIL' },
  { id: 'xil-health',               label: 'System Health',            group: 'XIL' },
  { id: 'agent-mission-architect',  label: 'Mission Architect',        group: 'Agents' },
  { id: 'agent-experience-designer',label: 'Experience Designer',      group: 'Agents' },
  { id: 'agent-behavioral-analyst', label: 'Behavioral Analyst',       group: 'Agents' },
  { id: 'agent-outcome-planner',    label: 'Outcome Planner',          group: 'Agents' },
  { id: 'agent-insight-analyst',    label: 'Insight Analyst',          group: 'Agents' },
  { id: 'agent-knowledge-agent',    label: 'Knowledge Agent',          group: 'Agents' },
  { id: 'skills-infer',             label: 'Skills Inference',         group: 'Intelligence' },
  { id: 'create-mission',           label: 'Create Mission',           group: 'Missions' },
  { id: 'get-mei',                  label: 'MEI',                      group: 'Analytics' },
  { id: 'webhooks',                 label: 'Webhooks',                 group: 'Core' },
  { id: 'outcome-validations',      label: 'Outcome Validations',      group: 'Outcomes' },
  { id: 'escrow',                   label: 'Escrow Services',          group: 'Outcomes' },
  { id: 'revenue',                  label: 'Revenue & Invoicing',      group: 'Outcomes' },
];

const GROUP_COLORS: Record<string, string> = {
  Core:         'text-txt-faint',
  XIL:          'text-ai',
  Agents:       'text-[#818cf8]',
  Intelligence: 'text-accent',
  Missions:     'text-txt-faint',
  Analytics:    'text-txt-faint',
  Outcomes:     'text-txt-faint',
};

export default function ApiReferencePage() {
  const [activeEndpoint, setActiveEndpoint] = useState('authentication');
  const active = API_SECTIONS.find((s) => s.id === activeEndpoint) ?? API_SECTIONS[0];
  const activeIdx = NAV_ITEMS.findIndex((n) => n.id === activeEndpoint);

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
            <code className="font-mono text-ai bg-ai/8 px-1.5 py-0.5 rounded">https://api.xhunt.app</code>
            {' '}·{' '}
            <span className="text-txt-faint">17 endpoints · 12 agents · constitutional AI</span>
          </motion.p>
        </div>
      </section>

      {/* Split layout */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex gap-0 min-h-screen">
          {/* Sidebar */}
          <nav className="hidden md:flex flex-col w-56 flex-shrink-0 py-8 pr-6 border-r border-[rgba(255,255,255,0.05)]">
            {Array.from(new Set(NAV_ITEMS.map(n => n.group))).map(group => (
              <div key={group} className="mb-5">
                <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2 px-3', GROUP_COLORS[group] ?? 'text-txt-faint')}>
                  {group}
                </p>
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

              {/* Navigation */}
              <div className="flex justify-between items-center mt-10 pt-8 border-t border-[rgba(255,255,255,0.05)]">
                {activeIdx > 0 ? (
                  <button
                    onClick={() => setActiveEndpoint(NAV_ITEMS[activeIdx - 1].id)}
                    className="flex items-center gap-2 text-[13px] font-semibold text-txt-dim hover:text-txt transition-colors"
                  >
                    ← {NAV_ITEMS[activeIdx - 1].label}
                  </button>
                ) : <div />}
                {activeIdx < NAV_ITEMS.length - 1 && (
                  <button
                    onClick={() => setActiveEndpoint(NAV_ITEMS[activeIdx + 1].id)}
                    className="flex items-center gap-2 text-[13px] font-semibold text-txt-dim hover:text-txt transition-colors"
                  >
                    {NAV_ITEMS[activeIdx + 1].label} →
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
