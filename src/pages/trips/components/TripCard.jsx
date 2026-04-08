import { Card, CardContent, Stack, Typography } from '@mui/material';
import StatusChip from '../../../components/StatusChip';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export default function TripCard({ trip }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <div>
            <Typography variant="subtitle1">{trip.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Planned for {formatDate(trip.planned_for)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Budget {formatCurrency(trip.budget)} • Store ID {trip.store_id || 'Not assigned'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created {formatDate(trip.created_at)}{' '}
              {trip.completed_at ? `• Completed ${formatDate(trip.completed_at)}` : ''}
            </Typography>
          </div>
          <StatusChip status={trip.status} />
        </Stack>
      </CardContent>
    </Card>
  );
}
