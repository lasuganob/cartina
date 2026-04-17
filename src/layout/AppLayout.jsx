import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (isDesktop) {
    return <DesktopLayout />;
  }

  return <MobileLayout />;
}
