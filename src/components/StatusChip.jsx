import { Chip } from '@mui/material';

const colorByStatus = {
  planned: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error'
};

export default function StatusChip({ status }) {
  return (
    <Chip
      size="small"
      label={status.replace('_', ' ')}
      color={colorByStatus[status] || 'default'}
      variant={status === 'planned' ? 'outlined' : 'filled'}
    />
  );
}
