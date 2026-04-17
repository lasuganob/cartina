import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from '@mui/material';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import StoreRoundedIcon from '@mui/icons-material/StoreRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import { db } from '../lib/db';
import { useMediaQuery, Stack } from '@mui/material';
import { useTheme } from '@emotion/react';
import { useNavigate } from 'react-router-dom';

export default function SettingsDialog({ open, onClose }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
        
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data: ' + error.message);
      }
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
          {/* Management Section */}
          <Box>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
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
