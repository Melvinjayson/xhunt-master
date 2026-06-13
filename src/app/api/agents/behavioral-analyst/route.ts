import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { BehavioralAnalystInput, BehavioralAnalystOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const auth = await requireTenantAgent();
  if (!auth.ok) return auth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: BehavioralAnalystInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { mission_title, total_attempts, total_completions, step_drop_offs, avg_time_minutes } = input;
  if (!mission_title || total_attempts === undefined) {
    return NextResponse.json({ error: 'mission_title and total_attempts are required' }, { status: 400 });
  }

  const completionRate = total_attempts > 0
    ? ((total_completions / total_attempts) * 100).toFixed(1)
    : '0';

  const userPrompt = `Analyse user behaviour for the following mission:

Mission: ${mission_title}
Total Attempts: ${total_attempts}
Total Completions: ${total_completions} (${completionRate}% rate)
Average Time: ${avg_time_minutes ? `${avg_time_minutes} minutes` : 'unknown'}

Step Drop-off Data:
${step_drop_offs.length > 0
  ? step_drop_offs.map((d) => `- Step ${d.step_index + 1} "${d.step_label}": ${d.drop_count} users dropped off`).join('\n')
  : '(no step-level data available)'}

Return a JSON object matching the BehavioralAnalystOutput schema exactly. Raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['behavioral-analyst'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const output: BehavioralAnalystOutput = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json(output);
  } catch (err) {
    console.error('[behavioral-analyst]', err);
    return NextResponse.json({ error: 'Agent failed to analyse behaviour' }, { status: 500 });
  }
}
