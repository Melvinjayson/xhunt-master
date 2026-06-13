import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { SustainabilityNavigatorInput, SustainabilityNavigatorOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const agentAuth = await requireTenantAgent();
  if (!agentAuth.ok) return agentAuth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: SustainabilityNavigatorInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    missionContext,
    activityType,
    participantCount,
    geographicalContext,
    currentSDGAlignment,
  } = input;

  if (!missionContext || !activityType) {
    return NextResponse.json({ error: 'missionContext and activityType are required' }, { status: 400 });
  }

  const userPrompt = `Assess the environmental and social sustainability of this mission.

Mission Context: ${missionContext}
Activity Type: ${activityType}
Participant Count: ${participantCount ?? 'unknown'}
${geographicalContext ? `Geographical Context: ${geographicalContext}` : ''}
${currentSDGAlignment?.length ? `Current SDG Alignment Claims: ${currentSDGAlignment.join(', ')}` : ''}

Be evidence-informed, not aspirational. Quantify where possible.
Flag any greenwashing risk explicitly — the greenwashing_risk field must be candid and honest.
Score SDG alignment based on material contribution, not thematic adjacency.
Surface circular economy opportunities that are genuinely actionable.

Return a JSON object matching the SustainabilityNavigatorOutput schema exactly. No markdown, no code fences — raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['sustainability-navigator'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const output: SustainabilityNavigatorOutput = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    return NextResponse.json(output);
  } catch (err) {
    console.error('[sustainability-navigator]', err);
    return NextResponse.json({ error: 'Sustainability Navigator agent failed' }, { status: 500 });
  }
}
