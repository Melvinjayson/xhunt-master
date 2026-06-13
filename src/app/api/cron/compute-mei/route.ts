import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Protected cron endpoint that refreshes MEI scores for all active missions.
 *
 * Call via Vercel Cron (vercel.json) or any external scheduler.
 * Requires the CRON_SECRET env var to match the Authorization header.
 *
 * vercel.json example:
 *   { "crons": [{ "path": "/api/cron/compute-mei", "schedule": "0 * * * *" }] }
 */

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Auth check — Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  // Fetch all active / published mission IDs
  const { data: missions, error: missionsErr } = await supabase
    .from('missions')
    .select('id, tenant_id')
    .in('status', ['active', 'published']);

  if (missionsErr) {
    return NextResponse.json({ error: missionsErr.message }, { status: 500 });
  }

  const ids = (missions ?? []).map((m: { id: string }) => m.id);
  if (ids.length === 0) {
    return NextResponse.json({ computed: 0, message: 'No active missions' });
  }

  // Call the SQL function for each mission — use Promise.allSettled so one
  // failure doesn't abort the whole batch
  const results = await Promise.allSettled(
    ids.map((id: string) =>
      supabase.rpc('compute_and_store_mei', { p_mission_id: id }),
    ),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed    = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({
    computed:  succeeded,
    failed,
    total:     ids.length,
    timestamp: new Date().toISOString(),
  });
}

// Allow GET for manual browser triggers during development
export async function GET(req: NextRequest) {
  return POST(req);
}
