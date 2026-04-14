import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, NotFoundException } from '@zxing/library';
import { useTheme } from '@emotion/react';

const mobileDevicePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

function createReader() {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF
  ]);
  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 250,
    delayBetweenScanSuccess: 500
  });
}

export default function BarcodeScannerDialog({ open, onClose, onScanSuccess, variant = 'dialog' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const startingRef = useRef(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setIsDesktop(!mobileDevicePattern.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function stopScanner() {
      startingRef.current = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      if (readerRef.current) {
        readerRef.current.reset();
        readerRef.current = null;
      }
      const video = videoRef.current;
      if (video?.srcObject) {
        const stream = video.srcObject;
        if (typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((track) => track.stop());
        }
        video.srcObject = null;
      }
    }

    async function startScanner() {
      if (!open || isDesktop || !videoRef.current || startingRef.current || controlsRef.current) {
        return;
      }

      startingRef.current = true;
      setLoading(true);
      setError('');

      try {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (cancelled || !videoRef.current) {
          return;
        }

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!devices.length) {
          throw new Error('No camera device was found.');
        }

        const preferredDevice =
          devices.find((device) => /back|rear|environment/i.test(device.label)) ||
          devices[0];

        const reader = createReader();
        readerRef.current = reader;

        const controls = await reader.decodeFromVideoDevice(
          preferredDevice.deviceId,
          videoRef.current,
          (result, decodeError) => {
            if (result) {
              stopScanner().finally(() => {
                onScanSuccess(result.getText());
                onClose();
              });
              return;
            }

            if (decodeError && !(decodeError instanceof NotFoundException)) {
              console.error('ZXing decode error:', decodeError);
            }
          }
        );

        controlsRef.current = controls;

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error starting ZXing scanner:', err);
        if (!cancelled) {
          setError(`Could not access camera: ${err.message || err}`);
          setLoading(false);
        }
      } finally {
        startingRef.current = false;
      }
    }

    if (open) {
      startScanner();
    } else {
      setLoading(false);
      setError('');
      stopScanner();
    }

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [isDesktop, onClose, onScanSuccess, open]);

  if (!open) {
    return null;
  }

  const scannerBody = isDesktop ? (
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
        sx={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: 'black',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          muted
          autoPlay
          playsInline
          sx={{
            width: '100%',
            minHeight: 320,
            display: 'block',
            objectFit: 'cover',
            bgcolor: 'black'
          }}
        />
        {loading ? (
          <Stack spacing={2} alignItems="center" sx={{ color: 'white', position: 'absolute', zIndex: 1 }}>
            <CircularProgress color="inherit" />
            <Typography variant="body2">Starting Camera...</Typography>
          </Stack>
        ) : null}
        {error ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'error.main', position: 'absolute', zIndex: 1 }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        ) : null}
      </Box>
      <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
        Point your camera at a product&apos;s barcode to automatically scan.
      </Typography>
    </>
  );

  if (variant === 'inline') {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Scan Barcode</Typography>
              <Button onClick={onClose}>Close Scanner</Button>
            </Stack>
            {scannerBody}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth keepMounted={false} fullScreen={isMobile}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Scan Barcode</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>{scannerBody}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
