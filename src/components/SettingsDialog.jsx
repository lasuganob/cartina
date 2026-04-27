import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import { db } from '../lib/db';
import ConfirmDialog from './ConfirmDialog';
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
  const { isOnline, isSyncing, lastSynced, pendingCount, failedCount, syncError, syncNow } = syncState;
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const handleNavigateToManager = (type) => {
    onClose();
    navigate(`/managers?type=${type}`);
  };

  const handleClearData = () => {
    setClearConfirmOpen(true);
  };

  const handleConfirmClearData = async () => {
    try {
      setClearConfirmOpen(false);
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

            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.5,
                py: 1.25,
                bgcolor: 'background.default'
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                    <Chip
                      size="small"
                      icon={isOnline ? <CloudDoneRoundedIcon /> : <CloudOffRoundedIcon />}
                      label={isOnline ? 'Online' : 'Offline'}
                      color={isOnline ? 'success' : 'default'}
                      variant="outlined"
                    />
                    {failedCount > 0 ? (
                      <Chip size="small" label={`${failedCount} failed`} color="error" variant="filled" />
                    ) : null}
                    {pendingCount > 0 ? (
                      <Chip
                        size="small"
                        label={`${pendingCount} unsynced`}
                        color={failedCount > 0 ? 'error' : 'warning'}
                        variant="outlined"
                      />
                    ) : (
                      <Chip size="small" label="Auto sync on" color="default" variant="outlined" />
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {failedCount > 0
                      ? 'Some changes could not sync. The app will keep retrying when possible.'
                      : lastSynced
                        ? `Last synced ${formatRelativeTime(lastSynced)}`
                        : 'Sync runs automatically when possible.'}
                  </Typography>
                </Stack>

                <Button
                  id="settings-sync-button"
                  variant="text"
                  size="small"
                  disabled={!isOnline || isSyncing}
                  startIcon={isSyncing ? <CircularProgress size={14} color="inherit" /> : <SyncRoundedIcon />}
                  onClick={handleSync}
                  sx={{ flexShrink: 0, minWidth: 'auto', px: 1, py: 0.5 }}
                >
                  {isSyncing ? 'Syncing' : 'Run now'}
                </Button>
              </Stack>

              {syncError && (
                <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mt: 1 }}>
                  <ErrorOutlineRoundedIcon sx={{ fontSize: 14, color: 'error.main', mt: 0.15, flexShrink: 0 }} />
                  <Typography variant="caption" color="error.main">
                    {syncError}
                  </Typography>
                </Stack>
              )}

              {!isOnline && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Offline changes stay queued until connection returns.
                </Typography>
              )}

              {failedCount > 0 && isOnline && (
                <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>
                  Failed syncs are kept locally and retried automatically. You can also run sync again manually.
                </Typography>
              )}
            </Box>
          </Box>

          <Divider />

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
            <Stack spacing={1.5} direction="row" justifyContent="space-between">
              <Button
                variant="outlined"
                fullWidth
                startIcon={<StoreRoundedIcon />}
                onClick={() => handleNavigateToManager('stores')}
                sx={{ fontSize: "12px", py: 1, borderRadius: 2 }}
              >
                Stores
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CategoryRoundedIcon />}
                onClick={() => handleNavigateToManager('categories')}
                sx={{ fontSize: "12px",py: 1, borderRadius: 2 }}
              >
                Categories
              </Button>
            </Stack>
          </Box>

          <Divider />

          {/* Local Storage Section */}
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
              <StorageRoundedIcon sx={{ fontSize: 18 }} />
              Local Storage
            </Typography>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>Clear Cache & Data</Typography>
              <Typography variant="caption" color="text.secondary"><b>NOTE:</b> This will clear all queued changes.</Typography>
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

        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="text" sx={{ px: 3 }}>
          Close
        </Button>
      </DialogActions>
      <ConfirmDialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleConfirmClearData}
        title="Clear All Local Data?"
        message={<>Are you sure you want to clear all local data? <strong>This will clear all queued changes</strong> and cannot be undone.</>}
        confirmLabel="Clear Data"
        busyLabel="Clearing…"
      />
    </Dialog>
  );
}
