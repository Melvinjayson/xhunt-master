// Design-system elevation shadows
// Usage: import { shadows, glows } from '@/theme/shadows'
//   style={{ boxShadow: shadows.card }}
//   style={{ boxShadow: glows.accent }}
export const shadows = {
  none:  'none',
  xs:    '0 1px 2px rgba(0,0,0,0.4)',
  sm:    '0 2px 4px rgba(0,0,0,0.4)',
  md:    '0 4px 12px rgba(0,0,0,0.45)',
  lg:    '0 8px 24px rgba(0,0,0,0.5)',
  xl:    '0 16px 40px rgba(0,0,0,0.55)',
  card:  '0 2px 8px rgba(0,0,0,0.4)',
  panel: '0 4px 16px rgba(0,0,0,0.45)',
  modal: '0 24px 64px rgba(0,0,0,0.7)',
} as const;

export const glows = {
  accent:  '0 4px 16px rgba(34,255,170,0.25)',
  accentLg:'0 8px 32px rgba(34,255,170,0.3)',
  ai:      '0 4px 16px rgba(109,93,253,0.35)',
  aiLg:    '0 8px 32px rgba(109,93,253,0.4)',
  error:   '0 4px 16px rgba(255,92,122,0.3)',
  warning: '0 4px 16px rgba(255,184,77,0.3)',
} as const;

export type ShadowKey = keyof typeof shadows;
export type GlowKey = keyof typeof glows;
