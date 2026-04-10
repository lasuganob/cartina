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
  handlePauseResume
}) {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 100,
        mt: 3,
        mx: '-24px',
        px: '24px',
        py: 2,
        mb: '-32px',
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 -8px 24px rgba(15, 23, 42, 0.08)'
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6">Shopping {isInProgress ? "In Progress" : "Paused"}</Typography>
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
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(metrics.subtotal)} / {formatCurrency(trip.budget)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
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
                  variant="contained"
                  onClick={handleCheckout}
                  disabled={busy || !draftItemsLength}
                  startIcon={<CheckCircleRoundedIcon />}
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
                    trip.shopping_paused ? <PlayCircleFilledWhiteRoundedIcon /> : <PauseCircleRoundedIcon />
                  }
                >
                  {trip.shopping_paused ? 'Resume' : 'Pause'}
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
}
