import type { Components, Theme } from '@mui/material/styles';

export function getComponents(mode: 'dark' | 'light'): Components<Theme> {
  const d = mode === 'dark';

  return {
    MuiButtonBase: {
      defaultProps: { disableRipple: false },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
          textTransform: 'none' as const,
          padding: '10px 22px',
          transition: 'all 0.18s ease',
          '&.MuiButton-containedPrimary': {
            background: d ? '#22FFAA' : '#00B87A',
            color: '#050816',
            boxShadow: '0 4px 20px rgba(34,255,170,0.28)',
            '&:hover': {
              background: d ? '#1AE090' : '#009965',
              boxShadow: '0 4px 28px rgba(34,255,170,0.45)',
            },
          },
          '&.MuiButton-containedSecondary': {
            background: d ? '#6D5DFD' : '#5448D9',
            color: '#ffffff',
            '&:hover': { background: d ? '#5B4DD6' : '#4338BD' },
          },
          '&.MuiButton-outlined': {
            borderColor: d ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
            color: d ? '#F0F4FF' : '#0A1226',
            '&:hover': {
              borderColor: d ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
              background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            },
          },
          '&.MuiButton-text': {
            color: d ? '#8B9CC0' : '#4A5578',
            '&:hover': {
              color: d ? '#F0F4FF' : '#0A1226',
              background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            },
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          background: d ? '#07101F' : '#FFFFFF',
          borderRadius: 20,
          border: d ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: d ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: '0.75rem' },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)' },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: d ? '#0C1530' : '#1A2744',
          border: d ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '6px 12px',
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          fontFamily: 'var(--font-onest), system-ui, sans-serif',
          color: d ? '#F0F4FF' : '#0A1226',
          background: d ? '#0A1226' : '#FFFFFF',
          borderRadius: 12,
          '& input::placeholder': { color: d ? '#4A5578' : '#8B9CC0', opacity: 1 },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: d ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: d ? '#22FFAA' : '#00B87A',
            borderWidth: 1,
          },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '2px 8px',
          padding: '10px 12px',
          '&:hover': { background: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
          '&.Mui-selected': {
            background: d ? 'rgba(34,255,170,0.08)' : 'rgba(0,184,122,0.08)',
            '&:hover': { background: d ? 'rgba(34,255,170,0.12)' : 'rgba(0,184,122,0.12)' },
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, background: d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)' },
        bar: { borderRadius: 4 },
      },
    },
  };
}

export const components = getComponents('dark');
