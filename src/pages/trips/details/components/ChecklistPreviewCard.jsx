import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../../../../utils/formatCurrency';

export default function ChecklistPreviewCard({ items, onBuildChecklist }) {
  const sortedItems = items.slice().sort((a, b) => a.sort_order - b.sort_order);
  const visibleItems = sortedItems.slice(0, 5);

  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">Checklist Preview</Typography>
          <Chip label={`${items.length} item${items.length === 1 ? '' : 's'}`} variant="outlined" />
        </Stack>

        {!items.length ? (
          <>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No checklist items yet. Start by building the checklist for this trip.
            </Typography>
            <Button variant="contained" onClick={onBuildChecklist}>
              Build Checklist
            </Button>
          </>
        ) : (
          <Stack spacing={2}>
            {visibleItems.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Stack direction="row" spacing={1}>
                        <Typography variant="subtitle1">{item.item_name || item.inventory_item?.name}</Typography>
                        {item.inventory_item?.category && (
                          <Chip label={item.inventory_item.category.name} size="small" />
                        )}
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        Planned: {item.planned_price == null ? 'Not set' : formatCurrency(item.planned_price)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Actual: {item.actual_price == null ? 'Not purchased' : formatCurrency(item.actual_price)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {item.is_unplanned ? <Chip label="Unplanned" size="small" /> : null}
                      <Chip
                        label={item.is_purchased ? 'Purchased' : 'Pending'}
                        color={item.is_purchased ? 'success' : 'default'}
                        size="small"
                      />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {items.length > visibleItems.length ? (
              <Typography variant="body2" color="text.secondary">
                Showing {visibleItems.length} of {items.length} checklist items.
              </Typography>
            ) : null}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
