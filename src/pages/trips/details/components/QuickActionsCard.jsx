import { useState } from 'react';

import { Box, Button, Collapse, Grid, IconButton, Stack } from '@mui/material';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded';
import PauseCircleFilledRoundedIcon from '@mui/icons-material/PauseCircleFilledRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { styles } from './styles';

export default function QuickActionsCard({
  trip,
  busy,
  onStartTrip,
  onBuildChecklist,
  onArchiveTrip,
  onDuplicateTrip
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Box
      sx={{
        position: { xs: 'fixed', md: 'sticky' },
        bottom: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 0 },
        left: { xs: 0, md: 'auto' },
        right: { xs: 0, md: 'auto' },
        zIndex: { xs: 1100, md: 100 },
        mt: { xs: 0, md: 3 },
        mx: { xs: 0, md: '-24px' },
        mb: { xs: 0, md: '-32px' }
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            aria-label={expanded ? 'Collapse quick actions' : 'Expand quick actions'}
            edge="end"
            size="small"
            onClick={() => setExpanded((current) => !current)}
            sx={{ backgroundColor: 'background.paper', borderRadius: 0,  borderTopLeftRadius: 16 , mb: "-15px" }}
          >
            {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          </IconButton>
        </Box>

        <Box
          sx={{ 
            px: { xs: 2.5, md: '24px' },
            py: 2,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            boxShadow: {
                xs: '0 -8px 24px rgba(0, 0, 0, 0.12)',
                md: '0 -8px 24px rgba(15, 23, 42, 0.08)'
            }
          }}
        >
          <Grid spacing={1.5} container>
            <Grid size={{ xs: 12 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={onStartTrip}
                disabled={busy || trip.status === 'completed' || trip.status === 'cancelled' || trip.status === 'archived' || !trip.items?.length}
                startIcon={trip.status === 'in_progress' ? <PauseCircleFilledRoundedIcon /> : <PlayCircleFilledWhiteRoundedIcon />}
                sx={styles.quickActionButton}
              >
                {trip.status === 'in_progress' ? 'Resume Trip' : 'Start Trip'}
              </Button>
            </Grid>
          </Grid>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Grid spacing={1.5} container sx={{ mt: 1.5 }}>
              <Grid size={{ xs: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onBuildChecklist}
                  disabled={busy || trip.status === 'completed' || trip.status === 'cancelled' || trip.status === 'archived'}
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
              <Grid size={{ xs: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={onDuplicateTrip}
                  disabled={busy || trip.status === 'archived'}
                  startIcon={<ContentCopyRoundedIcon />}
                  sx={styles.quickActionButton}
                >
                  Duplicate
                </Button>
              </Grid>
            </Grid>
          </Collapse>
        </Box>
      </Stack>
    </Box>
  );
}
