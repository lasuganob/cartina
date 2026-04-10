import { Button, Card, CardContent, Stack, Typography } from '@mui/material';

export default function QuickActionsCard({
  trip,
  busy,
  onStartTrip,
  onBuildChecklist,
  onMarkComplete,
  onArchiveTrip
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            onClick={onStartTrip}
            disabled={busy || trip.status === 'in_progress' || trip.status === 'completed'}
          >
            Start Trip
          </Button>
          <Button variant="outlined" onClick={onBuildChecklist} disabled={busy}>
            Build Checklist
          </Button>
          <Button
            variant="outlined"
            onClick={onMarkComplete}
            disabled={busy || trip.status === 'completed'}
          >
            Mark Complete
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onArchiveTrip}
            disabled={busy || trip.status === 'cancelled'}
          >
            Archive Trip
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
