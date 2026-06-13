import { createClient } from '@/lib/supabase/server';
import { getUserTierInfo } from '@/lib/freemium';

export async function GET() {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      return Response.json({
        tier: 'free', isTrialActive: false, trialDaysLeft: 0,
        trialEndsAt: null, canUseAI: false, canAccessPremiumMissions: false,
        aiRequestsPerDay: 0, hasUsedTrial: false,
      });
    }

    const info = await getUserTierInfo(user.id);
    return Response.json(info);
  } catch {
    return Response.json({
      tier: 'free', isTrialActive: false, trialDaysLeft: 0,
      trialEndsAt: null, canUseAI: false, canAccessPremiumMissions: false,
      aiRequestsPerDay: 0, hasUsedTrial: false,
    });
  }
}
