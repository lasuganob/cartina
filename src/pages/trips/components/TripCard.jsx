import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import StatusChip from '../../../components/StatusChip';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { useNavigate } from 'react-router-dom';

export default function TripCard({ trip, sx = {} }) {
  const navigate = useNavigate();

  return (
    <Card 
      variant="outlined"
      onClick={() => navigate(`/trips/${trip.id}`)}
      sx={{ 
        position: 'relative',
        cursor: 'pointer', 
        '&:hover': { backgroundColor: 'action.hover' },
        transition: 'background-color 0.2s',
        ...sx
      }}
    >
      <CardContent>
        <Box sx={{ pr: 4 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body1" fontWeight="bold">
              {trip.name}
            </Typography>
            <StatusChip status={trip.status} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {formatDate(trip.planned_for)}
            </Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {formatCurrency(trip.budget)}
            </Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {trip.store?.name || 'No store'}
            </Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {trip.items ? trip.items.length : 0} items
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
