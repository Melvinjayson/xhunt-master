// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const typography: any = {
  fontFamily: 'var(--font-onest), system-ui, -apple-system, sans-serif',
  fontWeightLight:   300,
  fontWeightRegular: 400,
  fontWeightMedium:  600,
  fontWeightBold:    700,

  h1: { fontSize: '2.5rem',  fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em' },
  h2: { fontSize: '2rem',    fontWeight: 700, lineHeight: 1.2,  letterSpacing: '-0.025em' },
  h3: { fontSize: '1.5rem',  fontWeight: 700, lineHeight: 1.3,  letterSpacing: '-0.02em' },
  h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35, letterSpacing: '-0.015em' },
  h5: { fontSize: '1.1rem',  fontWeight: 600, lineHeight: 1.4  },
  h6: { fontSize: '1rem',    fontWeight: 600, lineHeight: 1.45 },

  body1:    { fontSize: '1rem',    lineHeight: 1.6 },
  body2:    { fontSize: '0.875rem', lineHeight: 1.6 },
  caption:  { fontSize: '0.75rem', lineHeight: 1.5, color: '#8B9CC0' },
  overline: { fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' },
  button:   { fontWeight: 700, letterSpacing: '0.01em', textTransform: 'none' },
};
