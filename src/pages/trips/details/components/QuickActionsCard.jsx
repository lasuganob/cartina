import { Box, Button, Grid } from '@mui/material';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import PauseCircleFilledRoundedIcon from '@mui/icons-material/PauseCircleFilledRounded';
import { styles } from './styles';

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
            sx={styles.quickActionButton}
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
            sx={styles.quickActionButton}
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
            sx={styles.quickActionButton}
          >
            Archive Trip
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
