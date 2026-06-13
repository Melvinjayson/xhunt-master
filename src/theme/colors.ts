// XHunt brand palette — mirrors the CSS variables in globals.css
export const colors = {
  // Backgrounds
  bg:         '#050816',
  surface:    '#07101F',
  card:       '#0A1226',
  panel:      '#0C1530',

  // Text
  txt:        '#F0F4FF',
  txtDim:     '#8B9CC0',
  txtFaint:   '#4A5578',

  // Brand accents
  accent:     '#22FFAA',
  accentDark: '#1AE090',
  ai:         '#6D5DFD',
  aiLight:    '#A99FFE',

  // Semantic
  success:    '#22FFAA',
  warning:    '#FFB84D',
  error:      '#FF5C7A',
  info:       '#60A5FA',

  // Borders
  border:     'rgba(255,255,255,0.08)',
  borderMid:  'rgba(255,255,255,0.12)',
} as const;

// Short alias — `import { t } from '@/theme/colors'` then use t.accent, t.ai, t.warning…
export const t = colors;
