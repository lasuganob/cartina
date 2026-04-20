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
  Typography,
  useMediaQuery,
  useTheme,
  Box
} from '@mui/material';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { formatCurrency } from '../../../../../utils/formatCurrency';
import CategorySelector from '../../../../../components/CategorySelector';
import QuantitySelector from '../../../../../components/QuantitySelector';

export default function ChecklistItems({ draftItems, updateItem, removeItem }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card variant="outlined" sx={{ borderRadius: 1 }}>
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Stack>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>Checklist Items</Typography>
              {!isMobile && (
                <Typography variant="body2" color="text.secondary">
                  Manage quantities, spend, and purchase states.
                </Typography>
              )}
            </Stack>
            <Chip label={`${draftItems.length} item${draftItems.length === 1 ? '' : 's'}`} variant="outlined" size={isMobile ? "small" : "medium"} />
          </Stack>

          {!draftItems.length ? (
            <Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: 'center' }}>
              No checklist items yet. Add an item above to get started.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {draftItems.map((item, index) => (
                <Card key={item.draft_key || item.id || `${item.item_name}-${index}`} variant="outlined" sx={{ borderRadius: 1.5 }}>
                  <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={1.5}
                        alignItems="flex-start"
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {item.item_name || item.inventory_item?.name || 'Untitled item'}
                          </Typography>
                          {item.inventory_item?.category ? (
                            <Chip label={item.inventory_item.category.name} size="small" variant="tonal" sx={{ fontSize: '0.7rem', height: 20 }} />
                          ) : null}
                          {item.is_ad_hoc ? <Chip label="Custom" size="small" color="info" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} /> : null}
                        </Stack>
                        <IconButton size="small" color="error" onClick={() => removeItem(index)} sx={{ mt: -0.5, mr: -0.5 }}>
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12, md: 1.7 }} sx={{ mt: { md: "-20px" }  }}>
                          <Box>
                            {!isMobile && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Quantity
                              </Typography>
                            )}
                            <QuantitySelector
                              value={item.quantity}
                              onChange={(val) => 
                                updateItem(index, {
                                  quantity: val
                                })
                              }
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label="Item Name"
                            value={item.item_name}
                            onChange={(event) =>
                              updateItem(index, {
                                item_name: event.target.value,
                                is_ad_hoc: true,
                                inventory_item_id: '',
                                inventory_item: null
                              })
                            }
                            size="small"
                          />
                        </Grid>
                        {item.is_ad_hoc && (
                          <Grid size={{ xs: 12, md: 4 }}>
                            <CategorySelector
                              value={item.category_id || ''}
                              onChange={(event) => 
                                updateItem(index, { category_id: event.target.value })
                              }
                            />
                          </Grid>
                        )}
                        <Grid size={{ xs: 12, md: 2 }}>
                          <TextField
                            fullWidth
                            label={isMobile ? "Planned Price" : "Planned Price"}
                            type="number"
                            value={item.planned_price}
                            onChange={(event) =>
                              updateItem(index, {
                                planned_price: event.target.value
                              })
                            }
                            inputProps={{ min: 0, step: '0.01' }}
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              Total
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {formatCurrency(Number(item.planned_price || 0) * Number(item.quantity || 0))}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
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
