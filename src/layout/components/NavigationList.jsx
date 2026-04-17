import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import { navigationItems } from '../../constants/navigation';

export default function NavigationList({ onItemClick }) {
  const { pathname } = useLocation();

  return (
    <List sx={{ pt: 2 }}>
      {navigationItems.map((item) => {
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
      })}
    </List>
  );
}
