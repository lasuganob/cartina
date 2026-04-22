import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import {
  AppBar,
  Box,
  Container,
  Slide,
  IconButton,
  Toolbar,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { tokens } from '../theme/design-tokens';
import SettingsDialog from '../components/SettingsDialog';
import AppBottomNavigation from './components/AppBottomNavigation';
import ActiveTripPill from './components/ActiveTripPill';

export default function MobileLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);

  useEffect(() => {
    function handleScroll() {
      setShowTopBar(window.scrollY <= 8);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', flexDirection: 'column' }}>
      {/* Top Bar */}
      <Slide appear={false} direction="down" in={showTopBar}>
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
            {/* Logo */}
            <Box
              component="img"
              src="/no-bg-logo.png"
              alt="Cartina"
              sx={{ height: 32, objectFit: 'contain' }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                id="mobile-settings-button"
                edge="end"
                color="inherit"
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsRoundedIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      </Slide>

      {/* Main Content Area */}
      <Container
        sx={{
          py: 3,
          mt: `${tokens.layout.topBarHeight}px`,
          pb: 18,
          flexGrow: 1,
          px: 2,
          mb: 5
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
