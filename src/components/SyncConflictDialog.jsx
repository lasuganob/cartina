import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';

export default function SyncConflictDialog({ open, onResolve, entityName, localData, remoteData }) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main', fontWeight: 600 }}>
        <WarningAmberRoundedIcon />
        Sync Conflict Detected
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" paragraph>
          The <strong>{entityName}</strong> record has been updated on another device since you last synced.
          Which version would you like to keep?
        </Typography>

        <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary' }}>
            Local Version (Your Device)
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
            {localData?.name || localData?.item_name || 'Current change'}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            Modified recently
          </Typography>
        </Box>

        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2, borderRadius: 1, mb: 1 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>
            Cloud Version (Google Sheets)
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
            {remoteData?.name || remoteData?.item_name || 'Cloud version'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }} component="div">
            Updated: {remoteData?.updated_at ? new Date(remoteData.updated_at).toLocaleString() : 'Recently'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => onResolve('remote')}
          startIcon={<CloudDownloadRoundedIcon />}
          sx={{ borderRadius: 2 }}
        >
          Use Cloud Version (Recommended)
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => onResolve('local')}
          startIcon={<CloudUploadRoundedIcon />}
          sx={{ borderRadius: 2 }}
        >
          Overwrite Cloud with my Local version
        </Button>
      </DialogActions>
    </Dialog>
  );
}
