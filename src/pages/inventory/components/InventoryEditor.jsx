import {
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import BarcodeScannerDialog from '../../../components/BarcodeScannerDialog';

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
  onScanSuccess
}) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Typography>
            <Button onClick={onClose} disabled={busy}>
              Cancel
            </Button>
          </Stack>
          
          {scannerOpen ? (
            <BarcodeScannerDialog
              open={scannerOpen}
              onClose={() => setScannerOpen(false)}
              onScanSuccess={onScanSuccess}
              variant="inline"
            />
          ) : null}

          <TextField
            label="Barcode"
            name="barcode"
            value={values.barcode}
            onChange={onChange}
            placeholder="Scan or enter manually"
            disabled={busy}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setScannerOpen(true)} edge="end" color="primary">
                    <QrCodeScannerRoundedIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            size="small"
          />
          <TextField
            label="Name"
            name="name"
            value={values.name}
            onChange={onChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            disabled={busy}
            required
            fullWidth
            size="small"
          />
          <TextField
            select
            label="Category"
            name="category_id"
            value={values.category_id}
            onChange={onChange}
            error={Boolean(errors.category_id)}
            helperText={errors.category_id}
            disabled={busy}
            required
            fullWidth
            size="small"
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Usual Price"
            name="usual_price"
            type="number"
            value={values.usual_price}
            onChange={onChange}
            error={Boolean(errors.usual_price)}
            helperText={errors.usual_price}
            disabled={busy}
            required
            fullWidth
            slotProps={{
              input: { inputProps: { min: 0, step: "0.01" } }
            }}
            size="small"
          />
          <Stack direction="row" justifyContent="flex-end">
            <Button 
              variant="contained" 
              onClick={onSave} 
              disabled={busy}
              sx={{ px: 4 }}
            >
              {busy ? 'Processing...' : editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
