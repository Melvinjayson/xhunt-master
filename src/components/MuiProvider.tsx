'use client';

import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { xhuntDarkTheme, xhuntLightTheme } from '@/theme';

export function MuiProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setIsDark(el.getAttribute('data-theme') !== 'light');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  return (
    <ThemeProvider theme={isDark ? xhuntDarkTheme : xhuntLightTheme}>
      {children}
    </ThemeProvider>
  );
}
