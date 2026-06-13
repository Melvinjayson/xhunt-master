import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses RLS.
 * Use ONLY in server-side webhook handlers and trusted background jobs.
 * Never expose to the client.
 */
export function createAdminClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !service) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
