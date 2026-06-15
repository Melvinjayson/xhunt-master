import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getServerUser } from '@/lib/firebase/auth-server';

export const runtime = 'nodejs';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id: missionId } = await params;
  const supabase = createServiceClient();

  // Verify mission exists and is accepting participants
  const { data: mission } = await supabase
    .from('missions')
    .select('id, tenant_id, status, spots_total, spots_remaining')
    .eq('id', missionId)
    .maybeSingle();

  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
  if (mission.status !== 'active' && mission.status !== 'published') {
    return NextResponse.json({ error: 'Mission is not accepting participants' }, { status: 409 });
  }
  if (mission.spots_remaining !== null && mission.spots_remaining <= 0) {
    return NextResponse.json({ error: 'Mission is full' }, { status: 409 });
  }

  // Idempotent: check if already accepted
  const { data: existing } = await supabase
    .from('mission_progress')
    .select('id, started_at')
    .eq('user_id', user.uid)
    .eq('mission_id', missionId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ progress_id: existing.id, started_at: existing.started_at, already_accepted: true });
  }

  // Create progress record
  const { data: progress, error: progressErr } = await supabase
    .from('mission_progress')
    .insert({
      user_id: user.uid,
      mission_id: missionId,
      tenant_id: mission.tenant_id,
      current_step_index: 0,
      completed_steps: [],
      started_at: new Date().toISOString(),
    })
    .select('id, started_at')
    .single();

  if (progressErr) return NextResponse.json({ error: progressErr.message }, { status: 500 });

  // Upsert mission state → active
  await supabase.from('mission_state').upsert({
    user_id: user.uid,
    mission_id: missionId,
    tenant_id: mission.tenant_id,
    state: 'active',
    previous_state: 'not_started',
    entered_at: new Date().toISOString(),
  }, { onConflict: 'user_id,mission_id' });

  // Emit mission_started event into the event spine
  await supabase.from('mission_events').insert({
    user_id: user.uid,
    mission_id: missionId,
    tenant_id: mission.tenant_id,
    event_type: 'mission_started',
    session_id: crypto.randomUUID(),
    client_ts: new Date().toISOString(),
    metadata: { source: 'accept_route' },
  });

  // Decrement spots_remaining if applicable
  if (mission.spots_remaining !== null) {
    await supabase
      .from('missions')
      .update({ spots_remaining: mission.spots_remaining - 1 })
      .eq('id', missionId);
  }

  // Publish to routing bus → workspace can react
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/events/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'consumer',
      target: 'workspace',
      event_type: 'mission_accepted',
      payload: { mission_id: missionId, user_id: user.uid, progress_id: progress.id },
    }),
  }).catch(() => null);

  return NextResponse.json({ progress_id: progress.id, started_at: progress.started_at });
}
