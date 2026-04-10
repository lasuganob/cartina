import { Card, CardContent, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../../../../../utils/formatCurrency';

function getRemainingColor(remainingBudget) {
  if (remainingBudget < 0) {
    return 'error.main';
  }

  if (remainingBudget === 0) {
    return 'warning.main';
  }

  return 'white';
}

function getRemainingBgColor(remainingBudget) {
  if (remainingBudget < 0) {
    return 'error.main';
  }

  if (remainingBudget === 0) {
    return 'warning.main';
  }

  return 'rgb(74, 101, 85)';
}

export default function BudgetRunningTotal({ trip, plannedTotal, remainingBudget }) {
  const remainingBudgetPercentage = Math.min(100, (remainingBudget / trip.budget) * 100);
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
          >
            <div>
              <Typography variant="h6">Budget Running Total</Typography>
              <Typography variant="body2" color="text.secondary">
                Planned total updates as you edit the checklist.
              </Typography>
            </div>
            <Stack
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(2, 1fr)' }}
              gap={1}
            >
              <Chip label={`Budget ${formatCurrency(trip.budget)}`} variant="outlined" sx={{ display: { xs: "none", lg: "flex"} }} />
              <Chip
                label={`Remaining ${formatCurrency(remainingBudget)}`}
                sx={{
                  bgcolor: getRemainingBgColor(remainingBudget),
                  color: getRemainingColor(remainingBudget),
                  borderColor: 'divider',
                  display: { xs: "none", lg: "flex" }
                }}
                variant="outlined"
              />
            </Stack>
          </Stack>
          <Stack>
            <LinearProgress
              variant="determinate"
              value={remainingBudgetPercentage}
              sx={{ height: 10, mb: 2, borderRadius: 2, mb: 0.5 }}
            />
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                    {formatCurrency(plannedTotal)} / {formatCurrency(trip.budget)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {remainingBudgetPercentage.toFixed(0)}% of budget remaining
                </Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
