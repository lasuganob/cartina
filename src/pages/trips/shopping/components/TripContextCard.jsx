import { Card, CardContent, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../../../../utils/formatCurrency';

export default function TripContextCard({ trip, metrics }) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">Trip Context</Typography>
          <Typography variant="body2" color="text.secondary">
            Budget: {formatCurrency(trip.budget)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Planned spend: {formatCurrency(metrics.plannedTotal)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Remaining budget: {formatCurrency(trip.budget - metrics.subtotal)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
