import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createAppTheme } from '../lib/theme';

const ThemeModeContext = createContext(null);

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      theme: createAppTheme(mode),
      toggleMode: () => setMode((current) => (current === 'light' ? 'dark' : 'light'))
    }),
    [mode]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeModeContext() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeModeContext must be used within ThemeModeProvider');
  }

  return context;
}
