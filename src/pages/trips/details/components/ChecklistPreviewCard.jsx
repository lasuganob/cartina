import { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  Pagination, 
  Stack, 
  Typography,
  List,
  ListItem,
  Divider
} from '@mui/material';
import { formatCurrency } from '../../../../utils/formatCurrency';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';

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
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="body1" fontWeight={700}>Checklist Preview</Typography>
          <Chip 
            label={items.length} 
            size="small"
            sx={{ fontWeight: 700, bgcolor: 'action.selected' }} 
          />
        </Stack>

        {!items.length ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your checklist is empty.
            </Typography>
            <Button 
                variant="contained" 
                onClick={onBuildChecklist}
                fullWidth
                sx={{ borderRadius: 2, py: 1.5 }}
            >
              Build Checklist
            </Button>
          </Box>
        ) : (
          <Box>
            <List disablePadding>
              {visibleItems.map((item, index) => (
                <Box key={item.draft_key || item.id || `${item.item_name}-${index}`}>
                  <ListItem 
                    disableGutters 
                    sx={{ 
                      flexDirection: 'column', 
                      alignItems: 'flex-start',
                      py: 1.5
                    }}
                  >
                    {/* Top Row: Name and Status */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ width: '100%', mb: 0.5 }}>
                        <Typography variant="button" sx={{ fontWeight: 600, textTransform: 'none', lineHeight: 1.2 }}>
                            {item.item_name || item.inventory_item?.name}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                             {item.is_unplanned && <Chip label="Unplanned" size="extraSmall" color="warning" variant="outlined" sx={{ fontSize: '10px', height: 18 }} />}
                             <Box sx={{ 
                                 width: 8, 
                                 height: 8, 
                                 borderRadius: '50%', 
                                 bgcolor: item.is_purchased ? 'success.main' : 'text.disabled' 
                             }} />
                        </Stack>
                    </Stack>

                    {/* Bottom Row: Metadata Tags */}
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
                        {item.inventory_item?.category && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                             <CategoryRoundedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                             <Typography variant="caption" color="text.secondary">{item.inventory_item.category.name}</Typography>
                          </Stack>
                        )}
                        <Typography variant="caption" color="text.disabled">·</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            {item.quantity} units
                        </Typography>
                        <Typography variant="caption" color="text.disabled">·</Typography>
                        <Typography variant="caption" color={item.actual_price ? 'primary.main' : 'text.secondary'} sx={{ fontWeight: 600 }}>
                            {item.actual_price ? formatCurrency(item.actual_price) : (item.planned_price ? formatCurrency(item.planned_price) : 'No price')}
                        </Typography>
                    </Stack>
                  </ListItem>
                  {index < visibleItems.length - 1 && <Divider />}
                </Box>
              ))}
            </List>

            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 2, pt: 1 }}
            >
                <Typography variant="caption" color="text.secondary">
                    Page {page} of {pageCount}
                </Typography>
                <Pagination
                    page={page}
                    count={pageCount}
                    color="primary"
                    size="small"
                    shape="rounded"
                    onChange={(_, value) => setPage(value)}
                    sx={{
                        '& .MuiPaginationItem-root': {
                            fontSize: '11px',
                            minWidth: 28,
                            height: 28
                        }
                    }}
                />
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
