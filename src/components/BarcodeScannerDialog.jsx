import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScannerDialog({ open, onClose, onScanSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const regionId = 'barcode-scanner-region';

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError('');
      
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      };

      const html5QrCode = new Html5Qrcode(regionId);
      scannerRef.current = html5QrCode;

      html5QrCode
        .start(
          { facingMode: 'environment' }, 
          config,
          (decodedText) => {
            // Success!
            html5QrCode.stop().then(() => {
              onScanSuccess(decodedText);
              onClose();
            });
          },
          () => {
            // Failure is common (no barcode in frame) - just keep going
          }
        )
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error starting scanner:', err);
          setError('Could not start camera. Please ensure camera permissions are granted.');
          setLoading(false);
        });
    } else {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [open, onClose, onScanSuccess]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Scan Barcode</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box
          id={regionId}
          sx={{
            width: '100%',
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: 'black',
            minHeight: 250,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {loading && (
            <Stack spacing={2} alignItems="center" sx={{ color: 'white', position: 'absolute', zIndex: 1 }}>
              <CircularProgress color="inherit" />
              <Typography variant="body2">Starting Camera...</Typography>
            </Stack>
          )}
          {error && (
            <Box sx={{ p: 4, textAlign: 'center', color: 'error.main', position: 'absolute', zIndex: 1 }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}
        </Box>
        <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
          Point your camera at a product's barcode to automatically scan.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
