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
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import BarcodeScannerDialog from '../../../components/BarcodeScannerDialog';
import CategorySelector from '../../../components/CategorySelector';

export default function InventoryEditor({
  editingItem,
  values,
  errors,
  busy,
  categories,
  scannerOpen,
  setScannerOpen,
  onClose,
  onChange,
  onSave,
  onScanSuccess,
}) {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={true}
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
      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 1, bgcolor: 'divider' }} />
      </Box>

      <Box sx={{ px: 2.5, pb: 4, pt: 1 }}>
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
              {editingItem ? 'Edit Inventory Item' : 'New Inventory Item'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {editingItem ? 'Update product details' : 'Add basic product info'}
            </Typography>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          {scannerOpen && (
            <BarcodeScannerDialog
              open={scannerOpen}
              onClose={() => setScannerOpen(false)}
              onScanSuccess={onScanSuccess}
              variant="inline"
            />
          )}

          <TextField
            fullWidth
            label="Barcode"
            name="barcode"
            size="small"
            value={values.barcode}
            onChange={onChange}
            placeholder="Scan or enter manually"
            disabled={busy}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setScannerOpen(true)} edge="end" color="primary">
                    <QrCodeScannerRoundedIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Name"
            name="name"
            size="small"
            value={values.name}
            onChange={onChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            disabled={busy}
            required
          />

          <CategorySelector
            value={values.category_id}
            onChange={onChange}
            error={Boolean(errors.category_id)}
            helperText={errors.category_id}
            disabled={busy}
            categories={categories}
          />

          <TextField
            fullWidth
            label="Usual Price"
            name="usual_price"
            size="small"
            type="number"
            value={values.usual_price}
            onChange={onChange}
            error={Boolean(errors.usual_price)}
            helperText={errors.usual_price}
            disabled={busy}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
            }}
            slotProps={{
              input: { inputProps: { min: 0, step: '0.01' } },
            }}
          />

          {/* Action buttons */}
          <Stack spacing={1.5} mt={1}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SaveRoundedIcon />}
              onClick={onSave}
              disabled={busy}
              sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
            >
              {busy ? 'Processing...' : editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              size="large"
              startIcon={<CancelRoundedIcon />}
              onClick={onClose}
              disabled={busy}
              sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
}
