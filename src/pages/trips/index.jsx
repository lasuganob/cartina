import Grid from '@mui/material/Grid';
import PageHeader from '../../components/PageHeader';
import { useTrips } from '../../hooks/useTrips';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import AddTripSection from './sections/AddTripSection';
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
        <Grid item xs={12} md={5}>
          <AddTripSection onSubmit={tripsState.addTrip} />
        </Grid>
        <Grid item xs={12} md={7}>
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
