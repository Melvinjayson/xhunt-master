import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

export const TIER_MODELS: Record<string, string> = {
  trial: 'llama-3.1-8b-instant',
  pro:   'llama-3.3-70b-versatile',
};

export function modelForTier(tier: string): string {
  return TIER_MODELS[tier] ?? TIER_MODELS.trial;
}

export default groq;
