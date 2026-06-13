import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PostType } from '@/lib/supabase/types';

interface CreatePostBody {
  post_type:  PostType;
  caption?:   string;
  mission_id?: string;
  metadata?:  Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: CreatePostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { post_type, caption, mission_id, metadata = {} } = body;
  if (!post_type || !['completion', 'moment', 'highlight'].includes(post_type)) {
    return NextResponse.json({ error: 'Invalid post_type' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('experience_posts')
    .insert({
      user_id:    user.id,
      post_type,
      caption:    caption?.trim() || null,
      mission_id: mission_id || null,
      metadata,
      is_public:  true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[api/timeline/post]', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
