import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Chip, Pagination, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../../../../utils/formatCurrency';

const ITEMS_PER_PAGE = 5;

export default function ChecklistPreviewCard({ items, onBuildChecklist }) {
  const [page, setPage] = useState(1);
  const sortedItems = items.slice().sort((a, b) => a.sort_order - b.sort_order);
  const pageCount = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const visibleItems = sortedItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

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
                        Quantity: {item.quantity || 1}
                      </Typography>
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
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.5}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, items.length)} of {items.length} checklist items.
                </Typography>
                <Pagination
                  page={page}
                  count={pageCount}
                  color="primary"
                  size="small"
                  onChange={(_, value) => setPage(value)}
                />
              </Stack>
            ) : null}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
