import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import {
  AppBar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { navigationItems } from '../constants/navigation';

const drawerWidth = 260;
const sidebarBackground = 'rgb(74, 101, 85)';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const navList = (
    <Box sx={{ width: drawerWidth, height: '100%', bgcolor: sidebarBackground, color: '#f5f7f2' }}>
      <Toolbar sx={{ gap: 1.5, ml: "auto", mr: "auto" }}>
        <Box
          component="img"
          src="/no-bg-logo.png"
          alt="Cartina"
          sx={{ width: 150, height: 150, objectFit: 'contain' }}
        />
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List sx={{ pt: 2 }}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={pathname === item.path}
              onClick={() => setOpen(false)}
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
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isDesktop ? (
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            backgroundColor: 'rgb(74, 101, 85)'
          }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1 }}>
              <MenuRoundedIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      ) : null}

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 }
        }}
      >
        <Drawer
          variant="temporary"
          open={!isDesktop && open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: sidebarBackground,
              backgroundImage: 'none'
            }
          }}
        >
          {navList}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
              bgcolor: sidebarBackground,
              backgroundImage: 'none'
            }
          }}
        >
          {navList}
        </Drawer>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          py: 4,
          mt: isDesktop ? '0' : '50px',
          ml: 0,
          flexGrow: 1
        }}
      >
        <Outlet />
      </Container>
    </Box>
  );
}
