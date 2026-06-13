import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDefaultConfig, mergeFeatureConfig } from '@/lib/features';
import type { TenantFeatureConfig } from '@/lib/features';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan, settings')
      .eq('id', profile.tenant_id)
      .single();

    const base = getDefaultConfig(tenant?.plan ?? 'starter');
    const overrides = ((tenant?.settings as Record<string, unknown>)?.featureConfig ?? {}) as Partial<TenantFeatureConfig>;
    const config = mergeFeatureConfig(base, overrides);

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 });

    const adminRoles = ['platform_admin', 'tenant_admin'];
    if (!adminRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json() as Partial<TenantFeatureConfig>;

    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', profile.tenant_id)
      .single();

    const currentSettings = ((tenant?.settings as Record<string, unknown>) ?? {});
    const currentOverrides = (currentSettings.featureConfig ?? {}) as Partial<TenantFeatureConfig>;

    const merged = mergeFeatureConfig(
      currentOverrides as TenantFeatureConfig,
      body
    );

    await supabase
      .from('tenants')
      .update({ settings: { ...currentSettings, featureConfig: merged } })
      .eq('id', profile.tenant_id);

    return NextResponse.json({ ok: true, config: merged });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
