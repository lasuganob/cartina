import {
  Alert,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';
import EmptyState from '../../../components/EmptyState';
import TripCard from '../components/TripCard';

export default function TripsListSection({ trips, loading, error }) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
          <Stack spacing={2}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Stack spacing={1} sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="35%" height={28} />
                      <Skeleton variant="text" width="50%" height={22} />
                      <Skeleton variant="text" width="65%" height={22} />
                      <Skeleton variant="text" width="55%" height={22} />
                    </Stack>
                    <Skeleton variant="rounded" width={88} height={28} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Trips Overview
        </Typography>
        {error ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Failed to refresh from GAS. Showing cached IndexedDB data.
          </Alert>
        ) : null}
        {!trips.length ? (
          <EmptyState
            title="No trips recorded"
            description="Add a trip from the form to populate the list."
          />
        ) : (
          <Stack spacing={2}>
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
