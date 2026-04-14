import { Button, Card, CardContent, Grid, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';

export default function UnplannedItemForm({
  unplannedDraft,
  setUnplannedDraft,
  handleAddUnplannedItem,
  setShowUnplannedForm,
  onScanClick
}) {
  return (
    <Card variant="outlined" sx={{ borderStyle: 'dashed' }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1">New Unplanned Item</Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Barcode"
                value={unplannedDraft.barcode || ''}
                placeholder="Scan or enter manually"
                onChange={(event) =>
                  setUnplannedDraft((current) => ({
                    ...current,
                    barcode: event.target.value
                  }))
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={onScanClick} edge="end" color="primary">
                        <QrCodeScannerRoundedIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={unplannedDraft.item_name}
                onChange={(event) =>
                  setUnplannedDraft((current) => ({
                    ...current,
                    item_name: event.target.value
                  }))
                }
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={unplannedDraft.quantity}
                onChange={(event) =>
                  setUnplannedDraft((current) => ({
                    ...current,
                    quantity: Math.max(1, Number(event.target.value || 1))
                  }))
                }
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 8 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={unplannedDraft.actual_price}
                onChange={(event) =>
                  setUnplannedDraft((current) => ({
                    ...current,
                    actual_price: event.target.value
                  }))
                }
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={handleAddUnplannedItem}
              disabled={!unplannedDraft.item_name.trim() || !unplannedDraft.actual_price}
            >
              Add Item
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setShowUnplannedForm(false);
                setUnplannedDraft({ item_name: '', quantity: 1, actual_price: '', barcode: '' });
              }}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
