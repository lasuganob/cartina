import { Card, CardContent, Chip, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import { formatCurrency } from '../../../../utils/formatCurrency';

export default function ShoppingItemCard({ item, index, onChange }) {
  const plannedValue = item.planned_price === '' ? null : Number(item.planned_price);
  const actualValue = item.actual_price === '' ? null : Number(item.actual_price);
  const lineSubtotal = (actualValue || 0) * Number(item.quantity || 1);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={1}
          >
            <Stack spacing={0.75}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="subtitle1" fontWeight={700}>
                  {item.item_name || 'Untitled item'}
                </Typography>
                {item.inventory_item?.category ? (
                  <Chip label={item.inventory_item.category.name} size="small" />
                ) : null}
                {item.is_unplanned ? <Chip label="Unplanned" size="small" color="warning" /> : null}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Item {index + 1}
              </Typography>
            </Stack>
            <Chip
              label={item.is_purchased ? 'Checked' : 'Pending'}
              color={item.is_purchased ? 'success' : 'default'}
              size="small"
            />
          </Stack>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name"
                value={item.item_name}
                onChange={(event) => onChange({ item_name: event.target.value, is_unplanned: true })}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                fullWidth
                label="Qty"
                type="number"
                value={item.quantity}
                onChange={(event) =>
                  onChange({ quantity: Math.max(1, Number(event.target.value || 1)) })
                }
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 8 }}>
              <TextField
                fullWidth
                label="Actual Price"
                type="number"
                value={item.actual_price}
                onChange={(event) => {
                  const value = event.target.value;
                  onChange({
                    actual_price: value,
                    is_purchased: value !== '' ? true : item.is_purchased
                  });
                }}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Planned Price"
                value={plannedValue == null ? 'Not set' : formatCurrency(plannedValue)}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
          >
            <Stack spacing={0.25}>
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {formatCurrency(lineSubtotal)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Checked
              </Typography>
              <Switch
                checked={item.is_purchased}
                onChange={(event) => onChange({ is_purchased: event.target.checked })}
              />
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
