import { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const value = useMemo(
    () => ({
      snackbar,
      showSnackbar(message, severity = 'info') {
        setSnackbar({ open: true, message, severity });
      },
      hideSnackbar() {
        setSnackbar((current) => ({ ...current, open: false }));
      }
    }),
    [snackbar]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
}
