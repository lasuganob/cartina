import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { navigationItems } from '../../constants/navigation';
import { tokens } from '../../theme/design-tokens';

export default function AppBottomNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Find the active index based on the root path
  const findValue = () => {
    const matched = navigationItems.findIndex(item => {
       if (item.path === '/') return pathname === '/';
       return pathname.startsWith(item.path);
    });
    return matched !== -1 ? matched : 0;
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1200,
        borderRadius: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
        // Support for "Safe Areas" on modern phones
        pb: 'min(env(safe-area-inset-bottom), 20px)',
      }} 
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={findValue()}
        onChange={(event, newValue) => {
          navigate(navigationItems[newValue].path);
        }}
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            padding: '8px 0',
          },
          '& .Mui-selected': {
            color: tokens.colors.forest,
            '& .MuiBottomNavigationAction-label': {
              fontWeight: 700,
              fontSize: '11px',
            }
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '11px',
            color: 'text.secondary',
          }
        }}
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={<Icon sx={{ fontSize: 24 }} />}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
