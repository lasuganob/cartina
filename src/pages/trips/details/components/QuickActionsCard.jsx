import { Box, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';

export default function QuickActionsCard({
  trip,
  busy,
  onStartTrip,
  onBuildChecklist,
  onMarkComplete,
  onArchiveTrip
}) {
  return (
    <Box
      sx={{ 
        position: 'sticky', 
        bottom: 0, 
        zIndex: 100,
        mt: 3,
        p: 2,
        mx: '-24px',
        px: '24px',
        mb: '-32px',
        pb: '32px',
        bgcolor: 'white',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <Typography variant="h6" sx={{ textTransform: "uppercase", fontSize: "14px", letterSpacing: "1px", mb: 1 }}>
        Quick Actions
      </Typography>
      <Grid spacing={1.5} container>
        <Grid size={{ xs: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onStartTrip}
            disabled={busy || trip.status === 'in_progress' || trip.status === 'completed'}
            startIcon={<PlayCircleFilledWhiteRoundedIcon />}
            sx={{ fontSize: "12px" }}
          >
            Start Trip
          </Button>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onBuildChecklist}
            disabled={busy}
            startIcon={<BorderColorRoundedIcon />}
            sx={{ fontSize: "12px" }}
          >
            Checklist
          </Button>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onMarkComplete}
            disabled={busy || trip.status === 'completed'}
            startIcon={<CheckCircleRoundedIcon />}
            sx={{ fontSize: "12px" }}
          >
            Mark Complete
          </Button>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onArchiveTrip}
            disabled={busy || trip.status === 'cancelled'}
            startIcon={<ArchiveRoundedIcon />}
            sx={{ fontSize: "12px" }}
          >
            Archive Trip
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
