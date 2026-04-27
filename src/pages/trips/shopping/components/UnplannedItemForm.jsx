import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import Alert from '@mui/material/Alert';
import { formatCurrency } from '../../../../utils/formatCurrency';
import { db } from '../../../../lib/db';
import { createClientId } from '../../../../lib/ids';
import CategorySelector from '../../../../components/CategorySelector';
import QuantitySelector from '../../../../components/QuantitySelector';
import BarcodeScannerDialog from '../../../../components/BarcodeScannerDialog';
import { useState } from 'react';
import { useAppContext } from '../../../../context/AppContext';
import { syncMutationNowOrEnqueue } from '../../../../hooks/useOfflineSync';

export default function UnplannedItemForm({
  unplannedDraft,
  setUnplannedDraft,
  handleAddUnplannedItem,
  setShowUnplannedForm,
  scannerStatus,
  categories,
}) {
  const [step, setStep] = useState('form'); // 'form' | 'ask_inventory' | 'scanning'
  const [busy, setBusy] = useState(false);
  const { showConflict } = useAppContext();

  const lineSubtotal = Number(unplannedDraft.actual_price || 0) * Number(unplannedDraft.quantity || 1);

  const handleClose = () => {
    setShowUnplannedForm(false);
    setUnplannedDraft({ item_name: '', quantity: 1, actual_price: '', barcode: '', category_id: '' });
    setStep('form');
  };

  const updateDraft = (changes) => {
    setUnplannedDraft((prev) => ({ ...prev, ...changes }));
  };

  const onAddClick = async () => {
    // If there is no barcode, just add to checklist
    if (!unplannedDraft.barcode) {
      handleAddUnplannedItem();
      return;
    }

    // Check if barcode exists in inventory
    setBusy(true);
    try {
      const existing = await db.inventoryItems.where('barcode').equals(unplannedDraft.barcode).first();
      if (existing) {
        // Find category name
        const category = categories.find(c => c.id === existing.category_id);
        handleAddUnplannedItem({ ...existing, category });
      } else {
        setStep('ask_inventory');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveToInventory = async () => {
    setBusy(true);
    try {
      const selectedCategory = categories.find(c => String(c.id) === String(unplannedDraft.category_id));
      const newItem = {
        id: createClientId(),
        name: unplannedDraft.item_name.trim(),
        barcode: unplannedDraft.barcode.trim(),
        category_id: unplannedDraft.category_id,
        usual_price: Number(unplannedDraft.actual_price || 0),
        created_at: new Date().toISOString(),
      };

      await db.inventoryItems.put(newItem);
      await syncMutationNowOrEnqueue(
        {
          entity: 'inventoryItems',
          action: 'create',
          payload: newItem
        },
        {
          preferBackground: true,
          onConflict: async (entityName, localData, remoteData) =>
            new Promise((resolve) => {
              showConflict(entityName, localData, remoteData, resolve);
            })
        }
      );

      
      handleAddUnplannedItem({ ...newItem, category: selectedCategory });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={true}
      onOpen={() => setShowUnplannedForm(true)}
      onClose={handleClose}
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
      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 1, bgcolor: 'divider' }} />
      </Box>

      <Box sx={{ px: 2.5, pb: 4, pt: 1 }}>
        {scannerStatus === 'not_found' && step === 'form' && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
            Not in Checklist
          </Alert>
        )}

        {step === 'form' && (
          <>
            {/* Header */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                backgroundColor: 'background.default',
                borderRadius: 1,
                p: 1.5,
                mb: 2,
              }}
            >
              <Stack>
                <Typography variant="subtitle2" fontWeight={700}>
                  New Unplanned Item
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                  Added during shopping
                </Typography>
              </Stack>
            </Stack>

            {/* Editable fields */}
            <Stack spacing={2}>
              {/* Barcode */}
              <TextField
                fullWidth
                label="Barcode (Optional)"
                size="small"
                value={unplannedDraft.barcode || ''}
                placeholder="Scan or enter manually"
                onChange={(e) => updateDraft({ barcode: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setStep('scanning')} edge="end" color="primary">
                        <QrCodeScannerRoundedIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Name */}
              <TextField
                fullWidth
                label="Name"
                size="small"
                value={unplannedDraft.item_name}
                onChange={(e) => updateDraft({ item_name: e.target.value })}
              />

              {/* Category */}
              <CategorySelector
                value={unplannedDraft.category_id || ''}
                onChange={(e) => updateDraft({ category_id: e.target.value })}
                categories={categories}
              />

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <QuantitySelector
                  value={unplannedDraft.quantity}
                  onChange={(val) => updateDraft({ quantity: val })}
                  sx={{ mr: 2 }}
                />

                {/* Price */}
                <TextField
                  label="Price"
                  size="small"
                  type="number"
                  value={unplannedDraft.actual_price}
                  onChange={(e) => updateDraft({ actual_price: e.target.value })}
                  inputProps={{ min: 0, step: '0.01' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                  }}
                />
              </Stack>

              {/* Subtotal */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  px: 2,
                  py: 1.25,
                }}
              >
                <Typography variant="subtitle1" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {formatCurrency(lineSubtotal)}
                </Typography>
              </Stack>
            </Stack>

            {/* Action buttons */}
            <Stack spacing={1.5} mt={3}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddRoundedIcon />}
                onClick={onAddClick}
                disabled={busy || !unplannedDraft.item_name.trim() || !unplannedDraft.actual_price || !unplannedDraft.category_id}
                sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
              >
                Add Item
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                size="large"
                startIcon={<CancelRoundedIcon />}
                onClick={handleClose}
                disabled={busy}
                sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
              >
                Cancel
              </Button>
            </Stack>
          </>
        )}

        {step === 'scanning' && (
          <Box py={2}>
            <BarcodeScannerDialog
              open={true}
              variant="inline"
              onClose={() => setStep('form')}
              onScanSuccess={(code) => {
                updateDraft({ barcode: code });
                setStep('form');
              }}
            />
          </Box>
        )}

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
                Add to Inventory?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This barcode is not in your catalog. Would you like to save it for future trips?
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={handleSaveToInventory}
                disabled={busy}
                sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
              >
                {busy ? 'Saving...' : 'Yes, Save to Inventory'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                size="large"
                onClick={handleAddUnplannedItem}
                disabled={busy}
                sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
              >
                No, Just Add to Checklist
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
    </SwipeableDrawer>
  );
}
