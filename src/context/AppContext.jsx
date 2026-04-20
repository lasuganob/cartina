import { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const [conflict, setConflict] = useState(null);

  // Sync state — lifted here so both layouts (Desktop + Mobile) can read it
  // without each mounting a separate useOfflineSync instance.
  // The actual hook instance lives in App.jsx and passes values down via context.
  const [syncState, setSyncState] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSynced: null,
    pendingCount: 0,
    syncError: null,
    syncNow: () => Promise.resolve(),
  });

  const value = useMemo(
    () => ({
      snackbar,
      showSnackbar(message, severity = 'info') {
        setSnackbar({ open: true, message, severity });
      },
      hideSnackbar() {
        setSnackbar((current) => ({ ...current, open: false }));
      },
      // Sync
      syncState,
      setSyncState,
      // Conflict resolution
      conflict,
      showConflict(entityName, localData, remoteData, resolve) {
        setConflict({ entityName, localData, remoteData, resolve });
      },
      resolveConflict(choice) {
        if (conflict?.resolve) {
          conflict.resolve(choice);
        }
        setConflict(null);
      }
    }),
    [snackbar, syncState, conflict]
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
