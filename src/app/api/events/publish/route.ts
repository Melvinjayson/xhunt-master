import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

interface PublishBody {
  source: string;
  target: string;
  event_type: string;
  payload: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as PublishBody;
  const { source, target, event_type, payload } = body;

  if (!source || !target || !event_type) {
    return NextResponse.json({ error: 'source, target, and event_type are required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const timestamp = new Date().toISOString();

  // Broadcast to Supabase Realtime channel for live subscribers
  await supabase.channel('platform-bus').send({
    type: 'broadcast',
    event: event_type,
    payload: { source, target, event_type, payload, timestamp },
  });

  // Persist to platform_events table (best-effort — table may not exist in all envs)
  const { data, error: insertError } = await supabase
    .from('platform_events')
    .insert({ source, target, event_type, payload, timestamp })
    .select('id')
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    event_type,
    target,
    timestamp,
    event_id: data?.id ?? null,
    persisted: !insertError,
  });
}
