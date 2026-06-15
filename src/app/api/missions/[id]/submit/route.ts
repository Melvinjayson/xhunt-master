import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getServerUser } from '@/lib/firebase/auth-server';
import { orchestrate } from '@/lib/xil/orchestrator';

export const runtime = 'nodejs';

interface SubmitBody {
  evidence: {
    type: 'photo' | 'text' | 'gps' | 'url';
    value: string;
    step_index?: number;
    metadata?: Record<string, unknown>;
  }[];
  notes?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { id: missionId } = await params;
  const body = await req.json() as SubmitBody;

  if (!body.evidence || !Array.isArray(body.evidence) || body.evidence.length === 0) {
    return NextResponse.json({ error: 'evidence array is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify mission exists
  const { data: mission } = await supabase
    .from('missions')
    .select('id, tenant_id, title, description, steps, reward_amount, xp_reward, difficulty')
    .eq('id', missionId)
    .maybeSingle();

  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  // Verify active progress record
  const { data: progress } = await supabase
    .from('mission_progress')
    .select('id, current_step_index, completed_steps, started_at')
    .eq('user_id', user.uid)
    .eq('mission_id', missionId)
    .maybeSingle();

  if (!progress) {
    return NextResponse.json({ error: 'Mission not accepted — call /accept first' }, { status: 409 });
  }

  // Idempotent: check if already submitted (pending or approved)
  const { data: existingValidation } = await supabase
    .from('outcome_validations')
    .select('id, status, verdict')
    .eq('user_id', user.uid)
    .eq('mission_id', missionId)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existingValidation?.status === 'approved') {
    return NextResponse.json({
      validation_id: existingValidation.id,
      status: 'approved',
      already_verified: true,
    });
  }

  const submittedAt = new Date().toISOString();

  // Create (or reuse pending) outcome_validations entry
  let validationId: string;

  if (existingValidation?.status === 'pending') {
    // Update existing pending with fresh evidence
    await supabase
      .from('outcome_validations')
      .update({ evidence: body.evidence, submitted_at: submittedAt, notes: body.notes ?? null })
      .eq('id', existingValidation.id);
    validationId = existingValidation.id;
  } else {
    const { data: newValidation, error: valErr } = await supabase
      .from('outcome_validations')
      .insert({
        user_id: user.uid,
        mission_id: missionId,
        tenant_id: mission.tenant_id,
        progress_id: progress.id,
        status: 'pending',
        evidence: body.evidence,
        submitted_at: submittedAt,
        notes: body.notes ?? null,
      })
      .select('id')
      .single();

    if (valErr) return NextResponse.json({ error: valErr.message }, { status: 500 });
    validationId = newValidation.id;
  }

  // Update mission_state → in_progress
  await supabase.from('mission_state').upsert({
    user_id: user.uid,
    mission_id: missionId,
    tenant_id: mission.tenant_id,
    state: 'in_progress',
    previous_state: 'active',
    entered_at: submittedAt,
  }, { onConflict: 'user_id,mission_id' });

  // Emit submission_received event
  await supabase.from('mission_events').insert({
    user_id: user.uid,
    mission_id: missionId,
    tenant_id: mission.tenant_id,
    event_type: 'submission_received',
    session_id: crypto.randomUUID(),
    client_ts: submittedAt,
    metadata: { validation_id: validationId, evidence_count: body.evidence.length },
  });

  // Call verification-agent via XIL orchestrator
  const verificationResult = await orchestrate({
    intelligenceFunction: 'verification',
    objective: `Verify mission completion evidence for mission: ${mission.title}`,
    context: {
      mission_id: missionId,
      mission_title: mission.title,
      mission_description: mission.description,
      mission_steps: mission.steps,
      submitted_evidence: body.evidence,
      user_notes: body.notes,
      progress: {
        started_at: progress.started_at,
        completed_steps: progress.completed_steps,
        current_step_index: progress.current_step_index,
      },
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

  // Update outcome_validations with verdict
  await supabase
    .from('outcome_validations')
    .update({
      status: verificationStatus,
      confidence_score: confidenceScore,
      verdict: agentOutput,
      verified_at: new Date().toISOString(),
      constitutional_check_id: verificationResult.constitutionalCheckId !== 'skipped'
        ? verificationResult.constitutionalCheckId
        : null,
    })
    .eq('id', validationId);

  // Emit verification_complete event
  await supabase.from('mission_events').insert({
    user_id: user.uid,
    mission_id: missionId,
    tenant_id: mission.tenant_id,
    event_type: 'verification_complete',
    session_id: crypto.randomUUID(),
    client_ts: new Date().toISOString(),
    metadata: {
      validation_id: validationId,
      status: verificationStatus,
      confidence_score: confidenceScore,
    },
  });

  if (verificationStatus === 'approved') {
    // Auto-trigger reward flow via internal fetch
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/missions/${missionId}/reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the session cookie so getServerUser() works in the reward route
        Cookie: req.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({
        validation_id: validationId,
        confidence_score: confidenceScore,
      }),
    }).catch(() => null);
  }

  return NextResponse.json({
    validation_id: validationId,
    status: verificationStatus,
    confidence_score: confidenceScore,
    reasoning: agentOutput?.reasoning,
    missing_evidence: agentOutput?.missing_evidence ?? [],
  });
}
