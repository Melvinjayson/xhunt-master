import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { OutcomePlannerInput, OutcomePlannerOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const auth = await requireTenantAgent();
  if (!auth.ok) return auth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: OutcomePlannerInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { desired_outcome, audience, industry, timeline_weeks, current_state, constraints } = input;
  if (!desired_outcome || !audience || !industry || !timeline_weeks) {
    return NextResponse.json({ error: 'desired_outcome, audience, industry, and timeline_weeks are required' }, { status: 400 });
  }

  const userPrompt = `Design a mission roadmap to achieve the following:

Desired Outcome: ${desired_outcome}
Current State: ${current_state ?? 'Not specified'}
Audience: ${audience}
Industry: ${industry}
Timeline: ${timeline_weeks} weeks
Constraints: ${constraints ?? 'None specified'}

Work backwards from the outcome. Define the milestones, mission sequence, risks, and key assumptions.
Return a JSON object matching the OutcomePlannerOutput schema exactly. Raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      system: AGENT_SYSTEM_PROMPTS['outcome-planner'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const output: OutcomePlannerOutput = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    return NextResponse.json(output);
  } catch (err) {
    console.error('[outcome-planner]', err);
    return NextResponse.json({ error: 'Outcome Planner failed to generate roadmap' }, { status: 500 });
  }
}
