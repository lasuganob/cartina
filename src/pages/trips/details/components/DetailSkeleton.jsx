import { Box, Card, CardContent, Grid, Skeleton, Stack } from '@mui/material';

export default function DetailSkeleton() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width={200} height={32} />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Grid key={index} item xs={12} sm={6}>
                  <Skeleton variant="text" width="35%" height={20} />
                  <Skeleton variant="rounded" width="100%" height={56} />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Skeleton variant="text" width={180} height={32} />
            <Stack spacing={2} sx={{ mt: 2 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Skeleton variant="text" width="45%" height={28} />
                      <Skeleton variant="text" width="70%" height={22} />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={160} height={32} />
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" width="100%" height={42} />
                ))}
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton variant="text" width={150} height={32} />
              <Stack spacing={2} sx={{ mt: 2 }}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Box key={index}>
                    <Skeleton variant="text" width="35%" height={20} />
                    <Skeleton variant="text" width="70%" height={28} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}
