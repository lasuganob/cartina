import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
  Badge,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { tokens } from '../theme/design-tokens';
import SettingsDialog from '../components/SettingsDialog';
import AppBottomNavigation from './components/AppBottomNavigation';
import ActiveTripPill from './components/ActiveTripPill';
import { useAppContext } from '../context/AppContext';

export default function MobileLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { syncState } = useAppContext();
  const { isSyncing, pendingCount, syncNow, isOnline } = syncState;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', flexDirection: 'column' }}>
      {/* Top Bar */}
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
            {/* Sync shortcut button */}
            <Tooltip title={pendingCount > 0 ? `${pendingCount} changes pending` : 'Sync'}>
              <span>
                <IconButton
                  id="mobile-sync-button"
                  color="inherit"
                  onClick={syncNow}
                  disabled={!isOnline || isSyncing}
                  sx={{
                    color: pendingCount > 0 ? '#ffb74d' : 'inherit',
                  }}
                >
                  <Badge
                    badgeContent={pendingCount > 0 ? pendingCount : null}
                    color="warning"
                    sx={{ '& .MuiBadge-badge': { fontSize: '10px', minWidth: 16, height: 16 } }}
                  >
                    <SyncRoundedIcon 
                      sx={{ 
                        animation: isSyncing ? 'spin 2s linear infinite' : 'none' 
                      }} 
                    />
                  </Badge>
                </IconButton>
              </span>
            </Tooltip>

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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
