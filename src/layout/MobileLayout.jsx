import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import {
  AppBar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { tokens } from '../theme/design-tokens';
import NavigationList from './components/NavigationList';
import SettingsDialog from '../components/SettingsDialog';

export default function MobileLayout() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setOpen(true)}
          >
            <MenuRoundedIcon />
          </IconButton>
          
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

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: tokens.layout.drawerWidth,
            bgcolor: tokens.colors.forest,
            color: tokens.colors.textWhite,
            backgroundImage: 'none'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
           <Typography variant="h6" sx={{ color: 'inherit' }}>Cartina</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
        <NavigationList onItemClick={() => setOpen(false)} />
      </Drawer>

      {/* Main Content */}
      <Container
        sx={{
          py: 3,
          mt: `${tokens.layout.topBarHeight}px`,
          flexGrow: 1,
          px: 2
        }}
      >
        <Outlet />
      </Container>

      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </Box>
  );
}
