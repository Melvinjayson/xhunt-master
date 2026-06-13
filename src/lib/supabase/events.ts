/**
 * XHunt Event Spine — behavioral intelligence pipeline.
 *
 * All functions are safe to call without await and never throw.
 * Events include a per-tab session ID, client timestamp, and optional step
 * duration for funnel and friction analysis.
 *
 * Offline resilience: events that fail to insert are queued in localStorage
 * and flushed automatically when the browser comes back online.
 */

// ── Event type registry ───────────────────────────────────────────────────────

export type EventType =
  | 'mission_viewed'
  | 'mission_started'
  | 'mission_resumed'
  | 'step_started'
  | 'step_completed'
  | 'step_skipped'
  | 'step_adapted'
  | 'reward_viewed'
  | 'reward_claimed'
  | 'mission_completed'
  | 'mission_abandoned'
  | 'mission_shared'
  | 'ask_xeno'
  | 'profile_match_viewed';

export interface EmitOptions {
  missionId?:  string;
  stepId?:     number;
  durationMs?: number;
  metadata?:   Record<string, unknown>;
}

// ── Session ID ────────────────────────────────────────────────────────────────
// One UUID per browser tab, stored in sessionStorage.
// Groups all events from a single session for funnel analysis.

let _sessionId: string | null = null;

export function getSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof window === 'undefined') return 'ssr';
  try {
    const stored = sessionStorage.getItem('xhunt_session_id');
    if (stored) { _sessionId = stored; return stored; }
    const fresh = crypto.randomUUID();
    sessionStorage.setItem('xhunt_session_id', fresh);
    _sessionId = fresh;
    return fresh;
  } catch {
    _sessionId = `s_${Date.now().toString(36)}`;
    return _sessionId;
  }
}

// ── Step duration tracking ────────────────────────────────────────────────────
// Records when a step was presented so we can measure time-on-step.

const _stepTimers = new Map<number, number>();

/** Call when a step card becomes visible to the user. */
export function markStepStart(stepId: number): void {
  if (typeof performance !== 'undefined') {
    _stepTimers.set(stepId, performance.now());
  }
}

/**
 * Returns elapsed milliseconds since markStepStart(stepId) was called,
 * then clears the timer. Returns undefined if the step was never marked.
 */
export function measureDuration(stepId: number): number | undefined {
  const start = _stepTimers.get(stepId);
  if (start == null) return undefined;
  _stepTimers.delete(stepId);
  return Math.round(performance.now() - start);
}

// ── Offline queue ─────────────────────────────────────────────────────────────
// Events that cannot be sent (offline or Supabase error) are persisted to
// localStorage and retried when the browser reconnects.

interface QueuedEvent {
  user_id:     string;
  tenant_id:   string | null;
  mission_id:  string | null;
  step_id:     number | null;
  event_type:  string;
  session_id:  string;
  duration_ms: number | null;
  client_ts:   string;
  metadata:    Record<string, unknown>;
}

const QUEUE_KEY = 'xhunt_event_queue';
const MAX_QUEUE = 150;

function readQueue(): QueuedEvent[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]'); }
  catch { return []; }
}

function writeQueue(q: QueuedEvent[]): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))); }
  catch {}
}

function enqueue(row: QueuedEvent): void {
  const q = readQueue();
  writeQueue([...q, row]);
}

async function flushQueue(ctx: { userId: string; tenantId: string | null }): Promise<void> {
  const q = readQueue();
  if (q.length === 0) return;
  try {
    const { createClient } = await import('./client');
    const sb = createClient();
    const rows = q.map((e) => ({ ...e, user_id: ctx.userId, tenant_id: ctx.tenantId }));
    const { error } = await sb.from('mission_events').insert(rows);
    if (!error) writeQueue([]);
  } catch {}
}

// ── Auth context ──────────────────────────────────────────────────────────────

let _cachedContext: { userId: string; tenantId: string | null } | null = null;

async function getContext(): Promise<{ userId: string; tenantId: string | null } | null> {
  if (_cachedContext) return _cachedContext;
  try {
    const { createClient } = await import('./client');
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;
    const { data: profile } = await sb
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();
    _cachedContext = { userId: user.id, tenantId: profile?.tenant_id ?? null };
    return _cachedContext;
  } catch {
    return null;
  }
}

// ── Environment guards ────────────────────────────────────────────────────────

function isConfigured(): boolean {
  return Boolean(
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Reset context cache and flush queue on tab focus / reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('focus',  () => { _cachedContext = null; });
  window.addEventListener('online', () => {
    void getContext().then((ctx) => { if (ctx) void flushQueue(ctx); });
  });
}

// ── Core emit ─────────────────────────────────────────────────────────────────

export function emitEvent(type: EventType, opts: EmitOptions = {}): void {
  if (!isConfigured()) return;
  if (opts.missionId && !isUUID(opts.missionId)) return; // mock hunts use non-UUID IDs

  void (async () => {
    try {
      const ctx = await getContext();
      if (!ctx) return;

      const row: QueuedEvent = {
        user_id:     ctx.userId,
        tenant_id:   ctx.tenantId,
        mission_id:  opts.missionId  ?? null,
        step_id:     opts.stepId     ?? null,
        event_type:  type,
        session_id:  getSessionId(),
        duration_ms: opts.durationMs ?? null,
        client_ts:   new Date().toISOString(),
        metadata:    opts.metadata   ?? {},
      };

      // Flush backlogged offline events before sending the new one
      if (navigator.onLine) await flushQueue(ctx);

      if (!navigator.onLine) { enqueue(row); return; }

      const { createClient } = await import('./client');
      const sb = createClient();
      const { error } = await sb.from('mission_events').insert(row);
      if (error) enqueue(row);
    } catch {
      if (_cachedContext) {
        enqueue({
          user_id:     _cachedContext.userId,
          tenant_id:   _cachedContext.tenantId,
          mission_id:  opts.missionId  ?? null,
          step_id:     opts.stepId     ?? null,
          event_type:  type,
          session_id:  getSessionId(),
          duration_ms: opts.durationMs ?? null,
          client_ts:   new Date().toISOString(),
          metadata:    opts.metadata   ?? {},
        });
      }
    }
  })();
}

// ── Typed convenience emit ────────────────────────────────────────────────────
// Separates step_id and duration_ms from the rest of the metadata payload
// so callers don't have to manually decompose them into EmitOptions.

export function emitTypedEvent(
  type: EventType,
  missionId: string | null | undefined,
  payload: Record<string, unknown> = {},
): void {
  const { step_id, duration_ms, ...rest } = payload;
  emitEvent(type, {
    missionId:   missionId  ?? undefined,
    stepId:      typeof step_id     === 'number' ? step_id     : undefined,
    durationMs:  typeof duration_ms === 'number' ? duration_ms : undefined,
    metadata:    rest,
  });
}

// ── Mission progress sync ─────────────────────────────────────────────────────

export function syncProgress(
  missionId: string,
  progress: {
    currentStepIndex: number;
    completedSteps:   number[];
    startedAt:        string;
    completedAt?:     string;
  },
): void {
  if (!isConfigured() || !isUUID(missionId)) return;

  void (async () => {
    try {
      const ctx = await getContext();
      if (!ctx) return;
      const { createClient } = await import('./client');
      const sb = createClient();
      await sb.from('mission_progress').upsert(
        {
          user_id:            ctx.userId,
          mission_id:         missionId,
          tenant_id:          ctx.tenantId,
          current_step_index: progress.currentStepIndex,
          completed_steps:    progress.completedSteps,
          started_at:         progress.startedAt,
          completed_at:       progress.completedAt ?? null,
        },
        { onConflict: 'user_id,mission_id' },
      );
    } catch {}
  })();
}

// ── Mission state machine sync ────────────────────────────────────────────────

export function syncMissionState(
  missionId: string,
  state:      string,
  prevState?: string,
): void {
  if (!isConfigured() || !isUUID(missionId)) return;

  void (async () => {
    try {
      const ctx = await getContext();
      if (!ctx) return;
      const { createClient } = await import('./client');
      const sb = createClient();
      await sb.from('mission_state').upsert(
        {
          user_id:        ctx.userId,
          mission_id:     missionId,
          tenant_id:      ctx.tenantId,
          state,
          previous_state: prevState ?? null,
          entered_at:     new Date().toISOString(),
        },
        { onConflict: 'user_id,mission_id' },
      );
    } catch {}
  })();
}

// ── Reward events ─────────────────────────────────────────────────────────────

export function emitRewardClaimed(missionId: string, reward: string): void {
  if (!isConfigured() || !isUUID(missionId)) return;

  void (async () => {
    try {
      const ctx = await getContext();
      if (!ctx) return;
      const { createClient } = await import('./client');
      const sb = createClient();
      await sb.from('reward_events').insert({
        user_id:      ctx.userId,
        mission_id:   missionId,
        tenant_id:    ctx.tenantId,
        reward_type:  'mission_completion',
        reward_value: { reward },
        redeemed:     false,
        issued_at:    new Date().toISOString(),
      });
    } catch {}
  })();
}

// ── Public mission fetch ──────────────────────────────────────────────────────

/**
 * Fetch all public, live missions across every tenant.
 * RLS allows reading missions where is_public = true (migration 001, policy
 * "tenant_read_missions"). Migration 005 adds a matching policy for tenants
 * so the LEFT JOIN on tenants returns name/logo for sponsor display, and a
 * policy on mission_approvals for the "Verified" badge.
 */
export async function fetchSupabaseMissions(): Promise<import('../types').Hunt[] | null> {
  if (!isConfigured()) return null;
  try {
    const { createClient } = await import('./client');
    const sb = createClient();

    const { data } = await sb
      .from('missions')
      .select(`
        *,
        tenant:tenants!tenant_id ( name, slug, logo_url ),
        approvals:mission_approvals!mission_id ( status )
      `)
      .in('status', ['active', 'published'])
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) return null;

    return data.map((m) => {
      const tenant = m.tenant as { name?: string; slug?: string; logo_url?: string | null } | null;
      const approvals = (m.approvals as Array<{ status: string }>) ?? [];
      const isVerified = approvals.some((a) => a.status === 'approved');

      return {
        id:             m.id,
        title:          m.title,
        story_context:  m.story_context ?? '',
        difficulty:     m.difficulty,
        estimated_time: m.estimated_time ?? '',
        steps:          (m.steps as import('../types').Step[]) ?? [],
        reward:         m.reward,
        tags:           m.tags ?? [],
        createdAt:      m.created_at,
        tenantName:     tenant?.name,
        tenantLogo:     tenant?.logo_url ?? null,
        tenantSlug:     tenant?.slug,
        isVerified,
        // Proximity fields
        locationType:    m.location_type ?? undefined,
        locationCity:    m.location_city ?? undefined,
        locationCountry: m.location_country ?? undefined,
        lat:             m.lat ?? null,
        lng:             m.lng ?? null,
        radiusKm:        m.radius_km ?? 50,
      };
    });
  } catch {
    return null;
  }
}
