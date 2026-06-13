import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import type { ExperienceDesignerInput, ExperienceDesignerOutput } from '@/lib/agents/types';
import { requireTenantAgent } from '@/lib/agents/auth';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const auth = await requireTenantAgent();
  if (!auth.ok) return auth.response;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let input: ExperienceDesignerInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, story_context, steps, audience } = input;
  if (!title || !steps?.length) {
    return NextResponse.json({ error: 'title and steps are required' }, { status: 400 });
  }

  const userPrompt = `Review and improve this mission for maximum engagement:

Title: ${title}
Story: ${story_context ?? '(none)'}
Audience: ${audience ?? 'general'}
Steps:
${steps.map((s, i) => `${i + 1}. [${s.type}] ${s.instruction}`).join('\n')}

Return a JSON object matching the ExperienceDesignerOutput schema exactly. Raw JSON only.`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: AGENT_SYSTEM_PROMPTS['experience-designer'],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const output: ExperienceDesignerOutput = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json(output);
  } catch (err) {
    console.error('[experience-designer]', err);
    return NextResponse.json({ error: 'Agent failed to analyse mission' }, { status: 500 });
  }
}
