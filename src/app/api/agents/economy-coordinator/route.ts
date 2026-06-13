import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { EconomyCoordinatorInput, EconomyCoordinatorOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const agentAuth = await requireTenantAgent();
  if (!agentAuth.ok) return agentAuth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: EconomyCoordinatorInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { context, currentSkills, contributionHistory, trustScores, objective } = input;

  if (!context || !objective) {
    return NextResponse.json({ error: 'context and objective are required' }, { status: 400 });
  }

  const userPrompt = `Analyze the following participant profile and produce economic coordination intelligence.

Context: ${context}
Objective: ${objective}

Current Skills: ${JSON.stringify(currentSkills ?? [])}
Contribution History (last entries): ${JSON.stringify(contributionHistory ?? [])}
Trust Scores by Dimension: ${JSON.stringify(trustScores ?? {})}

Evaluate both financial materiality and impact materiality before generating recommendations.
Explicitly check all anti-objectives before finalizing your output.

Return a JSON object matching the EconomyCoordinatorOutput schema exactly. No markdown, no code fences — raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['economy-coordinator'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const jsonStr = raw.slice(jsonStart, jsonEnd + 1);

    const output: EconomyCoordinatorOutput = JSON.parse(jsonStr);
    return NextResponse.json(output);
  } catch (err) {
    console.error('[economy-coordinator]', err);
    return NextResponse.json({ error: 'Economy coordinator agent failed' }, { status: 500 });
  }
}
