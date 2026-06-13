import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TENANT_ROLES = new Set(['platform_admin', 'tenant_admin', 'mission_creator']);

export type AgentAuthResult =
  | { ok: true;  userId: string; tenantId: string }
  | { ok: false; response: NextResponse };

export async function requireTenantAgent(): Promise<AgentAuthResult> {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      return { ok: false, response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
    }

    const { data: profile } = await sb
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return { ok: false, response: NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 }) };
    }

    if (!TENANT_ROLES.has(profile.role as string)) {
      return { ok: false, response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) };
    }

    return { ok: true, userId: user.id, tenantId: profile.tenant_id as string };
  } catch {
    return { ok: false, response: NextResponse.json({ error: 'Authentication failed' }, { status: 401 }) };
  }
}
