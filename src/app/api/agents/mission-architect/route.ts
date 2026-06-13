import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { MissionArchitectInput, MissionArchitectOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const auth = await requireTenantAgent();
  if (!auth.ok) return auth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: MissionArchitectInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { goal, audience, industry, duration, success_metric } = input;
  if (!goal || !audience || !industry || !duration || !success_metric) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const userPrompt = `Design a mission for the following objective:

Goal: ${goal}
Target Audience: ${audience}
Industry: ${industry}
Duration: ${duration}
Success Metric: ${success_metric}

Return a JSON object matching the MissionArchitectOutput schema exactly. No markdown, no code fences — raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['mission-architect'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const jsonStr = raw.slice(jsonStart, jsonEnd + 1);

    const output: MissionArchitectOutput = JSON.parse(jsonStr);
    return NextResponse.json(output);
  } catch (err) {
    console.error('[mission-architect]', err);
    return NextResponse.json({ error: 'Agent failed to generate mission' }, { status: 500 });
  }
}
