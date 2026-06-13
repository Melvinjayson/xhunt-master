import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { following_id } = await req.json() as { following_id?: string };
  if (!following_id) return NextResponse.json({ error: 'following_id required' }, { status: 400 });
  if (following_id === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

  const { error } = await sb
    .from('user_follows')
    .insert({ follower_id: user.id, following_id });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ already: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ following: true });
}

export async function DELETE(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { following_id } = await req.json() as { following_id?: string };
  if (!following_id) return NextResponse.json({ error: 'following_id required' }, { status: 400 });

  await sb
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', following_id);

  return NextResponse.json({ following: false });
}
