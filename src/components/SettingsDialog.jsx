import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from '@mui/material';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import { db } from '../lib/db';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@emotion/react';

export default function SettingsDialog({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            Local Storage
          </Typography>
          <Box>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>Clear Cache & Data</Typography>
              <Typography variant="caption" color="text.secondary">
                Reset the local database. Use this if you encounter sync issues or want to start fresh.
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
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="text" sx={{ px: 3 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
