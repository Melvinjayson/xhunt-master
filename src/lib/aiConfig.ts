export interface AIConfig {
  reasoning: 'fast' | 'balanced' | 'deep';
  persona: 'mentor' | 'coach' | 'analyst' | 'strategist';
  focusAreas: string[];
  customInstructions: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  reasoning: 'balanced',
  persona: 'mentor',
  focusAreas: [],
  customInstructions: '',
};

export function loadAIConfig(): AIConfig {
  try {
    const s = localStorage.getItem('xhunt-ai-config');
    return s ? { ...DEFAULT_AI_CONFIG, ...JSON.parse(s) } : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAIConfig(cfg: AIConfig): void {
  try {
    localStorage.setItem('xhunt-ai-config', JSON.stringify(cfg));
  } catch {}
}
