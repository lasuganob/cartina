import { Card, CardContent, Stack, Typography } from '@mui/material';
import { formatCurrency } from '../../../../utils/formatCurrency';

export default function BudgetSnapshotCard({ trip }) {
  const plannedTotal = trip.items.reduce((sum, item) => sum + Number(item.planned_price || 0), 0);
  const actualTotal = trip.items.reduce((sum, item) => sum + Number(item.actual_price || 0), 0);
  const remainingBudget = trip.budget - actualTotal;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Budget Snapshot
        </Typography>
        <Stack spacing={2}>
          <div>
            <Typography variant="body2" color="text.secondary">
              Trip Budget
            </Typography>
            <Typography variant="body1">{formatCurrency(trip.budget)}</Typography>
          </div>
          <div>
            <Typography variant="body2" color="text.secondary">
              Planned Checklist Total
            </Typography>
            <Typography variant="body1">{formatCurrency(plannedTotal)}</Typography>
          </div>
          <div>
            <Typography variant="body2" color="text.secondary">
              Actual Spend
            </Typography>
            <Typography variant="body1">{formatCurrency(actualTotal)}</Typography>
          </div>
          <div>
            <Typography variant="body2" color="text.secondary">
              Remaining Budget
            </Typography>
            <Typography variant="body1">{formatCurrency(remainingBudget)}</Typography>
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
}
