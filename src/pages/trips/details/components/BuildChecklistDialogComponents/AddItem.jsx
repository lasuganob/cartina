import { Autocomplete, Button, Card, CardContent, Grid, Stack, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import { formatCurrency } from '../../../../../utils/formatCurrency';

function getInventoryLabel(option) {
  if (typeof option === 'string') {
    return option;
  }

  return option?.name || '';
}

export default function AddItem({ inventoryData, addDraft, setAddDraft, handleAddItem }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Stack spacing={2}>
          <Stack>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Add Item</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose from inventory or type custom entry.
            </Typography>
          </Stack>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                freeSolo
                options={inventoryData}
                value={addDraft.option}
                onChange={(_, value) => {
                  if (typeof value === 'string') {
                    setAddDraft((current) => ({
                      ...current,
                      option: null,
                      item_name: value,
                      planned_price: current.planned_price
                    }));
                    return;
                  }

                  setAddDraft((current) => ({
                    ...current,
                    option: value,
                    item_name: value?.name || '',
                    planned_price:
                      current.planned_price === '' ? value?.usual_price ?? '' : current.planned_price
                  }));
                }}
                inputValue={addDraft.item_name}
                onInputChange={(_, value, reason) => {
                  if (reason === 'reset') {
                    return;
                  }

                  setAddDraft((current) => ({
                    ...current,
                    item_name: value,
                    option:
                      current.option && current.option.name === value ? current.option : null
                  }));
                }}
                getOptionLabel={getInventoryLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.category?.name || 'Uncategorized'}
                        {option.usual_price != null ? ` • ${formatCurrency(option.usual_price)}` : ''}
                      </Typography>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Item Name" fullWidth />
                )}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <TextField
                fullWidth
                label="Qty"
                type="number"
                value={addDraft.quantity}
                onChange={(event) =>
                  setAddDraft((current) => ({
                    ...current,
                    quantity: Math.max(1, Number(event.target.value || 1))
                  }))
                }
                inputProps={{ min: 1 }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={addDraft.planned_price}
                onChange={(event) =>
                  setAddDraft((current) => ({
                    ...current,
                    planned_price: event.target.value
                  }))
                }
                inputProps={{ min: 0, step: '0.01' }}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddItem}
                disabled={!addDraft.item_name || !addDraft.quantity || !addDraft.planned_price}
                startIcon={isMobile ? <AddBoxRoundedIcon /> : null}
                sx={{ 
                  height: 40, 
                  minWidth: { md: 40 },
                  borderRadius: 1.5,
                  p: { md: 0 } 
                }}
              >
                {isMobile ? 'Add Item' : <AddBoxRoundedIcon sx={{ fontSize: 28 }} />}
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
