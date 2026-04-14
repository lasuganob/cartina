import { Box, Card, CardContent, Grid, Skeleton, Stack } from '@mui/material';

export default function DetailSkeleton() {
  return (
    <Grid container spacing={3}>
      {/* Left Column - 75% width on desktop */}
      <Grid size={{ xs: 12, lg: 9 }}>
        <Stack spacing={3}>
          {/* TripDetailsCard Skeleton */}
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Skeleton variant="text" width={120} height={32} />
                <Skeleton variant="rounded" width={64} height={36} />
              </Stack>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Skeleton variant="rounded" width="100%" height={56} />
                </Grid>
                <Grid size={{ xs: 5 }}>
                  <Skeleton variant="rounded" width="100%" height={56} />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Skeleton variant="rounded" width="100%" height={56} />
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Skeleton variant="rounded" width="100%" height={56} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Skeleton variant="rounded" width="100%" height={80} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ChecklistPreviewCard Skeleton */}
          <Card>
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Skeleton variant="text" width={180} height={32} />
                <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 4 }} />
              </Stack>
              <Stack spacing={2}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        spacing={2}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Skeleton variant="text" width="40%" height={28} />
                            <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: 4 }} />
                          </Stack>
                          <Skeleton variant="text" width="30%" height={20} />
                          <Skeleton variant="text" width="25%" height={20} />
                          <Skeleton variant="text" width="35%" height={20} />
                          <Skeleton variant="text" width="40%" height={20} />
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <Skeleton variant="rounded" width={68} height={24} sx={{ borderRadius: 4 }} />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      {/* Right Column - 25% width on desktop */}
      <Grid size={{ xs: 12, lg: 3 }}>
        <Stack spacing={3}>
          {/* BudgetSnapshotCard Skeleton */}
          <Card>
            <CardContent>
              <Skeleton variant="text" width={160} height={32} sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Box key={index}>
                    <Skeleton variant="text" width="50%" height={18} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="70%" height={24} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Trip Context Card Skeleton */}
          <Card>
            <CardContent>
              <Skeleton variant="text" width={140} height={32} sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="text" width="80%" height={20} />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}
