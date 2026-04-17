import { createTheme } from '@mui/material/styles';
import { tokens } from '../theme/design-tokens';

const paletteByMode = {
  light: {
    primary: { main: tokens.colors.forest },
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
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      ...paletteByMode[mode]
    },
    shape: {
      borderRadius: tokens.radius.desktop / 8, // MUI uses 8px units by default
    },
    typography: {
      fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      body1: { fontSize: '1rem' },
      body2: { fontSize: '0.875rem' },
      subtitle2: { fontWeight: 700, fontSize: '0.875rem' },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
            backgroundImage: 'none',
            boxShadow: 'none',
            borderRadius: tokens.radius.desktop,
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
            boxShadow: 'none',
            borderRadius: tokens.radius.desktop,
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.mobile,
            textTransform: 'none',
            fontWeight: 700,
            padding: '10px 20px',
            '&.MuiButton-containedPrimary': {
              backgroundColor: tokens.colors.forest,
              color: '#fff',
              '&:hover': {
                backgroundColor: tokens.colors.forestLight,
              }
            }
          }
        }
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: tokens.radius.mobile,
            }
          }
        }
      }
    }
  });
}
