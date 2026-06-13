import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = await createClient();

  const { data, error } = await sb
    .from('live_sessions')
    .select(`
      *,
      host:user_profiles!host_id(id, display_name, avatar_url),
      mission:missions(id, title, story_context, steps)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
