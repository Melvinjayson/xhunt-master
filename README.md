# X-hunt — AI Mission Operating System

Turn goals into verified outcomes at scale. X-hunt is a full-stack AI-native platform that orchestrates mission programmes, validates real-world outcomes, manages outcome-based escrow payments, and generates revenue intelligence — for enterprises, brands, educators, and government.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (`@theme` block in `globals.css`) |
| **Auth** | **Clerk** (`@clerk/nextjs` — single auth provider) |
| Database | Supabase (PostgreSQL + Realtime + RLS) |
| Payments | Stripe (subscriptions, checkout, webhooks) |
| AI — Consumer | Groq SDK (`llama-3.1-8b` trial · `llama-3.3-70b` pro) |
| AI — Agents | Anthropic SDK (Claude) — 12 agents at enterprise tier |
| Design system | MUI + `src/theme/` (colors, typography, spacing, shadows) |
| Animations | Framer Motion 12 |
| Icons | Lucide React |

---

## Architectural Decisions (locked 2026-06-12)

### 1. Single B2B Surface
`/admin` is for **platform-level operations only**: tenant management and `platform_admin` user controls (4 nav items). All product features — analytics, agents, economy, governance — live in `/workspace` with role-gated visibility and progressive disclosure by maturity tier.

### 2. Design Token Authority
MUI theme (`src/theme/`) is the single source of truth.
- **Colors:** `t.*` from `@/theme/colors` — `t.accent=#22FFAA`, `t.ai=#6D5DFD`, `t.bg=#050816`, etc.
- **Spacing:** `sp.*` from `@/theme/spacing` — 8px base unit
- **Shadows/glows:** `shadows.*`, `glows.*` from `@/theme/shadows`
- Tailwind for layout utilities only. ESLint warns on raw hex literals in `src/app/` and `src/components/`.

### 3. Canonical Auth Flow
Clerk is the single auth provider. Supabase is used for data only.
```
/sign-up → Clerk webhook → provisions user_profiles (with clerk_user_id) → /get-started → /home or /workspace
```
- Auth redirects go to `/sign-in` or `/sign-up` — never `/auth/*`
- Layouts look up profile via `clerk_user_id` column (migration 027), not `supabase.auth.getUser()`
- Middleware at `src/proxy.ts` (not `middleware.ts`) guards all protected routes

---

## Repository Structure

```
xhunt/
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Public marketing — unauthenticated
│   │   │   ├── page.tsx          # Homepage /
│   │   │   ├── consumer/         # /consumer
│   │   │   ├── enterprise/       # /enterprise
│   │   │   ├── use-cases/        # /use-cases
│   │   │   ├── marketplace/      # /marketplace
│   │   │   ├── mission-control/  # /mission-control
│   │   │   ├── pricing/          # /pricing
│   │   │   ├── developers/       # /developers + /developers/api
│   │   │   └── blog/, about/, contact/, careers/
│   │   ├── admin/                # Platform admin — 4 pages only
│   │   │   ├── layout.tsx        # Clerk useUser() → clerk_user_id lookup → role check
│   │   │   ├── page.tsx          # /admin — overview
│   │   │   ├── users/            # /admin/users
│   │   │   ├── missions/         # /admin/missions (tenant management)
│   │   │   └── settings/         # /admin/settings
│   │   ├── workspace/            # B2B workspace — progressive disclosure by tier
│   │   │   ├── layout.tsx        # Clerk useUser() → clerk_user_id → role check
│   │   │   ├── loading.tsx       # Skeleton for route transitions
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── missions/         # Mission Studio + [id] canvas
│   │   │   ├── mission-control/  # Mission Control
│   │   │   ├── outcomes/         # Outcomes (growth+)
│   │   │   ├── analytics/        # Analytics (growth+)
│   │   │   ├── agents/           # AI Agents (growth+)
│   │   │   ├── intelligence/     # XIL Hub (enterprise)
│   │   │   ├── economy/          # Economy Protocol (enterprise)
│   │   │   ├── marketplace/      # Marketplace (growth+)
│   │   │   ├── governance/       # Governance (enterprise)
│   │   │   ├── integrations/     # Integrations (all tiers)
│   │   │   ├── billing/          # Billing (all tiers)
│   │   │   └── settings/         # Settings: profile, features, branding, API
│   │   ├── api/
│   │   │   ├── workspace/features/  # GET config · PATCH toggle (admin-role gated)
│   │   │   ├── agents/           # 6 specialised agent endpoints
│   │   │   ├── ai-assist/        # Groq chat (rate-limited, tiered)
│   │   │   ├── economy/          # contributions, trust, match, governance
│   │   │   ├── xil/              # XIL registry, health, orchestration
│   │   │   ├── outcomes/validations/  # CRUD + review workflow
│   │   │   ├── escrow/           # Create, release, dispute
│   │   │   ├── revenue/          # Summary, records, invoices
│   │   │   ├── mei/compute/      # Recompute MEI
│   │   │   ├── stripe/           # checkout, webhook, portal
│   │   │   └── clerk/            # Clerk webhook provisioning
│   │   ├── home/                 # /home — consumer dashboard (loading.tsx)
│   │   ├── missions/             # /missions — browser (freemium-gated)
│   │   ├── hunt/[id]/            # /hunt/:id — mission execution
│   │   ├── active/[id]/          # /active/:id — step-by-step mission runner
│   │   ├── complete/[id]/        # /complete/:id — completion + share
│   │   ├── timeline/             # TikTok-style experience feed
│   │   ├── live/[id]/            # Real-time live session (Supabase Realtime)
│   │   ├── explore/              # Mission discovery (+ People)
│   │   ├── profile/              # User profile (+ Rewards)
│   │   ├── messages/             # DMs
│   │   ├── upgrade/              # Plan selection
│   │   ├── get-started/          # Consumer onboarding
│   │   ├── onboard/              # Workspace/tenant setup
│   │   ├── sign-in/              # Clerk native sign-in
│   │   └── sign-up/              # Clerk native sign-up
│   ├── components/
│   │   ├── marketing/            # Nav.tsx (with ThemeToggle), Footer.tsx
│   │   ├── admin/                # AdminSidebar.tsx (4 items)
│   │   ├── workspace/            # WorkspaceSidebar.tsx (12 items max, tiered)
│   │   ├── ThemeToggle.tsx       # Light/dark toggle (localStorage + data-theme)
│   │   ├── BottomNav.tsx         # Consumer bottom nav (5 items mobile, desktop sidebar)
│   │   └── AIAssistant.tsx       # Floating AI chat (Groq)
│   ├── lib/
│   │   ├── supabase/             # client.ts, server.ts, admin.ts, types.ts, events.ts
│   │   ├── env.ts                # Zod-validated env vars (assertProductionEnv())
│   │   ├── features.ts           # TenantFeatureConfig, MATURITY_DEFAULTS, NavFlags
│   │   ├── freemium.ts           # getUserTierInfo()
│   │   ├── rate-limit.ts         # checkAndIncrementRateLimit()
│   │   ├── stripe.ts             # Stripe client + STRIPE_PRICES
│   │   ├── ai-router.ts          # Anthropic SDK wrapper
│   │   ├── groq.ts               # Groq client + modelForTier()
│   │   └── cn.ts                 # clsx + tailwind-merge
│   └── theme/
│       ├── colors.ts             # t.* token map
│       ├── typography.ts         # MUI typography
│       ├── spacing.ts            # sp.* — 8px base unit
│       ├── shadows.ts            # shadows.* + glows.*
│       ├── components.ts         # MUI component overrides
│       └── index.ts              # Re-exports + xhuntDarkTheme / xhuntLightTheme
├── supabase/migrations/
│   ├── 001_initial.sql           # user_profiles, tenants, missions, RLS
│   ├── 002–005                   # Knowledge graph, production hardening, public read
│   ├── 006_freemium.sql          # subscription_tier, trial, rate limits
│   ├── 007_stripe.sql            # Stripe fields on user_profiles
│   ├── 008_timeline.sql          # experience_posts, live_sessions
│   ├── 009_reminder.sql          # pg_cron trial reminders
│   ├── 010_outcomes_validation.sql
│   ├── 011_revenue_escrow.sql
│   ├── 012–019                   # Event spine, MEI, marketplace, RLS, social graph
│   ├── 020_clerk_auth.sql        # clerk_user_id on profiles (initial, wrong table)
│   ├── 021_proximity.sql
│   ├── 022_contribution_ledger.sql
│   ├── 023_trust_graph.sql
│   ├── 024_portable_identity.sql
│   ├── 025_opportunity_matching.sql
│   ├── 026_xil_agent_foundry.sql
│   └── 027_clerk_bridge.sql      # clerk_user_id + default_surface on user_profiles (fix)
└── public/
    └── manifest.json
```

---

## Route Access Matrix

| Route group | Auth required | Roles |
|---|---|---|
| `(marketing)/*` | No | Public |
| `/sign-in`, `/sign-up`, `/get-started` | No | Public |
| `/home`, `/missions`, `/timeline`, `/live/*`, `/hunt/*`, `/active/*`, `/complete/*`, `/explore`, `/profile`, `/upgrade`, `/messages` | Yes | Any authenticated user |
| `/workspace/*` | Yes | platform_admin · tenant_admin · mission_creator · analyst |
| `/admin/*` | Yes | platform_admin · tenant_admin · mission_creator · analyst |
| `/api/workspace/features` PATCH | Yes | platform_admin · tenant_admin |
| `/api/outcomes/validations` PATCH | Yes | platform_admin · tenant_admin · analyst |
| `/api/escrow` POST + release | Yes | platform_admin · tenant_admin |
| `/api/revenue` POST | Yes | platform_admin · tenant_admin |
| `/api/stripe/webhook` | No (Stripe signature) | Stripe only |
| `/api/clerk/*` | No (svix signature) | Clerk only |

---

## Workspace Progressive Disclosure

The workspace sidebar adapts by maturity tier. Feature flags live in `tenants.settings.featureConfig` JSONB and are served by `GET /api/workspace/features`.

| Tier | Visible nav items | Example unlocked features |
|---|---|---|
| Starter | 5 | Dashboard, Mission Studio, Mission Control, Integrations, Billing |
| Growth | 8 | + Analytics, AI Agents, Marketplace |
| Enterprise | 12 | + XIL Hub, Economy Protocol, Governance, Outcomes |

Locked items are shown greyed-out with an upgrade tooltip. Admins toggle features in **Workspace → Settings → Features**.

---

## AI Agents (12 at Enterprise)

| Tier | Agent count |
|---|---|
| Starter | 2 |
| Growth | 6 |
| Enterprise | 12 |

Six API-level agents (all tiers, rate-limited):

| Agent | Route |
|---|---|
| Mission Architect | `/api/agents/mission-architect` |
| Outcome Planner | `/api/agents/outcome-planner` |
| Experience Designer | `/api/agents/experience-designer` |
| Behavioral Analyst | `/api/agents/behavioral-analyst` |
| Knowledge Agent | `/api/agents/knowledge-agent` |
| Insight Analyst | `/api/agents/insight-analyst` |

---

## Economy Protocol (Enterprise)

| Endpoint | Description |
|---|---|
| `GET/POST /api/economy/contributions` | Log + query participant contributions |
| `GET /api/economy/trust` | Trust graph scores |
| `POST /api/economy/match` | Opportunity matching |
| `GET /api/economy/governance` | Governance proposals |

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-only; never expose client-side

# Clerk (single auth provider)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=            # svix signature for /api/clerk webhook

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# AI
GROQ_API_KEY=                    # gsk_... — consumer AI (freemium)
ANTHROPIC_API_KEY=               # sk-ant-... — admin AI agents (optional, falls back to Groq)

# Email (trial reminders via edge function)
RESEND_API_KEY=
FROM_EMAIL=
APP_URL=
```

All server-side vars are validated at startup by `assertProductionEnv()` in `src/lib/env.ts` (Zod schema — throws in production if missing).

---

## Freemium Tiers (Consumer)

| Tier | AI requests/day | Model |
|---|---|---|
| `free` | 0 | — |
| `trial` | 50 | llama-3.1-8b |
| `pro` | 500 | llama-3.3-70b |

---

## Development

```bash
npm install
npm run dev          # Turbopack dev server → http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint (warns on raw hex literals in src/app/ & src/components/)
npx tsc --noEmit     # Type check
```

> **Next.js 16 notes:**
> - `params` in dynamic routes is a `Promise` — use `useParams()` in client components or `await params` in server components.
> - Middleware is at `src/proxy.ts` (not `middleware.ts`).
> - See `AGENTS.md` for full architectural constraints.

---

## Database Migrations

```bash
supabase db push
```

Run migrations in order (001 → 027). Migration 027 is required to bridge Clerk auth — it adds `clerk_user_id` and `default_surface` to `user_profiles`.

---

## PWA

`public/manifest.json` is present. Add to `/public/` for full PWA support:
- `icon-192.png`
- `icon-512.png`
- `og-image.png` (1200×630)

---

## Supabase Edge Functions

```bash
supabase functions deploy trial-reminder
# Requires: RESEND_API_KEY, FROM_EMAIL, APP_URL in Supabase secrets
# Triggered daily by pg_cron (see migration 009)
```
