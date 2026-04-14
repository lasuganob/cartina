import {
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
  Box,
  Divider
} from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function InventoryMobileCards({ rows, onOpenMenu }) {
  return (
    <Stack spacing={2}>
      {rows.map((item) => (
        <Card key={item.id} variant="outlined" sx={{ borderRadius: 1 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                  {item.name}
                </Typography>
                {item.barcode && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Code: {item.barcode}
                  </Typography>
                )}
              </Box>
              <IconButton 
                size="small" 
                onClick={(event) => onOpenMenu(event, item)}
                sx={{ mt: -0.5, mr: -0.5 }}
              >
                <MoreVertRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
            
            <Divider sx={{ my: 1.5 }} />
            
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                  Category
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {item.category_name}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                  Usual Price
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formatCurrency(item.usual_price)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
