import type { MissionType, OrgType, SDGGoal } from './types';

/* ─── design tokens (kept local so this file has no React deps) ─── */
const ACCENT = '#22FFAA';
const AI     = '#6D5DFD';
const WARN   = '#FFB84D';
const ERR    = '#FF5C7A';
const BLUE   = '#60A5FA';
const TEAL   = '#2DD4BF';
const ROSE   = '#FB7185';
const AMBER  = '#F59E0B';

/* ─── expanded impact categories ─── */
export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  sdgs: SDGGoal[];
  description: string;
}

export const IMPACT_CATEGORIES: Category[] = [
  { id: 'all',           label: 'All',              emoji: '✦',  color: ACCENT, sdgs: [],         description: 'All available missions' },
  { id: 'climate',       label: 'Climate',          emoji: '🌍', color: TEAL,   sdgs: [13,15,7],  description: 'Environmental action & sustainability' },
  { id: 'education',     label: 'Education',        emoji: '📚', color: BLUE,   sdgs: [4,10],     description: 'Learning, teaching & knowledge access' },
  { id: 'health',        label: 'Health',           emoji: '💊', color: ERR,    sdgs: [3],        description: 'Public health, wellbeing & medicine' },
  { id: 'civic-tech',    label: 'Civic Tech',       emoji: '🏛️', color: AI,     sdgs: [16,17],    description: 'Government, democracy & civic systems' },
  { id: 'community',     label: 'Community',        emoji: '🤝', color: WARN,   sdgs: [11,10,16], description: 'Local development & social cohesion' },
  { id: 'food-systems',  label: 'Food Systems',     emoji: '🌾', color: AMBER,  sdgs: [2,12],     description: 'Food security, farming & nutrition' },
  { id: 'tech',          label: 'Tech & AI',        emoji: '💻', color: BLUE,   sdgs: [9,8,17],   description: 'Software, AI & digital innovation' },
  { id: 'social-equity', label: 'Equity',           emoji: '⚖️', color: ROSE,   sdgs: [5,10,16],  description: 'Justice, inclusion & equal rights' },
  { id: 'arts',          label: 'Arts & Culture',   emoji: '🎨', color: WARN,   sdgs: [4,11],     description: 'Creative expression & heritage' },
  { id: 'circular',      label: 'Circular Econ.',   emoji: '♻️', color: TEAL,   sdgs: [12,8,9],   description: 'Waste reduction & circular models' },
  { id: 'future-of-work',label: 'Future of Work',   emoji: '🚀', color: AI,     sdgs: [8,9,10],   description: 'Skills, careers & economic opportunity' },
  { id: 'urban',         label: 'Urban',            emoji: '🏙️', color: ACCENT, sdgs: [11],       description: 'Cities, infrastructure & planning' },
  { id: 'water',         label: 'Water & Oceans',   emoji: '🌊', color: BLUE,   sdgs: [6,14],     description: 'Clean water, sanitation & marine life' },
];

export const CATEGORY_MAP = new Map(IMPACT_CATEGORIES.map((c) => [c.id, c]));

/* ─── UN SDG meta ─── */
export const SDG_META: Record<SDGGoal, { label: string; color: string; emoji: string }> = {
  1:  { label: 'No Poverty',            color: '#E5243B', emoji: '🏠' },
  2:  { label: 'Zero Hunger',           color: '#DDA63A', emoji: '🌾' },
  3:  { label: 'Good Health',           color: '#4C9F38', emoji: '❤️' },
  4:  { label: 'Quality Education',     color: '#C5192D', emoji: '📚' },
  5:  { label: 'Gender Equality',       color: '#FF3A21', emoji: '⚖️' },
  6:  { label: 'Clean Water',           color: '#26BDE2', emoji: '💧' },
  7:  { label: 'Clean Energy',          color: '#FCC30B', emoji: '⚡' },
  8:  { label: 'Decent Work',           color: '#A21942', emoji: '💼' },
  9:  { label: 'Industry & Innovation', color: '#FD6925', emoji: '🏭' },
  10: { label: 'Reduced Inequalities',  color: '#DD1367', emoji: '🤝' },
  11: { label: 'Sustainable Cities',    color: '#FD9D24', emoji: '🏙️' },
  12: { label: 'Responsible Consumption',color:'#BF8B2E',emoji: '♻️' },
  13: { label: 'Climate Action',        color: '#3F7E44', emoji: '🌍' },
  14: { label: 'Life Below Water',      color: '#0A97D9', emoji: '🌊' },
  15: { label: 'Life on Land',          color: '#56C02B', emoji: '🌱' },
  16: { label: 'Peace & Justice',       color: '#00689D', emoji: '☮️' },
  17: { label: 'Partnerships',          color: '#19486A', emoji: '🌐' },
};

/* ─── mission type meta ─── */
export const MISSION_TYPE_META: Record<MissionType, { label: string; color: string; emoji: string }> = {
  challenge:    { label: 'Challenge',    color: AI,     emoji: '⚡' },
  research:     { label: 'Research',     color: BLUE,   emoji: '🔬' },
  fieldwork:    { label: 'Fieldwork',    color: TEAL,   emoji: '🗺️' },
  consultation: { label: 'Consultation', color: WARN,   emoji: '💬' },
  creative:     { label: 'Creative',     color: ROSE,   emoji: '🎨' },
  technical:    { label: 'Technical',    color: BLUE,   emoji: '💻' },
  community:    { label: 'Community',    color: ACCENT, emoji: '🤝' },
  advocacy:     { label: 'Advocacy',     color: ERR,    emoji: '📢' },
  training:     { label: 'Training',     color: AMBER,  emoji: '🎓' },
  audit:        { label: 'Audit',        color: AI,     emoji: '📋' },
};

/* ─── org type meta ─── */
export const ORG_TYPE_META: Record<OrgType, { label: string; color: string; emoji: string }> = {
  ngo:              { label: 'NGO',                color: ACCENT, emoji: '🌍' },
  startup:          { label: 'Startup',            color: AI,     emoji: '🚀' },
  university:       { label: 'University',         color: BLUE,   emoji: '🎓' },
  government:       { label: 'Government',         color: TEAL,   emoji: '🏛️' },
  enterprise:       { label: 'Enterprise',         color: WARN,   emoji: '🏢' },
  'social-enterprise': { label: 'Social Enterprise', color: ROSE, emoji: '💡' },
  community:        { label: 'Community',          color: AMBER,  emoji: '🤝' },
};

/* ─── difficulty meta ─── */
export const DIFF_META = {
  easy:   { label: 'Entry Level', color: ACCENT, bg: `${ACCENT}12`, xpMultiplier: 1.0 },
  medium: { label: 'Professional', color: WARN,  bg: `${WARN}12`,   xpMultiplier: 1.5 },
  hard:   { label: 'Expert',      color: ERR,    bg: `${ERR}12`,    xpMultiplier: 2.5 },
} as const;

/* ─── econometrics helpers ─── */

/** Estimated cash reward for a mission based on type and difficulty */
export function estimateCashReward(
  cashReward: number | undefined,
  difficulty: 'easy' | 'medium' | 'hard',
  missionType: MissionType | undefined,
): number {
  if (cashReward != null) return cashReward;
  const base = { easy: 50, medium: 150, hard: 400 };
  const typeMultiplier: Partial<Record<MissionType, number>> = {
    research: 1.4, consultation: 1.8, technical: 1.6,
    creative: 1.2, audit: 1.5, training: 1.3,
  };
  return Math.round((base[difficulty] ?? 50) * (typeMultiplier[missionType ?? 'challenge'] ?? 1));
}

/** Canonical XP for a mission based on steps + difficulty */
export function estimateXP(
  xpReward: number | undefined,
  difficulty: 'easy' | 'medium' | 'hard',
  stepCount: number,
): number {
  if (xpReward != null) return xpReward;
  const base = { easy: 80, medium: 200, hard: 450 };
  return Math.round((base[difficulty] ?? 80) + stepCount * 25);
}

/** Time urgency label from deadline */
export function deadlineLabel(deadline: string | undefined): { label: string; color: string } | null {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  if (days < 0)  return { label: 'Expired',          color: '#4A5578' };
  if (days === 0) return { label: 'Ends today',       color: ERR };
  if (days <= 3)  return { label: `${days}d left`,    color: ERR };
  if (days <= 7)  return { label: `${days}d left`,    color: WARN };
  if (days <= 14) return { label: `${days}d left`,    color: ACCENT };
  return { label: `${days}d left`, color: '#4A5578' };
}

/** Spots urgency label */
export function spotsLabel(remaining: number | undefined, total: number | undefined): { label: string; color: string } | null {
  if (remaining == null || total == null) return null;
  if (remaining === 0) return { label: 'Full',          color: '#4A5578' };
  if (remaining <= 3)  return { label: `${remaining} spots left`, color: ERR };
  if (remaining <= total * 0.3) return { label: `${remaining} spots left`, color: WARN };
  return { label: `${remaining} open`,  color: ACCENT };
}

/** Demand signal from application count */
export function demandLabel(count: number | undefined): string | null {
  if (count == null) return null;
  if (count >= 100) return '🔥 High demand';
  if (count >= 50)  return '📈 Trending';
  if (count >= 20)  return '⚡ Active';
  return null;
}

/** Category for a hunt given its tags */
export function resolveCategory(tags: string[], category?: string): Category {
  if (category) {
    const found = CATEGORY_MAP.get(category);
    if (found) return found;
  }
  for (const tag of tags) {
    const tl = tag.toLowerCase();
    for (const cat of IMPACT_CATEGORIES) {
      if (cat.id !== 'all' && (tl.includes(cat.id) || cat.id.includes(tl))) return cat;
    }
  }
  return IMPACT_CATEGORIES[0];
}
