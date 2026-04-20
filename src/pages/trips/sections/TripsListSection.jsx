import {
  Alert,
  Box,
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
 
const HistoryCategory = ({ title, trips, page, setPage }) => {
  if (trips.length === 0) return null;
 
  const totalPages = Math.ceil(trips.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginated = trips.slice(startIndex, startIndex + PAGE_SIZE);
 
  return (
    <Box sx={{ mb: 4, '&:last-child': { mb: 0 } }}>
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        sx={{
          textTransform: 'uppercase',
          letterSpacing: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          px: 0.5
        }}
      >
        <span>{title}</span>
        <Box component="span" sx={{ opacity: 0.6, fontSize: '10px' }}>
          {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
        </Box>
      </Typography>
      <Stack spacing={2}>
        {paginated.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </Stack>
      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
          <Pagination
            size="small"
            page={page}
            count={totalPages}
            color="primary"
            onChange={(_, nextPage) => setPage(nextPage)}
          />
        </Stack>
      )}
    </Box>
  );
};

export default function TripsListSection({ trips, loading, error }) {
  const [plannedPage, setPlannedPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [cancelledPage, setCancelledPage] = useState(1);
  const [archivedPage, setArchivedPage] = useState(1);

  const activeTrips = useMemo(() => trips.filter(t => t.status === 'in_progress'), [trips]);
  const cancelledTrips = useMemo(() => trips.filter(t => t.status === 'cancelled'), [trips]);
  const archivedTrips = useMemo(() => trips.filter(t => t.status === 'archived'), [trips]);
  const completedTrips = useMemo(() => trips.filter(t => t.status === 'completed'), [trips]);
  const plannedTrips = useMemo(() => trips.filter(t => t.status === 'planned'), [trips]);





  if (loading) {
    return (
      <Stack spacing={3}>
        {/* Skeleton for Active Trip if it might exist */}
        <Card variant="outlined" sx={{ border: '1px dashed', borderColor: 'primary.main' }}>
           <CardContent>
             <Skeleton variant="text" width="60%" height={32} />
             <Skeleton variant="text" width="40%" height={24} />
           </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Trips History
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
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {/* ── Active Section ── */}
      {activeTrips.length > 0 && (
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', animation: 'pulse 1.5s infinite' }} />
            <Typography variant="body1" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              In Progress
            </Typography>
          </Stack>
          <Stack spacing={2}>
            {activeTrips.map(trip => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'primary.main',
                  boxShadow: '0 4px 12px rgba(74, 101, 85, 0.1)'
                }}
              />
            ))}
          </Stack>
          <style>
             {`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }`}
          </style>
        </Stack>
      )}

      {/* ── History Section ── */}
      <Card sx={{ width: '100%' }}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" fontWeight={700}>
              Trips History
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
            <Box sx={{ mt: 2 }}>
              <HistoryCategory title="Planned" trips={plannedTrips} page={plannedPage} setPage={setPlannedPage} />
              <HistoryCategory title="Completed" trips={completedTrips} page={completedPage} setPage={setCompletedPage} />
              <HistoryCategory title="Cancelled" trips={cancelledTrips} page={cancelledPage} setPage={setCancelledPage} />
              <HistoryCategory title="Archived" trips={archivedTrips} page={archivedPage} setPage={setArchivedPage} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
