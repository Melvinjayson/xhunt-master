import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { CommunityCatalystInput, CommunityCatalystOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const agentAuth = await requireTenantAgent();
  if (!agentAuth.ok) return agentAuth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: CommunityCatalystInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { communityContext, activeMissions, participantCohort, focusArea } = input;

  if (!communityContext) {
    return NextResponse.json({ error: 'communityContext is required' }, { status: 400 });
  }

  const userPrompt = `Analyze this community and identify meaningful collaboration opportunities.

Community Context: ${communityContext}
${focusArea ? `Focus Area: ${focusArea}` : ''}

Active Missions (${activeMissions?.length ?? 0}):
${JSON.stringify(activeMissions ?? [], null, 2)}

Participant Cohort Sample (${participantCohort?.length ?? 0} participants):
${JSON.stringify(participantCohort?.slice(0, 20) ?? [], null, 2)}

Identify genuine shared interests. Design strategies that build durable relationships, not just platform engagement.
Map all feedback loops. Name the risks explicitly. Consider what happens to this community if the platform disappeared.

Return a JSON object matching the CommunityCatalystOutput schema exactly. No markdown, no code fences — raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['community-catalyst'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const output: CommunityCatalystOutput = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    return NextResponse.json(output);
  } catch (err) {
    console.error('[community-catalyst]', err);
    return NextResponse.json({ error: 'Community catalyst agent failed' }, { status: 500 });
  }
}
