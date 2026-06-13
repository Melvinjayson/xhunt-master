import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type ApiAuthResult =
  | { ok: true; userId: string; user: import('@supabase/supabase-js').User }
  | { ok: false; response: NextResponse };

export async function requireAuth(): Promise<ApiAuthResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
      };
    }

    return { ok: true, userId: user.id, user };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication failed' }, { status: 401 }),
    };
  }
}
