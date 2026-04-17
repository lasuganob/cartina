import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
} from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { tokens } from '../theme/design-tokens';
import SettingsDialog from '../components/SettingsDialog';
import AppBottomNavigation from './components/AppBottomNavigation';
import ActiveTripPill from './components/ActiveTripPill';

export default function MobileLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', flexDirection: 'column' }}>
      {/* Top Bar - Simplified */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: tokens.colors.forest,
          color: tokens.colors.textWhite,
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo takes the place of the menu button */}
          <Box
            component="img"
            src="/no-bg-logo.png"
            alt="Cartina"
            sx={{ height: 32, objectFit: 'contain' }}
          />

          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Container
        sx={{
          py: 3,
          mt: `${tokens.layout.topBarHeight}px`,
          pb: 18, // Extra padding for the floating pill + bottom nav
          flexGrow: 1,
          px: 2
        }}
      >
        <Outlet />
      </Container>

      {/* Global Status Pill */}
      <ActiveTripPill />

      {/* Bottom Navigation */}
      <AppBottomNavigation />

      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </Box>
  );
}
