import { Box, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import PauseCircleFilledRoundedIcon from '@mui/icons-material/PauseCircleFilledRounded';

export default function QuickActionsCard({
  trip,
  busy,
  onStartTrip,
  onBuildChecklist,
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
        mb: '-24px',
        pb: '24px',
        bgcolor: 'white',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <Grid spacing={1.5} container>
        <Grid size={{ xs: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onStartTrip}
            disabled={busy || trip.status === 'completed' || trip.status === 'archived'}
            startIcon={trip.status === 'in_progress' ? <PauseCircleFilledRoundedIcon /> : <PlayCircleFilledWhiteRoundedIcon />}
            sx={{ fontSize: "12px" }}
          >
            {trip.status === 'in_progress' ? 'Resume Trip' : 'Start Trip'}
          </Button>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onBuildChecklist}
            disabled={busy || trip.status === 'completed' || trip.status === 'archived'}
            startIcon={<BorderColorRoundedIcon />}
            sx={{ fontSize: "12px" }}
          >
            Checklist
          </Button>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onArchiveTrip}
            disabled={busy || trip.status === 'archived'}
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
