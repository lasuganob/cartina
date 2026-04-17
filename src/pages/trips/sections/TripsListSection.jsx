import {
  Alert,
  Button,
  Card,
  CardContent,
  Pagination,
  Skeleton,
  Stack,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../../components/EmptyState';
import TripCard from '../components/TripCard';
import { NavLink } from 'react-router-dom';

const PAGE_SIZE = 5;

export default function TripsListSection({ trips, loading, error }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(trips.length / PAGE_SIZE));
  const paginatedTrips = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return trips.slice(startIndex, startIndex + PAGE_SIZE);
  }, [page, trips]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Trips
            </Typography>
            <Skeleton variant="rounded" width={150} height={36} />
          </Stack>        
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
    <Card sx={{ width: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body1" fontWeight={700}>
            Trips
          </Typography>
          <Button
            variant="contained"
            component={NavLink}
            to="/trips/new"
            sx={{ borderRadius: 1, py: 1.5, px: 4, fontSize: '12px' }}
          >
            + Add Trip
          </Button>
        </Stack>        
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
          <>
            <Stack spacing={2}>
              {paginatedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </Stack>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              sx={{ mt: 3 }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, trips.length)} of{' '}
                {trips.length} trips
              </Typography>
              <Pagination
                page={page}
                count={totalPages}
                color="primary"
                onChange={(_, nextPage) => setPage(nextPage)}
              />
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
