import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeTokens {
  bgPrimary: string;    // panels, header, cards
  bgSecondary: string;  // page/canvas wrapper
  bgCanvas: string;     // drop zone
  bgTile: string;       // palette tiles default
  bgTileHover: string;  // palette tiles hover
  borderSubtle: string; // very light borders
  borderDefault: string;// tile/element borders
  borderMedium: string; // standard borders
  textPrimary: string;
  textSecondary: string;
  accent: string;       // primary interactive / brand accent
}

// Kept for backwards-compat — prefer tokens.accent
export const ACCENT = '#84B4F8';

// Aizen Dark — based on aizen-dark-theme/variables.css
const dark: ThemeTokens = {
  bgPrimary:    '#242424',            // --aizen-surface
  bgSecondary:  '#1A1A1A',            // --aizen-bg
  bgCanvas:     '#141414',            // --aizen-bg-deep
  bgTile:       '#2A2A2A',            // --aizen-surface-raised
  bgTileHover:  'rgba(132,180,248,0.12)', // --aizen-accent translucent
  borderSubtle: '#2A2A2A',            // --aizen-surface-raised
  borderDefault:'#333333',            // --aizen-border
  borderMedium: '#444444',            // --aizen-border-bright
  textPrimary:  '#D0D6F0',            // --aizen-fg
  textSecondary:'#8088A8',            // --aizen-fg-dimmed
  accent:       '#84B4F8',            // --aizen-accent
};

// Aizen Light — derived from the Aizen palette (inverted luminance, same hue family)
const light: ThemeTokens = {
  bgPrimary:    '#FFFFFF',
  bgSecondary:  '#F4F5FA',            // desaturated blue-grey page bg
  bgCanvas:     '#FAFBFF',
  bgTile:       '#F0F2F8',
  bgTileHover:  'rgba(104,152,232,0.10)', // --aizen-accent-deep translucent
  borderSubtle: '#E8EAF2',
  borderDefault:'#D5D8E8',
  borderMedium: '#BFC3D4',
  textPrimary:  '#1A1C2E',            // inverted from --aizen-fg
  textSecondary:'#586080',            // --aizen-fg-disabled
  accent:       '#6898E8',            // --aizen-accent-deep
};

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  tokens: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  isDark: false,
  tokens: light,
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(
    () => (localStorage.getItem('theme-mode') as ThemeMode) ?? 'system'
  );
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  const tokens = isDark ? dark : light;

  useEffect(() => {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.body.style.setProperty('--accent', tokens.accent);
    document.body.style.setProperty('--accent-hover', isDark ? '#6898E8' : '#4F7DCE');
    document.body.style.setProperty('--border', tokens.borderDefault);
  }, [isDark, tokens.accent]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, tokens, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
