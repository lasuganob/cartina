import { Box, Stack, Typography } from '@mui/material';

export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        {eyebrow ? (
          <Typography variant="overline" color="primary.main">
            {eyebrow}
          </Typography>
        ) : null}
        <Typography variant="h4">{title}</Typography>
        {description ? (
          <Typography variant="body1" color="text.secondary">
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}
