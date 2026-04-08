import { Grid, Card, Typography } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import MetricCard from '../../components/MetricCard';
import DashboardOverviewSection from './sections/DashboardOverviewSection';
import { useTrips } from '../../hooks/useTrips';
import { formatCurrency } from '../../utils/formatCurrency';

export default function DashboardPage() {
  const { stats, trips, loading, error } = useTrips();

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Track upcoming grocery trips, budgets, and offline sync readiness."
      />

      <Grid container spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
        <Grid item xs={12} md="auto">
          <DashboardOverviewSection trips={trips} loading={loading} error={error} />
        </Grid>

        <Grid item xs={12} md>
          <Card sx={{ p: 2 }}>
            <Typography
              variant="body"
              color="text.secondary"
              sx={{
                textTransform: 'uppercase',
                fontWeight: 'bold',
                fontSize: '12px',
                letterSpacing: '2px'
              }}
            >
              Trip Summary
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <MetricCard label="Planned Trips" value={stats.plannedTrips} loading={loading} />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard
                  label="Budget Allocated"
                  value={formatCurrency(stats.totalBudget)}
                  loading={loading}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard label="Completed Trips" value={stats.completedTrips} loading={loading} />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
