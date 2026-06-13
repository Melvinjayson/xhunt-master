/**
 * XIL Orchestrator
 *
 * Routes intelligence requests to the appropriate specialist agents,
 * applies constitutional checks, and returns coordinated responses
 * with full provenance.
 */

import Anthropic from '@anthropic-ai/sdk';
import { AGENT_SYSTEM_PROMPTS } from '@/lib/agents/prompts';
import { runHeuristicCheck, persistConstitutionalCheck, logXILRoute } from './constitution';

const client = new Anthropic();

export type IntelligenceFunction =
  | 'personal'
  | 'community'
  | 'marketplace'
  | 'impact'
  | 'governance'
  | 'foundry';

interface AgentCall {
  agentId: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

async function callAgent(call: AgentCall): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: call.maxTokens ?? 2048,
    system: call.systemPrompt,
    messages: [{ role: 'user', content: call.userPrompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonStart = raw.indexOf('{');
  const jsonEnd = raw.lastIndexOf('}');
  return raw.slice(jsonStart, jsonEnd + 1);
}

const FUNCTION_TO_AGENTS: Record<IntelligenceFunction, string[]> = {
  personal:    ['discovery-agent'],
  community:   ['community-catalyst'],
  marketplace: ['economy-coordinator'],
  impact:      ['sustainability-navigator'],
  governance:  ['trust-guardian'],
  foundry:     ['agent-foundry'],
};

export interface OrchestratorRequest {
  intelligenceFunction: IntelligenceFunction;
  objective: string;
  context: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  skipConstitutionalCheck?: boolean;
}

export interface OrchestratorResponse {
  intelligenceFunction: IntelligenceFunction;
  agentsInvoked: string[];
  results: Record<string, unknown>;
  constitutionalCheck: {
    verdict: string;
    score: number;
    redFlags: string[];
    conditions: string[];
  };
  constitutionalCheckId: string;
  processingMs: number;
}

export async function orchestrate(req: OrchestratorRequest): Promise<OrchestratorResponse> {
  const start = Date.now();
  const agentIds = FUNCTION_TO_AGENTS[req.intelligenceFunction] ?? ['trust-guardian'];

  // Pre-flight constitutional check
  let checkId = 'skipped';
  const heuristicCheck = runHeuristicCheck(req.objective, req.context);

  if (!req.skipConstitutionalCheck) {
    if (heuristicCheck.verdict === 'rejected') {
      // Short-circuit: don't invoke agents for constitutionally-rejected requests
      checkId = await persistConstitutionalCheck(
        heuristicCheck,
        req.intelligenceFunction,
        req.objective,
        req.context,
        agentIds[0],
        req.userId
      );

      const processingMs = Date.now() - start;
      await logXILRoute(req.intelligenceFunction, [], req.objective, 'Rejected by constitutional check', processingMs, checkId, req.userId, req.sessionId);

      return {
        intelligenceFunction: req.intelligenceFunction,
        agentsInvoked: [],
        results: {
          error: 'Request rejected by constitutional alignment check',
          redFlags: heuristicCheck.redFlags,
          verdict: 'rejected',
        },
        constitutionalCheck: {
          verdict: heuristicCheck.verdict,
          score: heuristicCheck.constitutionalScore,
          redFlags: heuristicCheck.redFlags,
          conditions: heuristicCheck.conditions,
        },
        constitutionalCheckId: checkId,
        processingMs,
      };
    }

    checkId = await persistConstitutionalCheck(
      heuristicCheck,
      req.intelligenceFunction,
      req.objective,
      req.context,
      agentIds[0],
      req.userId
    );
  }

  // Invoke agents in parallel where possible
  const results: Record<string, unknown> = {};
  const invokedIds: string[] = [];

  await Promise.all(
    agentIds.map(async (agentId) => {
      const systemPrompt = AGENT_SYSTEM_PROMPTS[agentId];
      if (!systemPrompt) {
        results[agentId] = { error: `No system prompt registered for agent: ${agentId}` };
        return;
      }

      const userPrompt = buildAgentPrompt(agentId, req.objective, req.context);

      try {
        const raw = await callAgent({ agentId, systemPrompt, userPrompt });
        results[agentId] = JSON.parse(raw);
        invokedIds.push(agentId);
      } catch (err) {
        results[agentId] = { error: `Agent ${agentId} failed: ${(err as Error).message}` };
      }
    })
  );

  const processingMs = Date.now() - start;
  const outputSummary = JSON.stringify(results).slice(0, 500);

  await logXILRoute(
    req.intelligenceFunction,
    invokedIds,
    req.objective,
    outputSummary,
    processingMs,
    checkId !== 'skipped' ? checkId : undefined,
    req.userId,
    req.sessionId
  );

  return {
    intelligenceFunction: req.intelligenceFunction,
    agentsInvoked: invokedIds,
    results,
    constitutionalCheck: {
      verdict: heuristicCheck.verdict,
      score: heuristicCheck.constitutionalScore,
      redFlags: heuristicCheck.redFlags,
      conditions: heuristicCheck.conditions,
    },
    constitutionalCheckId: checkId,
    processingMs,
  };
}

function buildAgentPrompt(
  agentId: string,
  objective: string,
  context: Record<string, unknown>
): string {
  return `Objective: ${objective}

Context:
${JSON.stringify(context, null, 2)}

Apply your constitutional mandate. Evaluate both financial materiality and impact materiality.
Check all anti-objectives before finalizing your output.

Return valid JSON matching your output schema exactly. Raw JSON only.`;
}
