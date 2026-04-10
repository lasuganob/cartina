import { ThemeProvider } from '@mui/material/styles';
import { Alert, Snackbar } from '@mui/material';
import { useAppContext } from './context/AppContext';
import { useThemeMode } from './hooks/useThemeMode';
import { useOfflineSync } from './hooks/useOfflineSync';
import AppRouter from './router';

export default function App() {
  const { theme } = useThemeMode();
  const { snackbar, hideSnackbar } = useAppContext();
  useOfflineSync();

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
    </ThemeProvider>
  );
}
