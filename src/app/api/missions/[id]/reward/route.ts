import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getServerUser } from '@/lib/firebase/auth-server';
import { orchestrate } from '@/lib/xil/orchestrator';

export const runtime = 'nodejs';

interface RewardBody {
  validation_id: string;
  confidence_score: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id: missionId } = await params;
  const body = await req.json() as RewardBody;

  if (!body.validation_id) {
    return NextResponse.json({ error: 'validation_id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Load validation, mission, and user profile in parallel
  const [{ data: validation }, { data: mission }, { data: userProfile }] = await Promise.all([
    supabase
      .from('outcome_validations')
      .select('id, user_id, status, confidence_score')
      .eq('id', body.validation_id)
      .eq('mission_id', missionId)
      .maybeSingle(),
    supabase
      .from('missions')
      .select('id, tenant_id, title, reward_amount, xp_reward, difficulty, spots_remaining')
      .eq('id', missionId)
      .maybeSingle(),
    supabase
      .from('user_profiles')
      .select('id, hunter_score, hunter_tier, missions_completed, total_xp')
      .eq('clerk_user_id', user.uid)
      .maybeSingle(),
  ]);

  if (!validation) return NextResponse.json({ error: 'Validation not found' }, { status: 404 });
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
  if (validation.user_id !== user.uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (validation.status !== 'approved') {
    return NextResponse.json({ error: 'Validation is not approved' }, { status: 409 });
  }

  // Idempotent: check if reward already released
  const { data: existingReward } = await supabase
    .from('reward_events')
    .select('id, total_payout, xp_awarded')
    .eq('user_id', user.uid)
    .eq('mission_id', missionId)
    .maybeSingle();

  if (existingReward) {
    return NextResponse.json({
      reward_event_id: existingReward.id,
      total_payout: existingReward.total_payout,
      xp_awarded: existingReward.xp_awarded,
      already_released: true,
    });
  }

  const confidenceScore = body.confidence_score ?? validation.confidence_score ?? 0;
  const previousHunterScore = userProfile?.hunter_score ?? 0;
  const missionsCompleted = (userProfile?.missions_completed ?? 0) + 1;

  // Call reward-agent and reputation-agent in parallel via XIL orchestrator
  const [rewardResult, reputationResult] = await Promise.all([
    orchestrate({
      intelligenceFunction: 'reward',
      objective: `Calculate and release reward for completed mission: ${mission.title}`,
      context: {
        mission_id: missionId,
        mission_title: mission.title,
        base_reward: mission.reward_amount ?? 0,
        xp_reward: mission.xp_reward ?? 100,
        difficulty: mission.difficulty ?? 'medium',
        confidence_score: confidenceScore,
        validation_id: body.validation_id,
        user_id: user.uid,
        missions_completed: missionsCompleted,
      },
      userId: user.uid,
    }),
    orchestrate({
      intelligenceFunction: 'reputation',
      objective: `Update Hunter Score for user after completing mission: ${mission.title}`,
      context: {
        user_id: user.uid,
        mission_id: missionId,
        mission_title: mission.title,
        difficulty: mission.difficulty ?? 'medium',
        confidence_score: confidenceScore,
        previous_score: previousHunterScore,
        missions_completed: missionsCompleted,
        current_tier: userProfile?.hunter_tier ?? 'Explorer',
      },
      userId: user.uid,
    }),
  ]);

  const rewardOutput = rewardResult.results['reward-agent'] as {
    base_reward?: number;
    bonus_amount?: number;
    total_payout?: number;
    xp_awarded?: number;
    release_immediately?: boolean;
    escrow_check?: string;
    reasoning?: string;
  } | undefined;

  const reputationOutput = reputationResult.results['reputation-agent'] as {
    previous_score?: number;
    score_delta?: number;
    new_score?: number;
    current_tier?: string;
    tier_changed?: boolean;
    new_tier?: string | null;
    flag_anomaly?: boolean;
    reasoning?: string;
  } | undefined;

  const totalPayout = rewardOutput?.total_payout ?? 0;
  const xpAwarded = rewardOutput?.xp_awarded ?? 50;
  const newHunterScore = reputationOutput?.new_score ?? previousHunterScore;
  const tierChanged = reputationOutput?.tier_changed ?? false;
  const newTier = reputationOutput?.new_tier ?? null;
  const completedAt = new Date().toISOString();

  // Insert reward_event
  const { data: rewardEvent, error: rewardErr } = await supabase
    .from('reward_events')
    .insert({
      user_id: user.uid,
      mission_id: missionId,
      tenant_id: mission.tenant_id,
      validation_id: body.validation_id,
      base_reward: rewardOutput?.base_reward ?? 0,
      bonus_amount: rewardOutput?.bonus_amount ?? 0,
      total_payout: totalPayout,
      xp_awarded: xpAwarded,
      escrow_check: rewardOutput?.escrow_check ?? 'clear',
      release_immediately: rewardOutput?.release_immediately ?? false,
      released_at: rewardOutput?.release_immediately ? completedAt : null,
    })
    .select('id')
    .single();

  if (rewardErr) return NextResponse.json({ error: rewardErr.message }, { status: 500 });

  // Update mission_progress to completed
  await supabase
    .from('mission_progress')
    .update({ completed_at: completedAt })
    .eq('user_id', user.uid)
    .eq('mission_id', missionId);

  // Update mission_state → completed
  await supabase.from('mission_state').upsert({
    user_id: user.uid,
    mission_id: missionId,
    tenant_id: mission.tenant_id,
    state: 'completed',
    previous_state: 'in_progress',
    entered_at: completedAt,
  }, { onConflict: 'user_id,mission_id' });

  // Update user_profiles: hunter_score, hunter_tier, missions_completed, total_xp
  const profileUpdates: Record<string, unknown> = {
    hunter_score: newHunterScore,
    missions_completed: missionsCompleted,
    total_xp: (userProfile?.total_xp ?? 0) + xpAwarded,
  };
  if (tierChanged && newTier) profileUpdates.hunter_tier = newTier;

  await supabase
    .from('user_profiles')
    .update(profileUpdates)
    .eq('clerk_user_id', user.uid);

  // Emit mission_completed event to mission_events spine
  await supabase.from('mission_events').insert({
    user_id: user.uid,
    mission_id: missionId,
    tenant_id: mission.tenant_id,
    event_type: 'mission_completed',
    session_id: crypto.randomUUID(),
    client_ts: completedAt,
    metadata: {
      reward_event_id: rewardEvent.id,
      total_payout: totalPayout,
      xp_awarded: xpAwarded,
      new_hunter_score: newHunterScore,
      tier_changed: tierChanged,
      new_tier: newTier,
    },
  });

  // Publish to routing bus — workspace can update analytics
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/events/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'consumer',
      target: 'workspace',
      event_type: 'mission_rewarded',
      payload: {
        mission_id: missionId,
        user_id: user.uid,
        reward_event_id: rewardEvent.id,
        total_payout: totalPayout,
        xp_awarded: xpAwarded,
        new_hunter_score: newHunterScore,
        tier_changed: tierChanged,
        new_tier: newTier,
        flag_anomaly: reputationOutput?.flag_anomaly ?? false,
      },
    }),
  }).catch(() => null);

  return NextResponse.json({
    reward_event_id: rewardEvent.id,
    total_payout: totalPayout,
    xp_awarded: xpAwarded,
    new_hunter_score: newHunterScore,
    tier_changed: tierChanged,
    new_tier: newTier,
    escrow_check: rewardOutput?.escrow_check ?? 'clear',
  });
}
