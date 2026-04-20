import { IconButton, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';

/**
 * Common Quantity Selector component with standardized styling.
 * @param {Object} props
 * @param {number} props.value - Current quantity
 * @param {function} props.onChange - Handler that receives the new quantity
 * @param {number} [props.min=1] - Minimum value allowed
 * @param {boolean} [props.disabled=false] - Whether the selector is disabled
 * @param {Object} [props.sx={}] - Additional styles for the container
 */
export default function QuantitySelector({ 
  value, 
  onChange, 
  min = 1, 
  disabled = false,
  sx = {}
}) {
  const handleDecrement = () => {
    onChange(Math.max(min, Number(value || min) - 1));
  };

  const handleIncrement = () => {
    onChange(Number(value || 0) + 1);
  };

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={sx}>
      <IconButton
        size="small"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          width: 30,
          height: 30,
        }}
      >
        <RemoveRoundedIcon fontSize="small" />
      </IconButton>
      
      <Typography 
        variant="body1" 
        fontWeight={700} 
        minWidth={28} 
        textAlign="center"
        sx={{ opacity: disabled ? 0.5 : 1 }}
      >
        {value}
      </Typography>

      <IconButton
        size="small"
        onClick={handleIncrement}
        disabled={disabled}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          width: 30,
          height: 30,
        }}
      >
        <AddRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
