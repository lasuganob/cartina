import {
  Box,
  Button,
  InputAdornment,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { useState, useEffect } from 'react';
import { db, queueMutation } from '../../../../lib/db';
import { apiClient } from '../../../../api/client';
import CategorySelector from '../../../../components/CategorySelector';

export default function CatalogItemDialog({
  item,
  open,
  onClose,
  onComplete,
  categories,
  onScanClick,
  scannerBarcode // Pass the result of a scan if it happened
}) {
  const [step, setStep] = useState('ask_inventory'); // 'ask_inventory' | 'scan' | 'category'
  const [categoryId, setCategoryId] = useState(item.category_id || '');
  const [barcode, setBarcode] = useState('');
  const [isWetMarket, setIsWetMarket] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (scannerBarcode && step === 'scan') {
      setBarcode(scannerBarcode);
      setStep('category');
    }
  }, [scannerBarcode, step]);

  const handleSaveToInventory = async () => {
    setBusy(true);
    try {
      let inventoryItemId;
      try {
        const response = await apiClient.getNextInventoryItemId();
        inventoryItemId = response.next_id;
      } catch (idError) {
        console.warn('Failed to fetch numeric ID, using temporary UUID:', idError);
        inventoryItemId = crypto.randomUUID();
      }
      
      const selectedCategory = categories.find(c => String(c.id) === String(categoryId));
      const newItem = {
        id: inventoryItemId,
        name: item.item_name.trim(),
        barcode: isWetMarket ? '' : barcode.trim(),
        has_no_barcode: isWetMarket,
        category_id: categoryId,
        usual_price: Number(item.actual_price || 0),
        created_at: new Date().toISOString(),
      };

      await db.inventoryItems.put(newItem);
      await queueMutation('inventoryItems', 'create', newItem);

      onComplete({
        inventory_item_id: newItem.id,
        inventory_item: { ...newItem, category: selectedCategory },
        barcode: newItem.barcode,
        is_purchased: true,
        is_ad_hoc: false // It's now in inventory!
      });
    } finally {
      setBusy(false);
    }
  };

  const skipCataloging = () => {
    onComplete({ is_purchased: true });
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onOpen={() => {}}
      onClose={onClose}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxWidth: 600,
          mx: 'auto',
          width: '100%',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 1, bgcolor: 'divider' }} />
      </Box>

      <Box sx={{ px: 2.5, pb: 4, pt: 1 }}>
        {step === 'ask_inventory' && (
          <Stack spacing={3} py={2}>
            <Stack spacing={1} alignItems="center" textAlign="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                }}
              >
                <InventoryRoundedIcon color="primary" sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>
                Catalog this item?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                "{item.item_name}" is not in your inventory. Save it now to remember its price and category for next time?
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={() => setStep('scan')}
                sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
              >
                Yes, Save to Inventory
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                size="large"
                onClick={skipCataloging}
                sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
              >
                Just Purchase once
              </Button>
            </Stack>
          </Stack>
        )}

        {step === 'scan' && (
          <Stack spacing={3} py={2}>
            <Stack spacing={1} textAlign="center">
              <Typography variant="h6" fontWeight={700}>
                Collect Barcode
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scan the item's barcode or mark it as a market item (no barcode).
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<QrCodeScannerRoundedIcon />}
                onClick={onScanClick}
                sx={{ borderRadius: 1, py: 2 }}
              >
                Scan Barcode
              </Button>

              <TextField
                fullWidth
                label="Manual Barcode"
                size="small"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter numbers if scan fails"
              />

              <Button
                fullWidth
                variant="text"
                color="primary"
                startIcon={<StorefrontRoundedIcon />}
                onClick={() => {
                  setIsWetMarket(true);
                  setStep('category');
                }}
                sx={{ fontSize: '12px' }}
              >
                No Barcode (Wet Market/Produce)
              </Button>

              {barcode.trim() && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setStep('category')}
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{ borderRadius: 1, py: 1.5 }}
                >
                  Continue to Category
                </Button>
              )}
            </Stack>

            <Button onClick={() => setStep('ask_inventory')} color="inherit">
              Back
            </Button>
          </Stack>
        )}

        {step === 'category' && (
          <Stack spacing={3} py={2}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                Select Category
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Which category does "{item.item_name}" belong to?
              </Typography>
            </Stack>

            <CategorySelector
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              categories={categories}
            />

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ArrowForwardRoundedIcon />}
                onClick={handleSaveToInventory}
                disabled={busy || !categoryId}
                sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
              >
                {busy ? 'Saving...' : 'Complete & Purchase'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                size="large"
                onClick={() => setStep('scan')}
                disabled={busy}
                sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
              >
                Back
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </SwipeableDrawer>
  );
}
