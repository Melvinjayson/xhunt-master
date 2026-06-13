import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = await createClient();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch session to verify host and check bounds
  const { data: session } = await sb
    .from('live_sessions')
    .select('host_id, current_step_index, total_steps, status')
    .eq('id', id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  if (session.host_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (session.status !== 'live') return NextResponse.json({ error: 'Session is not live' }, { status: 409 });

  const nextIndex = session.current_step_index + 1;
  if (nextIndex >= session.total_steps) {
    return NextResponse.json({ error: 'Already at last step' }, { status: 409 });
  }

  const { error } = await sb
    .from('live_sessions')
    .update({ current_step_index: nextIndex })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  return NextResponse.json({ current_step_index: nextIndex });
}
