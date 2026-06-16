import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getServerUser } from '@/lib/firebase/auth-server';
import { orchestrate } from '@/lib/xil/orchestrator';

export const runtime = 'nodejs';

interface VerifyBody {
  validation_id: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id: missionId } = await params;
  const body = await req.json() as VerifyBody;

  if (!body.validation_id) {
    return NextResponse.json({ error: 'validation_id is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Resolve Firebase UID → user_profiles.id (UUID for FK references)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('clerk_user_id', user.uid)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  const userId = profile.id;

  // Load validation + mission in parallel
  const [{ data: validation }, { data: mission }] = await Promise.all([
    supabase
      .from('outcome_validations')
      .select('id, user_id, status, evidence, notes, progress_id')
      .eq('id', body.validation_id)
      .eq('mission_id', missionId)
      .maybeSingle(),
    supabase
      .from('missions')
      .select('id, tenant_id, title, description, steps, reward_amount, xp_reward, difficulty')
      .eq('id', missionId)
      .maybeSingle(),
  ]);

  if (!validation) return NextResponse.json({ error: 'Validation record not found' }, { status: 404 });
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  // Only the submission owner or a tenant admin should be able to re-verify
  // (For now: same user; tenant admin support can be added later)
  if (validation.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (validation.status === 'approved') {
    return NextResponse.json({ validation_id: validation.id, status: 'approved', already_approved: true });
  }

  // Fetch progress for context
  const { data: progress } = await supabase
    .from('mission_progress')
    .select('started_at, completed_steps, current_step_index')
    .eq('id', validation.progress_id)
    .maybeSingle();

  // Call verification-agent via XIL orchestrator
  const verificationResult = await orchestrate({
    intelligenceFunction: 'verification',
    objective: `Re-verify mission completion evidence for mission: ${mission.title}`,
    context: {
      mission_id: missionId,
      mission_title: mission.title,
      mission_description: mission.description,
      mission_steps: mission.steps,
      submitted_evidence: validation.evidence,
      user_notes: validation.notes,
      progress: progress ?? {},
      re_verification: true,
    },
    userId: user.uid,
  });

  const agentOutput = verificationResult.results['verification-agent'] as {
    status?: string;
    confidence_score?: number;
    reasoning?: string;
    missing_evidence?: string[];
    fraud_signals?: string[];
  } | undefined;

  const verificationStatus = agentOutput?.status ?? 'requires_evidence';
  const confidenceScore = agentOutput?.confidence_score ?? 0;
  const verifiedAt = new Date().toISOString();

  await supabase
    .from('outcome_validations')
    .update({
      status: verificationStatus,
      confidence_score: confidenceScore,
      verdict: agentOutput,
      verified_at: verifiedAt,
    })
    .eq('id', validation.id);

  await supabase.from('mission_events').insert({
    user_id: userId,
    mission_id: missionId,
    tenant_id: mission.tenant_id,
    event_type: 'verification_complete',
    session_id: crypto.randomUUID(),
    client_ts: verifiedAt,
    metadata: {
      validation_id: validation.id,
      status: verificationStatus,
      confidence_score: confidenceScore,
      re_verification: true,
    },
  });

  if (verificationStatus === 'approved') {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/missions/${missionId}/reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({
        validation_id: validation.id,
        confidence_score: confidenceScore,
      }),
    }).catch(() => null);
  }

  return NextResponse.json({
    validation_id: validation.id,
    status: verificationStatus,
    confidence_score: confidenceScore,
    reasoning: agentOutput?.reasoning,
    missing_evidence: agentOutput?.missing_evidence ?? [],
  });
}
