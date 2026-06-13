import { NextRequest, NextResponse } from 'next/server';
import { getLLMInfo } from '@/lib/llm/router';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai
 * Returns the currently configured LLM provider and model.
 * Safe to call from the frontend — never exposes API keys.
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json(getLLMInfo());
}
