import { useState } from 'react';
import { Box, Card, CardContent, Stack, Typography, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusChip from '../../../components/StatusChip';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { useNavigate } from 'react-router-dom';

export default function TripCard({ trip }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    // Navigation for edit trip goes here if existing
    // navigate(`/trips/${trip.id}/edit`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    // Add logic here to delete trip
  };

  return (
    <Card 
      variant="outlined"
      onClick={() => navigate(`/trips/${trip.id}`)}
      sx={{ 
        position: 'relative',
        cursor: 'pointer', 
        '&:hover': { backgroundColor: 'action.hover' },
        transition: 'background-color 0.2s',
      }}
    >
      <Box 
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton onClick={handleMenuClick} size="small">
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="inherit" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      <CardContent>
        <Box sx={{ pr: 4 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 0.5, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body1" fontWeight="bold">
              {trip.name}
            </Typography>
            <StatusChip status={trip.status} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {formatDate(trip.planned_for)}
            </Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {formatCurrency(trip.budget)}
            </Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {trip.store?.name || 'No store'}
            </Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
              {trip.items ? trip.items.length : 0} items
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
