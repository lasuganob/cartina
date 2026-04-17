import { useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import StoresManager from './sections/StoresManager';
import CategoriesManager from './sections/CategoriesManager';

export default function ManagersPage() {
  const [searchParams] = useSearchParams();
  const storesRef = useRef(null);
  const categoriesRef = useRef(null);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'stores' && storesRef.current) {
      storesRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'categories' && categoriesRef.current) {
      categoriesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          Data Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure your master data for trips and inventory
        </Typography>
      </Box>

      <Stack spacing={4}>
        <Box ref={storesRef}>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            Shopping Stores
          </Typography>
          <StoresManager />
        </Box>

        <Box ref={categoriesRef}>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            Inventory Categories
          </Typography>
          <CategoriesManager />
        </Box>
      </Stack>
    </Container>
  );
}
