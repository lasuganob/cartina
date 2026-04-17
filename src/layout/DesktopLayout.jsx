import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import {
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
} from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { tokens } from '../theme/design-tokens';
import NavigationList from './components/NavigationList';
import SettingsDialog from '../components/SettingsDialog';

export default function DesktopLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: tokens.layout.drawerWidth,
          flexShrink: 0,
        }}
      >
        <Drawer
          variant="permanent"
          open
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: tokens.layout.drawerWidth,
              borderRight: 'none',
              bgcolor: tokens.colors.forest,
              color: tokens.colors.textWhite,
              backgroundImage: 'none',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0
            }
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Toolbar sx={{ gap: 1.5, mb: 2, mt: 1 }}>
              <Box
                component="img"
                src="/no-bg-logo.png"
                alt="Cartina"
                sx={{ width: '100%', height: 60, objectFit: 'contain' }}
              />
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            <NavigationList />
          </Box>

          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton 
              onClick={() => setSettingsOpen(true)}
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                '&:hover': {
                  color: '#fff',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <SettingsRoundedIcon />
            </IconButton>
          </Box>
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Container
          maxWidth="lg"
          sx={{
            py: 4,
            ml: 0,
            flexGrow: 1
          }}
        >
          <Outlet />
        </Container>
      </Box>

      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </Box>
  );
}
