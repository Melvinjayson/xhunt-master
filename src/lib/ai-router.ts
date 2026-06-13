/**
 * AI Router — abstraction over inference providers.
 * Phase 1: Claude (cloud) for all operations.
 * Phase 2: Local models (Ollama/Llama/Qwen) for classification, ranking, personalization.
 *
 * Usage:
 *   const router = createRouter();
 *   const result = await router.complete({ model: 'reasoning', prompt, system });
 */

import Anthropic from '@anthropic-ai/sdk';

export type ModelTier =
  | 'reasoning'    // Complex: mission generation, outcome planning, reporting → Claude Opus
  | 'fast'         // Balanced: step adaptation, classification → Claude Haiku
  | 'local';       // Future: personalization, ranking, recommendation → Ollama

export interface RouterRequest {
  model: ModelTier;
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface RouterResponse {
  text: string;
  provider: 'claude-opus' | 'claude-haiku' | 'local';
  tokensUsed?: number;
}

const MODEL_MAP: Record<Exclude<ModelTier, 'local'>, string> = {
  reasoning: 'claude-opus-4-5',
  fast: 'claude-haiku-4-5-20251001',
};

class AIRouter {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async complete(req: RouterRequest): Promise<RouterResponse> {
    if (req.model === 'local') {
      // Phase 2: route to local Ollama endpoint
      // For now, fall back to fast cloud model
      return this.callClaude('fast', req);
    }
    return this.callClaude(req.model, req);
  }

  private async callClaude(tier: Exclude<ModelTier, 'local'>, req: RouterRequest): Promise<RouterResponse> {
    const modelId = MODEL_MAP[tier];
    const message = await this.client.messages.create({
      model: modelId,
      max_tokens: req.maxTokens ?? 2048,
      system: req.system,
      messages: [{ role: 'user', content: req.prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    return {
      text,
      provider: tier === 'reasoning' ? 'claude-opus' : 'claude-haiku',
      tokensUsed: message.usage?.input_tokens + message.usage?.output_tokens,
    };
  }

  /** Parse JSON from model output, stripping markdown fences */
  parseJSON<T>(text: string): T {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found in response');
    return JSON.parse(text.slice(start, end + 1)) as T;
  }
}

let _router: AIRouter | null = null;

export function getRouter(): AIRouter {
  if (!_router) _router = new AIRouter();
  return _router;
}
