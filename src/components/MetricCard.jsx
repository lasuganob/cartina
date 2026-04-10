import { Card, CardContent, Skeleton, Typography } from '@mui/material';

export default function MetricCard({ label, value, helper, loading = false }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '11px' }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width="70%" height={40} sx={{ mt: 1 }} />
        ) : (
          <Typography variant="h5" sx={{ fontSize: "21px", mt: 1 }}>
            {value}
          </Typography>
        )}
        {loading ? (
          <Skeleton variant="text" width="55%" height={24} sx={{ mt: 1 }} />
        ) : helper ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {helper}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
