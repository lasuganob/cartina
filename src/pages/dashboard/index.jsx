import { Grid, Card, Typography, Stack } from '@mui/material';
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
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardOverviewSection trips={trips} loading={loading} error={error} />
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
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

            <Stack>
              <Stack>
                <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: "30px" }}>{formatCurrency(stats.totalBudget)}</Typography>
                <Typography variant="body" sx={{ fontSize: "12px", color: "text.secondary", mt: -1 }}>Budget Allocated</Typography>
              </Stack>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6 }}>
                  <MetricCard label="Planned Trips" value={stats.plannedTrips} loading={loading} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <MetricCard label="Completed Trips" value={stats.completedTrips} loading={loading} />
                </Grid>
              </Grid>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
