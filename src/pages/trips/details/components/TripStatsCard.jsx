import { Box, Card, CardContent, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../../../../utils/formatCurrency';

function formatTimer(ms) {
  const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function StatBox({ label, value, sub, color }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700} color={color || 'text.primary'} noWrap>
        {value}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">{sub}</Typography>
      )}
    </Box>
  );
}

export default function TripStatsCard({ trip }) {
  const items = trip.items || [];
  const purchased  = items.filter((i) => i.is_purchased);
  const unplanned  = items.filter((i) => i.is_unplanned);
  const progress   = items.length ? Math.round((purchased.length / items.length) * 100) : 0;

  const plannedTotal = items.reduce((s, i) => s + Number(i.planned_price || 0) * Number(i.quantity || 1), 0);
  const actualTotal  = items.reduce((s, i) => s + Number(i.actual_price  || 0) * Number(i.quantity || 1), 0);
  const remaining    = trip.budget - actualTotal;
  const variance     = actualTotal - plannedTotal;
  const showSpend    = trip.status === 'in_progress' || trip.status === 'completed';

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="body1" fontWeight={700} sx={{ mb: 2 }}>
          Trip Summary
        </Typography>

        {/* Item Progress */}
        <Stack spacing={0.75} sx={{ mb: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              Items Checked
            </Typography>
            <Typography variant="caption" fontWeight={600}>
              {purchased.length} / {items.length}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 999, bgcolor: 'action.selected' }}
          />
        </Stack>

        {/* Stats Row */}
        <Stack direction="row" spacing={2} divider={<Box sx={{ width: 1, bgcolor: 'divider' }} />} flexWrap="wrap">
          <StatBox
            label="Completion"
            value={`${progress}%`}
            sub={`${purchased.length} purchased`}
          />
          <StatBox
            label="Unplanned"
            value={unplanned.length}
            sub="extra items"
            color={unplanned.length > 0 ? 'warning.main' : undefined}
          />
          <StatBox
            label="Time Spent"
            value={formatTimer(trip.elapsed_ms)}
          />
        </Stack>

        {/* Budget Breakdown */}
        {(trip.budget > 0 || showSpend) && (
          <Box sx={{ mt: 2.5 }}>
            <Stack direction="row" spacing={0} sx={{ borderRadius: 2, overflow: 'hidden', height: 6, mb: 1.5 }}>
              {/* actual spend bar */}
              <Box
                sx={{
                  width: `${Math.min(100, trip.budget > 0 ? (actualTotal / trip.budget) * 100 : 0)}%`,
                  bgcolor: remaining < 0 ? 'error.main' : 'primary.main',
                  transition: 'width 0.4s ease',
                }}
              />
              <Box sx={{ flex: 1, bgcolor: 'action.selected' }} />
            </Stack>

            <Grid container spacing={2} >
              <Grid size={{ xs: 6 }}>
                <StatBox
                  label="Budget"
                  value={formatCurrency(trip.budget)}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <StatBox
                  label="Planned"
                  value={formatCurrency(plannedTotal)}
                  color={plannedTotal > trip.budget ? 'warning.main' : undefined}
                />
              </Grid>
              {showSpend && (
                <>
                  <Grid size={{ xs: 6 }}>
                    <StatBox
                      label="Actual Spend"
                      value={formatCurrency(actualTotal)}
                      color={actualTotal > trip.budget ? 'error.main' : 'success.main'}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <StatBox
                      label="Remaining"
                      value={formatCurrency(remaining)}
                      color={remaining < 0 ? 'error.main' : 'success.main'}
                      sub={variance !== 0 ? `${variance > 0 ? '+' : ''}${formatCurrency(variance)} vs planned` : undefined}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
