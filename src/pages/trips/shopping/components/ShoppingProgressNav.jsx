import {
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import RemoveShoppingCartRoundedIcon from '@mui/icons-material/RemoveShoppingCartRounded';
import PauseCircleRoundedIcon from '@mui/icons-material/PauseCircleRounded';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { formatCurrency } from '../../../../utils/formatCurrency';

function formatTimer(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function ShoppingProgressNav({
  trip,
  metrics,
  isInProgress,
  actionsExpanded,
  setActionsExpanded,
  busy,
  draftItemsLength,
  elapsedMs,
  handleCheckout,
  handlePauseResume,
  handleBackToTrip,
  handleCancelTrip
}) {
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
        mb: { xs: 0, md: '-32px' },
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
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={700}>
                Shopping {isInProgress ? 'In Progress' : 'Paused'}
              </Typography>
              <IconButton
                aria-label={actionsExpanded ? 'Collapse trip actions' : 'Expand trip actions'}
                edge="end"
                size="small"
                onClick={() => setActionsExpanded((current) => !current)}
              >
                {actionsExpanded ? <ExpandMoreRoundedIcon /> : <ExpandLessRoundedIcon />}
              </IconButton>
            </Stack>
            <LinearProgress variant="determinate" value={metrics.progress} sx={{ height: 10, borderRadius: 999 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                {formatCurrency(metrics.subtotal)} / {formatCurrency(trip.budget)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                {Math.round(metrics.progress)}% checked
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Collapse in={actionsExpanded} timeout="auto" unmountOnExit>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Chip
                icon={<RemoveShoppingCartRoundedIcon />}
                label={`Timer ${formatTimer(elapsedMs)}`}
                variant="outlined"
              />
              <Chip
                label={busy ? 'Saving…' : 'Saved locally'}
                color={busy ? 'warning' : 'success'}
                variant="outlined"
              />
            </Stack>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Checked
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {metrics.checkedCount}/{draftItemsLength}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Unplanned items
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {metrics.unplannedCount}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {formatCurrency(metrics.subtotal)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Variance vs Planned
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={metrics.variance > 0 ? 'error.main' : metrics.variance < 0 ? 'success.main' : 'text.primary'}
                >
                  {metrics.variance > 0 ? '+' : metrics.variance < 0 ? '-' : '±'}
                  {formatCurrency(Math.abs(metrics.variance))}
                </Typography>
              </Grid>
            </Grid>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBackToTrip}
                  disabled={busy}
                  startIcon={<ArrowBackRoundedIcon />}
                  sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
                >
                  Back to Trip
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={handleCancelTrip}
                  disabled={busy}
                  startIcon={<CancelRoundedIcon />}
                  sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
                >
                  Cancel Trip
                </Button>
              </Grid>
            </Grid>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCheckout}
                  disabled={busy || !draftItemsLength}
                  startIcon={<CheckCircleRoundedIcon />}
                  sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
                >
                  Checkout
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handlePauseResume}
                  disabled={busy}
                  startIcon={
                    isInProgress ? <PauseCircleRoundedIcon /> : <PlayCircleFilledWhiteRoundedIcon />
                  }
                  sx={{ borderRadius: 1, py: 1.5, fontSize: '12px' }}
                >
                  {isInProgress ? 'Pause' : 'Resume'}
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
}
