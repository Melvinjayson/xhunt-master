import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { MOCK_HUNTS } from '@/lib/mockHunts';

export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'No tenant found. Complete onboarding first.' }, { status: 400 });
  }

  // Check how many missions already exist
  const { count } = await supabase
    .from('missions')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Missions already exist for this tenant.', count }, { status: 409 });
  }

  const rows = MOCK_HUNTS.map((h) => ({
    tenant_id: profile.tenant_id,
    created_by: user.id,
    title: h.title,
    story_context: h.story_context,
    difficulty: h.difficulty,
    estimated_time: h.estimated_time,
    steps: h.steps,
    reward: h.reward,
    tags: h.tags,
    status: 'active' as const,
  }));

  const { data: inserted, error } = await supabase
    .from('missions')
    .insert(rows)
    .select('id, title');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ seeded: inserted?.length ?? 0, missions: inserted });
}
