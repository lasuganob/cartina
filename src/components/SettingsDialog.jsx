import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Stack,
  useMediaQuery,
} from '@mui/material';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { db } from '../lib/db';
import { useTheme } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function formatRelativeTime(isoString) {
  if (!isoString) return null;
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(isoString).toLocaleDateString();
}

export default function SettingsDialog({ open, onClose }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { syncState, showSnackbar } = useAppContext();
  const { isOnline, isSyncing, lastSynced, pendingCount, syncError, syncNow } = syncState;

  const handleNavigateToManager = (type) => {
    onClose();
    navigate(`/managers?type=${type}`);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      try {
        onClose();

        await db.transaction('rw', db.tables, async () => {
          await Promise.all(db.tables.map(table => table.clear()));
        });

        window.localStorage.clear();
        // Set a flag so the next sync knows to perform a full "Remote Wins" pull
        window.localStorage.setItem('cartina:needs_full_pull', 'true');
        
        navigate('/');
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data: ' + error.message);
      }
    }
  };

  const handleSync = async () => {
    try {
      await syncNow();
      showSnackbar('Synced successfully with Google Sheets', 'success');
    } catch {
      showSnackbar(syncError || 'Sync failed. Check your connection.', 'error');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 1 }
      }}
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>Settings</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={4} sx={{ py: 1 }}>

          {/* Sync Section */}
          <Box>
            <Typography
              variant="subtitle2"
              color="primary"
              sx={{
                fontWeight: 700,
                mb: 2,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <SyncRoundedIcon sx={{ fontSize: 18 }} />
              Google Sheets Sync
            </Typography>

            {/* Status Row */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip
                size="small"
                icon={isOnline ? <CloudDoneRoundedIcon /> : <CloudOffRoundedIcon />}
                label={isOnline ? 'Online' : 'Offline'}
                color={isOnline ? 'success' : 'default'}
                variant="outlined"
              />
              {pendingCount > 0 && (
                <Chip
                  size="small"
                  label={`${pendingCount} pending`}
                  color="warning"
                  variant="outlined"
                />
              )}
              {pendingCount === 0 && lastSynced && (
                <Chip
                  size="small"
                  label="Up to date"
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Last synced timestamp */}
            {lastSynced && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Last synced: {formatRelativeTime(lastSynced)}
              </Typography>
            )}

            {/* Sync error */}
            {syncError && (
              <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                <ErrorOutlineRoundedIcon sx={{ fontSize: 14, color: 'error.main', mt: 0.3, flexShrink: 0 }} />
                <Typography variant="caption" color="error.main">
                  {syncError}
                </Typography>
              </Stack>
            )}

            <Button
              id="settings-sync-button"
              variant="contained"
              fullWidth
              disableElevation
              disabled={!isOnline || isSyncing}
              startIcon={
                isSyncing
                  ? <CircularProgress size={16} color="inherit" />
                  : <SyncRoundedIcon />
              }
              onClick={handleSync}
              sx={{
                borderRadius: 2,
                py: 1.2,
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {isSyncing ? 'Syncing…' : 'Sync Now'}
            </Button>

            {!isOnline && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                You're offline. Connect to sync.
              </Typography>
            )}
          </Box>

          {/* Management Section */}
          <Box>
            <Typography
              variant="subtitle2"
              color="primary"
              sx={{
                fontWeight: 700,
                mb: 2,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <ManageAccountsRoundedIcon sx={{ fontSize: 18 }} />
              Management
            </Typography>
            <Stack spacing={1.5}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<StoreRoundedIcon />}
                onClick={() => handleNavigateToManager('stores')}
                sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2 }}
              >
                Manage Stores
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CategoryRoundedIcon />}
                onClick={() => handleNavigateToManager('categories')}
                sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2 }}
              >
                Manage Categories
              </Button>
            </Stack>
          </Box>

          {/* Local Storage Section */}
          <Box>
            <Typography
              variant="subtitle2"
              color="primary"
              sx={{
                fontWeight: 700,
                mb: 1,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.05em'
              }}
            >
              Local Storage
            </Typography>
            <Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>Clear Cache & Data</Typography>
                <Typography variant="caption" color="text.secondary">
                  Reset the local database. Use this if you encounter sync issues.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="error"
                disableElevation
                size="small"
                startIcon={<DeleteForeverRoundedIcon />}
                onClick={handleClearData}
                sx={{ borderRadius: 2, whiteSpace: 'nowrap', mt: 1, px: 3 }}
              >
                Clear Data
              </Button>
            </Box>
          </Box>

        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="text" sx={{ px: 3 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
