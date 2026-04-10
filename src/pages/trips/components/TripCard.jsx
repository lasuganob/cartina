import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import StatusChip from '../../../components/StatusChip';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { NavLink } from 'react-router-dom';

export default function TripCard({ trip }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1}>
              <Typography variant="subtitle1">{trip.name}</Typography>
              <StatusChip status={trip.status} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Planned for: {formatDate(trip.planned_for)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Budget: {formatCurrency(trip.budget)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Store: {trip.store?.name || 'Not assigned'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items: {trip.items.length}
            </Typography>
          </Box>

          <Box>
            <Button
              variant="contained"
              component={NavLink}
              to={`/trips/${trip.id}`}
              sx={{ textTransform: "none", mr: 1, backgroundColor: "#007bff"}}
            >
              View
            </Button>
            <Button
              variant="contained"
              component={NavLink}
              sx={{ textTransform: "none", backgroundColor: "#dc3545"}}
            >
              Delete
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
