import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { KnowledgeAgentInput, KnowledgeAgentOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const auth = await requireTenantAgent();
  if (!auth.ok) return auth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: KnowledgeAgentInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, context, node_types, max_recommendations = 5 } = input;
  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const userPrompt = `Answer the following question about mission strategy and provide recommendations:

Query: ${query}
Context: ${context ?? 'No additional context provided'}
Relevant Node Types: ${node_types?.length ? node_types.join(', ') : 'all'}
Max Recommendations: ${max_recommendations}

Return a JSON object matching the KnowledgeAgentOutput schema exactly. Raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['knowledge-agent'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const output: KnowledgeAgentOutput = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    return NextResponse.json(output);
  } catch (err) {
    console.error('[knowledge-agent]', err);
    return NextResponse.json({ error: 'Knowledge Agent failed to respond' }, { status: 500 });
  }
}
