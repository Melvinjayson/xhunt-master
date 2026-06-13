import { createClient } from './supabase/server';
import type { SubscriptionTier } from './freemium';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  reason?: 'upgrade_required' | 'daily_limit_reached' | 'user_not_found';
}

const DAILY_LIMITS: Record<SubscriptionTier, number> = {
  free:  0,
  trial: 50,
  pro:   500,
};

export async function checkAndIncrementRateLimit(
  userId: string,
  tier: SubscriptionTier,
): Promise<RateLimitResult> {
  const limit = DAILY_LIMITS[tier];
  if (limit === 0) {
    return { allowed: false, remaining: 0, resetAt: new Date().toISOString(), reason: 'upgrade_required' };
  }

  const sb = await createClient();
  const { data } = await sb
    .from('user_profiles')
    .select('ai_requests_today, ai_requests_reset_at')
    .eq('id', userId)
    .single();

  if (!data) {
    return { allowed: false, remaining: 0, resetAt: new Date().toISOString(), reason: 'user_not_found' };
  }

  const now = new Date();
  const resetAt = new Date(data.ai_requests_reset_at ?? now.toISOString());
  const isNewPeriod = now >= resetAt;
  const count = isNewPeriod ? 0 : (data.ai_requests_today ?? 0);

  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const nextReset = isNewPeriod ? tomorrow.toISOString() : resetAt.toISOString();

  if (count >= limit) {
    return { allowed: false, remaining: 0, resetAt: nextReset, reason: 'daily_limit_reached' };
  }

  await sb.from('user_profiles').update({
    ai_requests_today: count + 1,
    ai_requests_reset_at: nextReset,
  }).eq('id', userId);

  return { allowed: true, remaining: limit - count - 1, resetAt: nextReset };
}
