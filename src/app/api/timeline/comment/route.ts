import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const sb  = await createClient();
  const url = new URL(req.url);
  const postId = url.searchParams.get('post_id');
  if (!postId) return NextResponse.json({ comments: [] });

  const { data, error } = await sb
    .from('post_comments')
    .select(`
      id, content, created_at,
      user:user_profiles!user_id(id, display_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ comments: [] });

  const comments = (data ?? []).map((c: Record<string, unknown>) => ({
    id:           c.id,
    content:      c.content,
    created_at:   c.created_at,
    user_id:      (c.user as Record<string,unknown>)?.id,
    display_name: (c.user as Record<string,unknown>)?.display_name ?? 'User',
    avatar_url:   (c.user as Record<string,unknown>)?.avatar_url ?? null,
  }));

  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, content } = await req.json() as { post_id?: string; content?: string };
  if (!post_id || !content?.trim()) {
    return NextResponse.json({ error: 'post_id and content required' }, { status: 400 });
  }
  if (content.trim().length > 500) {
    return NextResponse.json({ error: 'Comment too long (max 500 chars)' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('post_comments')
    .insert({ post_id, user_id: user.id, content: content.trim() })
    .select('id, content, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ comment: data });
}

export async function DELETE(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { comment_id } = await req.json() as { comment_id?: string };
  if (!comment_id) return NextResponse.json({ error: 'comment_id required' }, { status: 400 });

  await sb.from('post_comments').delete()
    .eq('id', comment_id)
    .eq('user_id', user.id);

  return NextResponse.json({ deleted: true });
}
