import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { DiscoveryAgentInput, DiscoveryAgentOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const agentAuth = await requireTenantAgent();
  if (!agentAuth.ok) return agentAuth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: DiscoveryAgentInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { goals, currentSkills, interests, location, historyContext, maxRecommendations } = input;

  if (!goals?.length) {
    return NextResponse.json({ error: 'goals is required and must be a non-empty array' }, { status: 400 });
  }

  const userPrompt = `Find meaningful opportunities for this participant.

Goals: ${JSON.stringify(goals)}
Current Skills: ${JSON.stringify(currentSkills ?? [])}
Interests: ${JSON.stringify(interests ?? [])}
${location ? `Location: ${location}` : ''}
${historyContext ? `Recent Activity: ${historyContext}` : ''}
Max Recommendations: ${maxRecommendations ?? 5}

Prioritize learning value and community impact over popularity.
Ensure diverse recommendations — do not favour only the most-clicked opportunities.
Explicitly flag accessibility considerations where relevant.

Return a JSON object matching the DiscoveryAgentOutput schema exactly. No markdown, no code fences — raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['discovery-agent'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const output: DiscoveryAgentOutput = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    return NextResponse.json(output);
  } catch (err) {
    console.error('[discovery-agent]', err);
    return NextResponse.json({ error: 'Discovery agent failed' }, { status: 500 });
  }
}
