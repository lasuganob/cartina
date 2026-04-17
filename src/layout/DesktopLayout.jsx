import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import {
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
  Tooltip,
  Badge,
} from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { tokens } from '../theme/design-tokens';
import NavigationList from './components/NavigationList';
import SettingsDialog from '../components/SettingsDialog';
import { useAppContext } from '../context/AppContext';

export default function DesktopLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { syncState } = useAppContext();
  const { isSyncing, pendingCount, syncNow, isOnline } = syncState;

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

          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            {/* Sync shortcut button */}
            <Tooltip title={pendingCount > 0 ? `${pendingCount} changes pending sync` : 'Sync with Google Sheets'}>
              <span>
                <IconButton
                  id="desktop-sync-button"
                  onClick={syncNow}
                  disabled={!isOnline || isSyncing}
                  sx={{
                    color: pendingCount > 0 ? '#ffb74d' : 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      color: '#fff',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
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
              id="desktop-settings-button"
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}
