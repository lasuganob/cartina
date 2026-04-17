import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
  Button,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { formatCurrency } from '../../../../utils/formatCurrency';

export default function ShoppingItemCard({ item, index, onChange, open, onOpen, onClose, scannerStatus }) {
  const [actualPriceError, setActualPriceError] = useState('');

  const plannedValue = item.planned_price === '' ? null : Number(item.planned_price);
  const actualValue = item.actual_price === '' ? null : Number(item.actual_price);
  const lineSubtotal = (actualValue || 0) * Number(item.quantity || 1);

  useEffect(() => {
    if (!open) {
      setActualPriceError('');
    }
  }, [open, item.id]);

  function handleMarkPurchased() {
    if (item.actual_price === '' || item.actual_price === null || item.actual_price === undefined) {
      setActualPriceError('Actual price is required.');
      return;
    }

    setActualPriceError('');
    onChange({ is_purchased: true });
    onClose();
  }

  return (
    <>
      {/* ── Read-only card ── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 1,
          opacity: item.is_purchased ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <CardActionArea onClick={onOpen} sx={{ borderRadius: 1 }}>
          <CardContent sx={{ py: 1.5, px: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              {/* Left: name + meta */}
              <Stack spacing={0.5} flex={1} minWidth={0}>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    noWrap
                    sx={{ maxWidth: '60vw' }}
                  >
                    {item.item_name || 'Untitled item'}
                  </Typography>
                  {item.is_unplanned && (
                    <Chip label="Unplanned" size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />
                  )}
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  {item.inventory_item?.category?.name ? (
                    <Typography variant="caption" color="text.secondary">
                      {item.inventory_item.category.name}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.disabled">
                      No category
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.disabled">·</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Qty&nbsp;{item.quantity}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">·</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {plannedValue == null ? 'No plan price' : formatCurrency(plannedValue)}
                  </Typography>
                </Stack>
              </Stack>

              {/* Right: subtotal or purchased badge */}
              <Stack alignItems="flex-end" spacing={0.25} flexShrink={0}>
                {item.is_purchased ? (
                  <CheckCircleRoundedIcon fontSize="small" color="success" />
                ) : (
                  <Typography variant="caption" color="text.disabled">
                    tap to edit
                  </Typography>
                )}
                {actualValue != null && (
                  <Typography variant="subtitle2" fontWeight={700} color="primary">
                    {formatCurrency(lineSubtotal)}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>

      {/* ── SwipeableDrawer ── */}
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onOpen={onOpen}
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
          {scannerStatus === 'found' && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }}>
              Found in Checklist
            </Alert>
          )}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
            sx={{
              backgroundColor: "background.default",
              borderRadius: 1,
              p: 1.5,
              mb: 2
            }}
          >
            <Stack>
              <Typography variant="subtitle2" fontWeight={700}>
                {item.item_name || ''}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                {item.inventory_item?.category?.name || 'No category'}
              </Typography>
            </Stack>
            <Stack>
              <Typography variant="body2" sx={{ fontSize: "10px" }}>
                {item.barcode || item.inventory_item?.barcode || 'No barcode'}
              </Typography>
            </Stack>
          </Stack>

          {/* Editable fields */}
          <Stack spacing={2}>
            {/* Qty incrementor/decrementor */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 2 }}>
                <IconButton
                  size="small"
                  onClick={() => onChange({ quantity: Math.max(1, item.quantity - 1) })}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    width: 30,
                    height: 30,
                  }}
                >
                  <RemoveRoundedIcon fontSize="small" />
                </IconButton>
                <Typography variant="body1" fontWeight={700} minWidth={28} textAlign="center">
                  {item.quantity}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => onChange({ quantity: item.quantity + 1 })}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    width: 30,
                    height: 30,
                  }}
                >
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
              <TextField
                label="Actual Price"
                size="small"
                type="number"
                value={item.actual_price}
                onChange={(e) => {
                  setActualPriceError('');
                  onChange({
                    actual_price: e.target.value
                  });
                }}
                inputProps={{ min: 0, step: '0.01' }}
                error={Boolean(actualPriceError)}
                helperText={actualPriceError}
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
            {!item.is_purchased && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={handleMarkPurchased}
                sx={{ borderRadius: 1, py: 1.5, fontSize: "12px" }}
              >
                Mark as Purchased
              </Button>
            )}
            {item.is_purchased && (
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                size="large"
                onClick={() => onChange({ is_purchased: false })}
                sx={{ borderRadius: 1, py: 1.5, fontSize: "12px" }}
              >
                Unmark as Purchased
              </Button>
            )}
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              size="large"
              startIcon={<CancelRoundedIcon />}
              onClick={onClose}
              sx={{ borderRadius: 1, py: 1.5, fontSize: "12px" }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </SwipeableDrawer>
    </>
  );
}
