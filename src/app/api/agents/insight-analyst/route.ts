import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { InsightAnalystInput, InsightAnalystOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const auth = await requireTenantAgent();
  if (!auth.ok) return auth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: InsightAnalystInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    tenant_name, period_days, total_missions, active_missions,
    total_users, total_attempts, total_completions, completion_rate_pct, top_missions,
  } = input;

  if (!tenant_name) {
    return NextResponse.json({ error: 'tenant_name is required' }, { status: 400 });
  }

  const userPrompt = `Generate an executive intelligence report for the following workspace:

Organisation: ${tenant_name}
Reporting Period: Last ${period_days} days
Total Missions: ${total_missions} (${active_missions} active)
Total Users: ${total_users}
Total Attempts: ${total_attempts}
Total Completions: ${total_completions} (${completion_rate_pct}% rate)

Top Performing Missions:
${top_missions.length > 0
  ? top_missions.map((m, i) => `${i + 1}. "${m.title}" — ${m.completions} completions, ${m.rate_pct}% rate`).join('\n')
  : '(none yet)'}

Return a JSON object matching the InsightAnalystOutput schema exactly. Raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['insight-analyst'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const output: InsightAnalystOutput = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json(output);
  } catch (err) {
    console.error('[insight-analyst]', err);
    return NextResponse.json({ error: 'Agent failed to generate report' }, { status: 500 });
  }
}
