import { ThemeProvider } from '@mui/material/styles';
import { Alert, Snackbar } from '@mui/material';
import { useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import { useThemeMode } from './hooks/useThemeMode';
import { useOfflineSync } from './hooks/useOfflineSync';
import AppRouter from './router';
import SyncConflictDialog from './components/SyncConflictDialog';

export default function App() {
  const { theme } = useThemeMode();
  const { snackbar, hideSnackbar, setSyncState, conflict, resolveConflict } = useAppContext();
  const sync = useOfflineSync();

  // Bridge the hook values into context so layouts can read them
  useEffect(() => {
    setSyncState(sync);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.isOnline, sync.isSyncing, sync.lastSynced, sync.pendingCount, sync.syncError]);

  return (
    <ThemeProvider theme={theme}>
      <AppRouter />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={hideSnackbar} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
      {conflict && (
        <SyncConflictDialog
          open={!!conflict}
          entityName={conflict.entityName}
          localData={conflict.localData}
          remoteData={conflict.remoteData || conflict.remote_trip || conflict.remote_item}
          onResolve={resolveConflict}
        />
      )}
    </ThemeProvider>
  );
}
