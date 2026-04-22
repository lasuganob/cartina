import Grid from '@mui/material/Grid';
import PageHeader from '../../components/PageHeader';
import { useTrips } from '../../hooks/useTrips';
import { useAppContext } from '../../context/AppContext';
import TripsListSection from './sections/TripsListSection';

export default function TripsPage() {
  const tripsState = useTrips();
  const { syncState } = useAppContext();
  const { isOnline } = syncState;

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
