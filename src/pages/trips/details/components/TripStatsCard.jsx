import { Card, CardContent, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PlaylistAddCheckRoundedIcon from '@mui/icons-material/PlaylistAddCheckRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import WalletRoundedIcon from '@mui/icons-material/WalletRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import { formatCurrency } from '../../../../utils/formatCurrency';

function formatTimer(ms) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function MetricCard({ icon, label, value, hint, color }) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        p: 1.25,
        minWidth: 0,
        borderRadius: 2,
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center">
        {icon}
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Stack>
      <Typography variant="subtitle2" fontWeight={700} color={color || 'text.primary'} noWrap>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary" noWrap>
          {hint}
        </Typography>
      ) : null}
    </Stack>
  );
}

export default function TripStatsCard({ trip }) {
  const items = trip.items || [];
  const purchased = items.filter((i) => i.is_purchased);
  const unplanned = items.filter((i) => i.is_unplanned);
  const adhoc = items.filter((i) => i.is_ad_hoc);
  const progress = items.length ? Math.round((purchased.length / items.length) * 100) : 0;

  const plannedTotal = items.reduce((s, i) => s + Number(i.planned_price || 0) * Number(i.quantity || 1), 0);
  const actualTotal = items.reduce((s, i) => s + Number(i.actual_price || 0) * Number(i.quantity || 1), 0);
  const remaining = trip.budget - actualTotal;
  const variance = actualTotal - plannedTotal;
  const showSpend = trip.status === 'in_progress' || trip.status === 'completed';
  const spendProgress = Math.min(100, trip.budget > 0 ? (actualTotal / trip.budget) * 100 : 0);

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack spacing={1.5}>
          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Typography variant="body1" fontWeight={700}>
                Trip Summary
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {purchased.length}/{items.length || 0} items
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  Completion
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 999, bgcolor: 'action.selected' }}
              />
            </Stack>
          </Stack>

          <Grid container spacing={1}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                icon={<CheckCircleRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />}
                label="Checked"
                value={`${progress}%`}
                hint={`${purchased.length} purchased`}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                icon={<PlaylistAddCheckRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                label="Planned"
                value={items.length - unplanned.length}
                hint={`${adhoc.length} custom`}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                icon={<AddShoppingCartRoundedIcon sx={{ fontSize: 16, color: unplanned.length > 0 ? 'warning.main' : 'text.secondary' }} />}
                label="Unplanned"
                value={unplanned.length}
                hint="Spontaneous"
                color={unplanned.length > 0 ? 'warning.main' : undefined}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                icon={<ScheduleRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                label="Time"
                hint="Elapsed"
                value={formatTimer(trip.elapsed_ms)}
              />
            </Grid>
          </Grid>

          {(trip.budget > 0 || showSpend) && (
            <Stack
              spacing={1.25}
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Budget usage
                  </Typography>
                  <Typography variant="caption" fontWeight={700} color={remaining < 0 ? 'error.main' : 'text.primary'}>
                    {trip.budget > 0 ? `${Math.round((actualTotal / trip.budget) * 100)}%` : '0%'}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={spendProgress}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: 'action.selected',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      bgcolor: remaining < 0 ? 'error.main' : 'primary.main'
                    }
                  }}
                />
              </Stack>

              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <MetricCard
                    icon={<WalletRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                    label="Budget"
                    value={formatCurrency(trip.budget)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <MetricCard
                    icon={<TrendingUpRoundedIcon sx={{ fontSize: 16, color: plannedTotal > trip.budget ? 'warning.main' : 'text.secondary' }} />}
                    label="Planned"
                    value={formatCurrency(plannedTotal)}
                    color={plannedTotal > trip.budget ? 'warning.main' : undefined}
                  />
                </Grid>
                {showSpend ? (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <MetricCard
                        icon={<ReceiptLongRoundedIcon sx={{ fontSize: 16, color: actualTotal > trip.budget ? 'error.main' : 'success.main' }} />}
                        label="Actual"
                        value={formatCurrency(actualTotal)}
                        color={actualTotal > trip.budget ? 'error.main' : 'success.main'}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <MetricCard
                        icon={<SavingsRoundedIcon sx={{ fontSize: 16, color: remaining < 0 ? 'error.main' : 'success.main' }} />}
                        label="Remaining"
                        value={formatCurrency(remaining)}
                        hint={variance !== 0 ? `${variance > 0 ? '+' : ''}${formatCurrency(variance)} vs planned` : undefined}
                        color={remaining < 0 ? 'error.main' : 'success.main'}
                      />
                    </Grid>
                  </>
                ) : null}
              </Grid>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
