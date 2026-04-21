import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';

const MILESTONES = [
  { key: 'created_at',   label: 'Created' },
  { key: 'planned_for',  label: 'Planned For', isDate: true },
  { key: 'started_at',   label: 'Started' },
  { key: 'completed_at', label: 'Completed' },
  { key: 'archived_at',  label: 'Archived' },
];

function formatVal(val, isDate) {
  if (!val) return null;
  if (isDate) return dayjs(val).format('MMM D, YYYY');
  return dayjs(val).format('MMM D, YYYY · h:mm A');
}

export default function TripTimelineCard({ trip }) {
  const visibleMilestones = trip.status === 'archived'
    ? MILESTONES
    : MILESTONES.filter((milestone) => milestone.key !== 'archived_at');

  const milestones = visibleMilestones.map((m) => ({
    ...m,
    value: formatVal(trip[m.key], m.isDate),
  }));

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="body1" fontWeight={700} sx={{ mb: 2 }}>
          Timeline
        </Typography>

        <Stack spacing={0}>
          {milestones.map((milestone, index) => {
            const done = !!milestone.value || milestone.key === 'created_at';;
            const isLast = index === milestones.length - 1;

            return (
              <Stack key={milestone.key} direction="row" spacing={1.5}>
                {/* Line + Dot column */}
                <Stack alignItems="center" sx={{ width: 20, flexShrink: 0 }}>
                  {done ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  ) : (
                    <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 18, color: 'divider' }} />
                  )}
                  {!isLast && (
                    <Box
                      sx={{
                        width: 2,
                        flex: 1,
                        minHeight: 16,
                        bgcolor: done ? 'primary.main' : 'divider',
                        opacity: done ? 0.3 : 0.2,
                        my: 0.25,
                      }}
                    />
                  )}
                </Stack>

                {/* Content column */}
                <Box sx={{ pb: isLast ? 0 : 1.5, pt: 0.1, minWidth: 0 }}>
                  <Typography variant="caption" color={done ? 'text.primary' : 'text.disabled'} fontWeight={600}>
                    {milestone.label}
                  </Typography>
                  {milestone.value ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {milestone.value}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontStyle: 'italic' }}>
                      Not yet
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
