import { createTheme } from '@mui/material/styles';

const paletteByMode = {
  light: {
    primary: { main: '#0d47a1' },
    secondary: { main: '#2e7d32' },
    background: { default: '#f5f7fb', paper: '#ffffff' }
  },
  dark: {
    primary: { main: '#90caf9' },
    secondary: { main: '#81c784' },
    background: { default: '#111827', paper: '#18212f' }
  }
};

export function createAppTheme(mode = 'light') {
  return createTheme({
    palette: {
      mode,
      ...paletteByMode[mode]
    },
    shape: {
      borderRadius: 16
    },
    typography: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700
      },
      h5: {
        fontWeight: 700
      }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundImage: 'none',
            boxShadow: 'none'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: 'none'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundColor: 'rgb(74, 101, 85)',
            color: '#f5f7f2',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'rgba(74, 101, 85, 0.8)',
              color: '#f5f7f2'
            }
          }
        }
      }
    }
  });
}
