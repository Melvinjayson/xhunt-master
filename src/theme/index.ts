import { createTheme } from '@mui/material/styles';
import { colors } from './colors';
import { typography } from './typography';
import { getComponents } from './components';

function makeTheme(mode: 'dark' | 'light') {
  const d = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main:         d ? colors.accent     : '#00B87A',
        dark:         d ? colors.accentDark : '#009965',
        contrastText: '#050816',
      },
      secondary: {
        main:         d ? colors.ai      : '#5448D9',
        light:        d ? colors.aiLight : '#8B7FF0',
        contrastText: '#ffffff',
      },
      error:   { main: d ? colors.error   : '#DC2626' },
      warning: { main: d ? colors.warning : '#D97706' },
      info:    { main: colors.info },
      success: { main: d ? colors.accent  : '#00B87A' },
      background: {
        default: d ? colors.bg      : '#F0F4FF',
        paper:   d ? colors.surface : '#E8EEF8',
      },
      text: {
        primary:   d ? colors.txt      : '#0A1226',
        secondary: d ? colors.txtDim   : '#4A5578',
        disabled:  d ? colors.txtFaint : '#8B9CC0',
      },
      divider: d ? colors.border : 'rgba(0,0,0,0.09)',
    },

    typography,
    components: getComponents(mode),

    shape: { borderRadius: 12 },

    breakpoints: {
      values: { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280 },
    },

    spacing: 8,
  });
}

export const xhuntDarkTheme  = makeTheme('dark');
export const xhuntLightTheme = makeTheme('light');
export const xhuntTheme      = xhuntDarkTheme; // backward compat

export { colors }    from './colors';
export { typography } from './typography';
export { sp, spacing } from './spacing';
export { shadows, glows } from './shadows';
