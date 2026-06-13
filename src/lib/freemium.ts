import { createClient } from './supabase/server';

export const TRIAL_DAYS = 14;

export type SubscriptionTier = 'free' | 'trial' | 'pro';

export interface TierInfo {
  tier: SubscriptionTier;
  isTrialActive: boolean;
  trialDaysLeft: number;
  trialEndsAt: string | null;
  canUseAI: boolean;
  canAccessPremiumMissions: boolean;
  aiRequestsPerDay: number;
  hasUsedTrial: boolean;
}

const TIER_CAPS: Record<SubscriptionTier, { aiPerDay: number; premiumMissions: boolean }> = {
  free:  { aiPerDay: 0,   premiumMissions: false },
  trial: { aiPerDay: 50,  premiumMissions: true  },
  pro:   { aiPerDay: 500, premiumMissions: true  },
};

export async function getUserTierInfo(userId: string): Promise<TierInfo> {
  const sb = await createClient();
  const { data } = await sb
    .from('user_profiles')
    .select('subscription_tier, trial_started_at, trial_ends_at, ai_requests_today, ai_requests_reset_at')
    .eq('id', userId)
    .single();

  if (!data) {
    return {
      tier: 'free', isTrialActive: false, trialDaysLeft: 0,
      trialEndsAt: null, canUseAI: false, canAccessPremiumMissions: false,
      aiRequestsPerDay: 0, hasUsedTrial: false,
    };
  }

  let tier = (data.subscription_tier ?? 'free') as SubscriptionTier;
  const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const now = new Date();

  if (tier === 'trial' && trialEndsAt && trialEndsAt < now) {
    tier = 'free';
    await sb.from('user_profiles').update({ subscription_tier: 'free' }).eq('id', userId);
  }

  const isTrialActive = tier === 'trial' && trialEndsAt !== null && trialEndsAt > now;
  const trialDaysLeft = isTrialActive
    ? Math.max(0, Math.ceil((trialEndsAt!.getTime() - now.getTime()) / 86_400_000))
    : 0;

  const caps = TIER_CAPS[tier];
  return {
    tier,
    isTrialActive,
    trialDaysLeft,
    trialEndsAt: data.trial_ends_at ?? null,
    canUseAI: caps.aiPerDay > 0,
    canAccessPremiumMissions: caps.premiumMissions,
    aiRequestsPerDay: caps.aiPerDay,
    hasUsedTrial: !!data.trial_started_at,
  };
}
