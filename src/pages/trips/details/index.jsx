import { useState } from 'react';
import { Alert, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { NavLink, useParams } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import StatusChip from '../../../components/StatusChip';
import { useAppContext } from '../../../context/AppContext';
import { useTrips } from '../../../hooks/useTrips';
import BudgetSnapshotCard from './components/BudgetSnapshotCard';
import ChecklistPreviewCard from './components/ChecklistPreviewCard';
import DetailSkeleton from './components/DetailSkeleton';
import QuickActionsCard from './components/QuickActionsCard';
import TripDetailsCard from './components/TripDetailsCard';

export default function TripDetailsPage() {
  const { tripId } = useParams();
  const { showSnackbar } = useAppContext();
  const { trips, loading, error, updateTrip } = useTrips();
  const [busy, setBusy] = useState(false);

  const trip = trips.find((item) => String(item.id) === String(tripId));

  async function handleSaveDetails(values) {
    setBusy(true);
    try {
      await updateTrip(trip.id, values);
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(status) {
    setBusy(true);
    try {
      await updateTrip(trip.id, {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : ''
      });
    } finally {
      setBusy(false);
    }
  }

  function handleBuildChecklist() {
    showSnackbar('Checklist builder is the next page to implement.', 'info');
  }

  function handleArchiveTrip() {
    showSnackbar('Archive flow is not implemented yet. Use cancelled status if needed.', 'info');
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Trip Details"
          description="Loading trip details."
        />
        <DetailSkeleton />
      </>
    );
  }

  if (!trip) {
    return (
      <>
        <PageHeader
          eyebrow="Grocery Trips"
          title="Trip Not Found"
          description="The requested trip does not exist in local storage."
          action={
            <Button component={NavLink} to="/trips" variant="contained">
              Back to Trips
            </Button>
          }
        />
        <Alert severity="warning">No trip matched ID `{tripId}`.</Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<StatusChip status={trip.status} />}
        title={trip.name}
        description={trip.note}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button component={NavLink} to="/trips" variant="contained">
              Back to Trips
            </Button>
          </Stack>
        }
      />

      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Failed to refresh from GAS. Showing cached IndexedDB data.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <Stack spacing={3}>
            <TripDetailsCard trip={trip} saving={busy} onSave={handleSaveDetails} />
            <ChecklistPreviewCard items={trip.items} onBuildChecklist={handleBuildChecklist} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack spacing={3}>
            <QuickActionsCard
              trip={trip}
              busy={busy}
              onStartTrip={() => handleStatusChange('in_progress')}
              onBuildChecklist={handleBuildChecklist}
              onMarkComplete={() => handleStatusChange('completed')}
              onArchiveTrip={handleArchiveTrip}
            />
            <BudgetSnapshotCard trip={trip} />
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Trip Context
                </Typography>
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Store: {trip.store?.name || 'Not assigned'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Checklist items: {trip.items.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Purchased items: {trip.items.filter((item) => item.is_purchased).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unplanned items: {trip.items.filter((item) => item.is_unplanned).length}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
