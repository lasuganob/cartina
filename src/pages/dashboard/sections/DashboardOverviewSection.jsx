import { Alert, Button, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import EmptyState from '../../../components/EmptyState';
import StatusChip from '../../../components/StatusChip';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { NavLink } from 'react-router-dom';

export default function DashboardOverviewSection({ trips, loading, error }) {
  if (loading) {
    return (
      <Card sx={{ width: 500 }}>
        <CardContent>
          <Typography variant="body" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontWeight: 'bold', fontSize: '12px', letterSpacing: '2px' }}>  
            Upcoming Trips
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Skeleton variant="text" width="40%" height={28} />
                    <Skeleton variant="rounded" width={72} height={24} />
                  </Stack>
                  <Skeleton variant="text" width="75%" height={22} />
                </Stack>
              </Card>
            ))}
            <Skeleton variant="rounded" width="100%" height={36} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <Alert severity="warning">Using local data only: {error}</Alert>;
  }

  if (!trips.length) {
    return (
      <EmptyState
        title="No trips yet"
        description="Create your first grocery trip to start budgeting and syncing."
      />
    );
  }

  return (
    <Card sx={{ width: 500, minHeight: 300 }}>
      <CardContent>
        <Typography variant="body" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontWeight: 'bold', fontSize: '12px', letterSpacing: '2px' }}>  
          Upcoming Trips
        </Typography>
        <Stack spacing={2} sx={{ mt: 1}}>
          {trips.slice(0, 5).map((trip) => (
            <Card
              key={trip.id}
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={1}
              sx={{ p: 2}}
            >
              <Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1">{trip.name}</Typography>
                  <StatusChip status={trip.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(trip.planned_for)} • Budget: {formatCurrency(trip.budget)}
                </Typography>
              </Stack>
            </Card>
          ))}
          <Button
            variant="contained"
            component={NavLink}
            to="/trips"
            sx={{ mt: 2, width: '100%' }}
          >
            + Create New Trip
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
