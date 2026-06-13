import { t } from '@/theme/colors';
import type { Hunt, ImpactProfile } from '@/lib/types';

/* ── Unsplash hero images keyed by mission tag ── */
const MISSION_IMAGES: Record<string, string> = {
  fitness:   'photo-1571019613454-1cb2f99b2d8b',
  adventure: 'photo-1476514525535-07fb3b4ae5f1',
  food:      'photo-1504674900247-0877df9cc836',
  tech:      'photo-1518770660439-4636190af475',
  learning:  'photo-1456513080510-7bf3a84b82f8',
  social:    'photo-1529156069898-49953e39b3ac',
  art:       'photo-1513364776144-60967b0f800f',
  travel:    'photo-1488085061387-422e29b40080',
  mindful:   'photo-1506126613408-eca07ce68773',
  civic:     'photo-1554224155-6726b3ff858f',
  nature:    'photo-1441974231531-c6227db76b6e',
  finance:   'photo-1611974789855-9c2a0a7236a3',
  default:   'photo-1519389950473-47ba0277781c',
};

export function getMissionImage(tags: string[], w = 800, h = 400): string {
  for (const tag of tags) {
    const id = MISSION_IMAGES[tag.toLowerCase()];
    if (id) return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&q=75&auto=format`;
  }
  return `https://images.unsplash.com/${MISSION_IMAGES.default}?w=${w}&h=${h}&fit=crop&q=75&auto=format`;
}

/* ── Per-category accent & dark background gradients ── */
const TAG_ACCENT: Record<string, string> = {
  fitness: t.accent, adventure: t.warning, food: t.error,
  learning: t.info,  social: t.ai,         tech: t.info,
  art: t.warning,    travel: t.accent,      mindful: t.ai,
};

const TAG_BG: Record<string, [string, string]> = {
  fitness:   ['#030F09', '#061A10'], adventure: ['#100A02', '#1A1204'],
  food:      ['#100205', '#1A0508'], learning:  ['#020510', '#040A1E'],
  social:    ['#060218', '#0A0528'], tech:      ['#020510', '#040A20'],
  art:       ['#100802', '#1A1204'], travel:    ['#030F09', '#061A10'],
  mindful:   ['#060218', '#0C0830'],
};

export function tagAccent(tags: string[]): string {
  for (const tag of tags) {
    const c = TAG_ACCENT[tag.toLowerCase()];
    if (c) return c;
  }
  return t.accent;
}

export function tagBg(tags: string[]): [string, string] {
  for (const tag of tags) {
    const c = TAG_BG[tag.toLowerCase()];
    if (c) return c;
  }
  return ['#030F09', '#061A10'];
}

export const DIFF_CLR: Record<string, string> = {
  easy:   t.accent,
  medium: t.warning,
  hard:   t.error,
};

export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function computeMatchScore(hunt: Hunt, profile: ImpactProfile | null): number | null {
  if (!profile) return null;
  const tl = hunt.tags.map(tag => tag.toLowerCase());
  const cl = profile.causes.map(c => c.toLowerCase());
  const sl = profile.strengths.map(s => s.name.toLowerCase());
  let score = 55;
  for (const tag of tl) {
    if (cl.some(c => c.includes(tag) || tag.includes(c))) score += 12;
    if (sl.some(s => s.includes(tag) || tag.includes(s))) score += 8;
  }
  return Math.min(98, score + Math.round((profile.impactScore / 100) * 10));
}
