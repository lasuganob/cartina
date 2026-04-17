import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationItems, managementItems } from '../../constants/navigation';

export default function NavigationList({ onItemClick }) {
  const { pathname } = useLocation();

  const renderItems = (items) => items.map((item) => {
    const Icon = item.icon;
    return (
      <ListItemButton
        key={item.path}
        component={NavLink}
        to={item.path}
        selected={pathname === item.path}
        onClick={onItemClick}
        sx={{
          mx: 1,
          mb: 0.5,
          borderRadius: 2,
          color: 'inherit',
          '& .MuiListItemIcon-root': {
            color: 'inherit',
            minWidth: 40
          },
          '&.Mui-selected': {
            bgcolor: 'rgba(255,255,255,0.16)'
          },
          '&.Mui-selected:hover': {
            bgcolor: 'rgba(255,255,255,0.2)'
          },
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
        <ListItemText primary={item.label} />
      </ListItemButton>
    );
  });

  return (
    <List sx={{ pt: 2 }}>
      {renderItems(navigationItems)}
      
      <Box sx={{ mt: 4, mb: 1, px: 3 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Config
        </Typography>
      </Box>
      {renderItems(managementItems)}
    </List>
  );
}
