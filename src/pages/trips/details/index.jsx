import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import StatusChip from '../../../components/StatusChip';
import { useTrips } from '../../../hooks/useTrips';
import BudgetSnapshotCard from './components/BudgetSnapshotCard';
import BuildChecklistDialog from './components/BuildChecklistDialog';
import ChecklistPreviewCard from './components/ChecklistPreviewCard';
import DetailSkeleton from './components/DetailSkeleton';
import QuickActionsCard from './components/QuickActionsCard';
import TripDetailsCard from './components/TripDetailsCard';

export default function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { trips, loading, error, updateTrip, replaceTripChecklist } = useTrips();
  const [busy, setBusy] = useState(false);
  const [checklistDialogOpen, setChecklistDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

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
    setChecklistDialogOpen(true);
  }

  async function handleArchiveTrip() {
    setBusy(true);
    try {
      await updateTrip(trip.id, {
        status: 'archived',
        archived_at: new Date().toISOString()
      });
      setArchiveDialogOpen(false);
    } finally {
      setBusy(false);
    }
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
            <Button
              component={NavLink}
              to="/trips"
              variant="contained"
              sx={{ borderRadius: 1, fontSize: '12px', py: 1.25 }}
            >
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
      </Grid>
      <QuickActionsCard
        trip={trip}
        busy={busy}
        onStartTrip={() => navigate(`/trips/${trip.id}/shopping`)}
        onBuildChecklist={handleBuildChecklist}
        onArchiveTrip={() => setArchiveDialogOpen(true)}
      />
      <BuildChecklistDialog
        open={checklistDialogOpen}
        trip={trip}
        busy={busy}
        onClose={() => setChecklistDialogOpen(false)}
        onSave={async (items) => {
          setBusy(true);
          try {
            await replaceTripChecklist(trip.id, items);
            setChecklistDialogOpen(false);
          } finally {
            setBusy(false);
          }
        }}
      />
      <Dialog open={archiveDialogOpen} onClose={() => !busy && setArchiveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Archive Trip</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Archived trips stay viewable but are excluded from dashboard totals and cannot be restored.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleArchiveTrip} color="error" variant="contained" disabled={busy}>
            Archive
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
