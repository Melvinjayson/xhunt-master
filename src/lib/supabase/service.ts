import { createClient } from '@supabase/supabase-js';
import { env, publicEnv } from '@/lib/env';

export function createServiceClient() {
  if (!publicEnv.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service credentials');
  }
  return createClient(publicEnv.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
