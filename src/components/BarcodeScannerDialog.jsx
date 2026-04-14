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
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScannerDialog({ open, onClose, onScanSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const scannerRef = useRef(null);
  const regionId = 'barcode-scanner-region';

  useEffect(() => {
    // Simple check for desktop/laptop
    const isDesktopDevice = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsDesktop(isDesktopDevice);

    let html5QrCode = null;
    let isActive = true;

    async function startScanner() {
      if (!open || isDesktopDevice) return;

      setLoading(true);
      setError('');

      // Wait a bit longer for the Dialog transition to finish completely
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!isActive) return;

      const element = document.getElementById(regionId);
      if (!element) {
        setLoading(false);
        return;
      }

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      };

      try {
        html5QrCode = new Html5Qrcode(regionId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, 
          config,
          (decodedText) => {
            // Check if we are still active before stopping
            if (isActive && scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().then(() => {
                onScanSuccess(decodedText);
                onClose();
              }).catch(err => {
                console.error('Failed to stop scanner on success:', err);
                onScanSuccess(decodedText);
                onClose();
              });
            }
          },
          () => {} // Ignored failure
        );
        
        if (isActive) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error starting scanner:', err);
        if (isActive) {
          setError('Could not access camera. Please check permissions and device availability.');
          setLoading(false);
        }
      }
    }

    if (open) {
      startScanner();
    }

    return () => {
      isActive = false;
      if (scannerRef.current) {
        const instance = scannerRef.current;
        scannerRef.current = null;
        if (instance.isScanning) {
          instance.stop().catch(err => {
            console.warn('Silent stop on unmount:', err);
          });
        }
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
        {isDesktop ? (
          <Stack spacing={2} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                mb: 1
              }}
            >
              <QrCodeScannerRoundedIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Scanning Blocked
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Barcode scanning is optimized for mobile devices with rear cameras. 
              Please use the manual input field to add barcodes on this device.
            </Typography>
          </Stack>
        ) : (
          <>
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
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
