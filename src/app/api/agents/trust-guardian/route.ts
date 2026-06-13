import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { TrustGuardianInput, TrustGuardianOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';
import { runHeuristicCheck, persistConstitutionalCheck } from '@/lib/xil/constitution';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const agentAuth = await requireTenantAgent();
  if (!agentAuth.ok) return agentAuth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: TrustGuardianInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { proposedAction, actionType, context, stakeholders } = input;

  if (!proposedAction || !actionType) {
    return NextResponse.json({ error: 'proposedAction and actionType are required' }, { status: 400 });
  }

  // Run lightweight heuristic check first
  const heuristic = runHeuristicCheck(proposedAction, context ?? {});

  const userPrompt = `Evaluate this proposed platform action against the X-Hunt Constitutional Framework.

Proposed Action: ${proposedAction}
Action Type: ${actionType}
Stakeholders: ${JSON.stringify(stakeholders ?? [])}
Context: ${JSON.stringify(context ?? {}, null, 2)}

Pre-screening flags (from heuristic): ${heuristic.redFlags.length ? heuristic.redFlags.join('; ') : 'None'}

Apply the full 7-question constitutional test. Assess double materiality.
Detect all anti-patterns. Map stakeholder impact.
Reason about 10-year horizon consequences.

Your verdict carries weight. Be rigorous. Be honest. Prioritize trust over growth.

Return a JSON object matching the TrustGuardianOutput schema exactly. No markdown, no code fences — raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['trust-guardian'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const output: TrustGuardianOutput = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    // Persist the constitutional check from the AI assessment
    const checkId = await persistConstitutionalCheck(
      {
        helpsFlourist:           output.constitutional_assessment.helps_flourish,
        strengthensTrust:        output.constitutional_assessment.strengthens_trust,
        createsValue:            output.constitutional_assessment.creates_value,
        improvesEcosystem:       output.constitutional_assessment.improves_ecosystem,
        isFair:                  output.constitutional_assessment.is_fair,
        isSustainable:           output.constitutional_assessment.is_sustainable,
        proudIn10Years:          output.constitutional_assessment.proud_in_10_years,
        constitutionalScore:     output.constitutional_assessment.score,
        financialMaterialityScore: output.financial_materiality.score,
        financialMaterialityNotes: output.financial_materiality.analysis,
        impactMaterialityScore:    output.impact_materiality.score,
        impactMaterialityNotes:    output.impact_materiality.analysis,
        redFlags:   output.red_flags,
        verdict:    output.verdict,
        conditions: output.conditions,
      },
      actionType,
      proposedAction,
      context ?? {},
      'trust-guardian'
    );

    return NextResponse.json({ output, constitutionalCheckId: checkId });
  } catch (err) {
    console.error('[trust-guardian]', err);
    return NextResponse.json({ error: 'Trust Guardian agent failed' }, { status: 500 });
  }
}
