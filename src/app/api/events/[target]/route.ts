import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ target: string }> }
) {
  const { target } = await params;
  const url = new URL(req.url);
  const since = url.searchParams.get('since') ?? new Date(Date.now() - 60_000).toISOString();
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200);

  const supabase = createServiceClient();

  // Query from platform_events table
  const { data, error } = await supabase
    .from('platform_events')
    .select('id, source, target, event_type, payload, timestamp')
    .eq('target', target)
    .gte('timestamp', since)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    // Table may not exist in all environments — return empty
    return NextResponse.json({ events: [], cursor: since, target });
  }

  const events = data ?? [];
  const cursor = events[0]?.timestamp ?? since;

  return NextResponse.json({ events, cursor, target });
}
