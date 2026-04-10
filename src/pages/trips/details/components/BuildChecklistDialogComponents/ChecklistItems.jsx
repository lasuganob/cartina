import {
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { formatCurrency } from '../../../../../utils/formatCurrency';

export default function ChecklistItems({ draftItems, updateItem, removeItem }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={1}
          >
            <Stack>
              <Typography variant="h6">Checklist Items</Typography>
              <Typography variant="body2" color="text.secondary">
                Edit quantities, planned spend, and purchase state for the full checklist.
              </Typography>
            </Stack>
            <Chip label={`${draftItems.length} item${draftItems.length === 1 ? '' : 's'}`} variant="outlined" />
          </Stack>

          {!draftItems.length ? (
            <Typography color="text.secondary">
              No checklist items yet. Add an inventory item or custom item above.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {draftItems.map((item, index) => (
                <Card key={item.id || `${item.item_name}-${index}`} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: 'row' }}
                        justifyContent="space-between"
                        spacing={1.5}
                        alignItems={{ xs: 'center' }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle1">
                            {item.item_name || item.inventory_item?.name || 'Untitled item'}
                          </Typography>
                          {item.inventory_item?.category ? (
                            <Chip label={item.inventory_item.category.name} size="small" />
                          ) : null}
                          {item.is_unplanned ? <Chip label="Custom" size="small" /> : null}
                        </Stack>
                        <IconButton color="error" onClick={() => removeItem(index)}>
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 5 }}>
                          <TextField
                            fullWidth
                            label="Item Name"
                            value={item.item_name}
                            onChange={(event) =>
                              updateItem(index, {
                                item_name: event.target.value,
                                is_unplanned: true,
                                inventory_item_id: '',
                                inventory_item: null
                              })
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(index, {
                                quantity: Math.max(1, Number(event.target.value || 1))
                              })
                            }
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }}>
                          <TextField
                            fullWidth
                            label="Planned Price"
                            type="number"
                            value={item.planned_price}
                            onChange={(event) =>
                              updateItem(index, {
                                planned_price: event.target.value
                              })
                            }
                            inputProps={{ min: 0, step: '0.01' }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            label="Actual Price"
                            type="number"
                            value={item.actual_price}
                            onChange={(event) =>
                              updateItem(index, {
                                actual_price: event.target.value
                              })
                            }
                            inputProps={{ min: 0, step: '0.01' }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Line Total
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {formatCurrency(Number(item.planned_price || 0) * Number(item.quantity || 0))}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider />

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={item.is_purchased}
                              onChange={(event) =>
                                updateItem(index, { is_purchased: event.target.checked })
                              }
                            />
                          }
                          label="Purchased"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={item.is_unplanned}
                              onChange={(event) =>
                                updateItem(index, { is_unplanned: event.target.checked })
                              }
                            />
                          }
                          label="Mark as custom"
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
