import Grid from '@mui/material/Grid';
import PageHeader from '../../components/PageHeader';
import { useTrips } from '../../hooks/useTrips';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import TripsListSection from './sections/TripsListSection';

export default function TripsPage() {
  const tripsState = useTrips();
  const { isOnline } = useOfflineSync();

  return (
    <>
      <PageHeader
        eyebrow="Grocery Trips"
        title="Trips"
        description={`Local-first trip management. Sync status: ${isOnline ? 'online' : 'offline'}.`}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={12} sx={{ width: '100%' }}>
          <TripsListSection
            trips={tripsState.trips}
            loading={tripsState.loading}
            error={tripsState.error}
          />
        </Grid>
      </Grid>
    </>
  );
}
