import { Box, Grid, Card, CardContent, CardActionArea, LinearProgress, Stack, Typography, Chip } from '@mui/material';
import { NavLink } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PageHeader from '../../components/PageHeader';
import { useTrips } from '../../hooks/useTrips';
import { formatCurrency } from '../../utils/formatCurrency';
import StatusChip from '../../components/StatusChip';

dayjs.extend(relativeTime);

const getGreeting = () => {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function KpiCard({ label, value, sub, color }) {
  return (
    <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }} elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 1, display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color: color || 'text.primary', mb: 0.5, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
          {sub}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { stats, trips, loading } = useTrips();

  const inProgressTrips = trips.filter((t) => t.status === 'in_progress');
  const upcomingTrips = trips
    .filter((t) => t.status === 'planned')
    .sort((a, b) => dayjs(a.planned_for).diff(dayjs(b.planned_for)))
    .slice(0, 3);

  const budgetUtilization = stats.totalBudget > 0
    ? Math.min(100, (stats.totalActualSpend / stats.totalBudget) * 100)
    : 0;

  return (
    <>
      <PageHeader
        eyebrow={dayjs().format('dddd, MMMM D, YYYY')}
        title={getGreeting()}
        description="Track upcoming grocery trips, budgets, and spending at a glance."
      />

      {/* KPI Row */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { 
            label: 'This Month', 
            value: formatCurrency(stats.thisMonthSpend), 
            sub: 'total spent', 
            color: '#1a2e2a' 
          },
          { 
            label: 'Trips', 
            value: stats.tripsLast30Days, 
            sub: 'last 30 days', 
            color: '#2d6a4f' 
          },
          { 
            label: 'Avg per Trip', 
            value: formatCurrency(Math.round(stats.avgActualSpend)), 
            sub: `vs ${formatCurrency(Math.round(stats.avgPlannedSpend))} planned`, 
            color: '#b07d48' 
          },
          { 
            label: 'Savings', 
            value: formatCurrency(stats.savingsVsPlan), 
            sub: 'vs planned total', 
            color: '#4f772d' 
          },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 6, md: 'auto' }} sx={{ flex: { md: 1 } }}>
            <KpiCard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} alignItems="flex-start">

        {/* Left: Active + Upcoming Trips */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>

            {/* In-Progress Trips */}
            {inProgressTrips.length > 0 && (
              <Box>
                <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, display: 'block' }}>
                  🛒 Active Shopping
                </Typography>
                <Stack spacing={1.5}>
                  {inProgressTrips.map((trip) => {
                    const items = trip.items || [];
                    const purchased = items.filter((i) => i.is_purchased).length;
                    const progress = items.length ? Math.round((purchased / items.length) * 100) : 0;
                    return (
                      <Card key={trip.id} sx={{ borderRadius: 3, border: '2px solid', borderColor: 'warning.main' }} elevation={0}>
                        <CardActionArea component={NavLink} to={`/trips/${trip.id}/shopping`} sx={{ p: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>{trip.name}</Typography>
                            <StatusChip status={trip.status} />
                          </Stack>
                          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 999, mb: 0.75 }} />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">{purchased}/{items.length} items</Typography>
                            <Typography variant="caption" color="text.secondary">{progress}% done</Typography>
                          </Stack>
                        </CardActionArea>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Upcoming Planned */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5, display: 'block' }}>
                Upcoming Trips
              </Typography>
              {upcomingTrips.length === 0 ? (
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No upcoming trips planned.</Typography>
                  </CardContent>
                </Card>
              ) : (
                <Stack spacing={1.5}>
                  {upcomingTrips.map((trip) => {
                    const daysUntil = dayjs(trip.planned_for).diff(dayjs(), 'day');
                    return (
                      <Card key={trip.id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                        <CardActionArea component={NavLink} to={`/trips/${trip.id}`} sx={{ p: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>{trip.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dayjs(trip.planned_for).format('MMM D, YYYY')} · {formatCurrency(trip.budget)}
                              </Typography>
                            </Box>
                            <Chip
                              label={daysUntil === 0 ? 'Today' : daysUntil < 0 ? 'Overdue' : `in ${daysUntil}d`}
                              size="small"
                              color={daysUntil < 0 ? 'error' : daysUntil === 0 ? 'warning' : 'default'}
                              sx={{ fontWeight: 600, fontSize: '11px' }}
                            />
                          </Stack>
                          {trip.items?.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {trip.items.length} items in checklist
                            </Typography>
                          )}
                        </CardActionArea>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Stack>
        </Grid>

        {/* Right: Spending + Last Trip */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>

            {/* Budget Utilization */}
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 2 }}>Spending Overview</Typography>
                <Stack spacing={0.75} sx={{ mb: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Budget Utilization</Typography>
                    <Typography variant="caption" fontWeight={600}>{Math.round(budgetUtilization)}%</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={budgetUtilization}
                    color={budgetUtilization > 90 ? 'error' : budgetUtilization > 70 ? 'warning' : 'primary'}
                    sx={{ height: 8, borderRadius: 999 }}
                  />
                </Stack>

                <Stack spacing={1.5}>
                  {[
                    { label: 'Total Budget Allocated', value: formatCurrency(stats.totalBudget), color: 'text.primary' },
                    { label: 'Total Planned Spend', value: formatCurrency(stats.totalPlannedSpend), color: 'text.secondary' },
                    { label: 'Total Actual Spend', value: formatCurrency(stats.totalActualSpend), color: stats.totalActualSpend > stats.totalPlannedSpend ? 'error.main' : 'success.main' },
                    { label: 'Net Savings', value: `${stats.savingsVsPlan >= 0 ? '+' : '-'}${formatCurrency(Math.abs(stats.savingsVsPlan))}`, color: stats.savingsVsPlan >= 0 ? 'success.main' : 'error.main' },
                  ].map(({ label, value, color }) => (
                    <Stack key={label} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="caption" fontWeight={700} color={color}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Last Completed Trip */}
            {stats.lastCompletedTrip && (
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>Last Completed Trip</Typography>
                  <CardActionArea component={NavLink} to={`/trips/${stats.lastCompletedTrip.id}`} sx={{ borderRadius: 2, p: 1.5, mx: -1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600}>{stats.lastCompletedTrip.name}</Typography>
                      <StatusChip status={stats.lastCompletedTrip.status} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Completed {dayjs(stats.lastCompletedTrip.completed_at).fromNow()}
                    </Typography>
                    {stats.lastCompletedTrip.items?.length > 0 && (() => {
                      const items = stats.lastCompletedTrip.items;
                      const actual = items.reduce((s, i) => s + Number(i.actual_price || 0) * Number(i.quantity || 1), 0);
                      return (
                        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Spent</Typography>
                            <Typography variant="body2" fontWeight={700}>{formatCurrency(actual)}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Budget</Typography>
                            <Typography variant="body2" fontWeight={700}>{formatCurrency(stats.lastCompletedTrip.budget)}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Items</Typography>
                            <Typography variant="body2" fontWeight={700}>{items.filter(i => i.is_purchased).length}/{items.length}</Typography>
                          </Box>
                        </Stack>
                      );
                    })()}
                  </CardActionArea>
                </CardContent>
              </Card>
            )}

          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
