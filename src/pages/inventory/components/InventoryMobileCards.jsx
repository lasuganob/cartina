import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function InventoryMobileCards({ rows, onOpenEdit }) {
  return (
    <Stack spacing={1}>
      {rows.map((item) => (
        <Card key={item.id} variant="outlined" sx={{ borderRadius: 1 }}>
          <CardActionArea onClick={() => onOpenEdit(item)} sx={{ borderRadius: 1 }}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack spacing={0.5} minWidth={0}>
                  <Typography variant="body1" fontWeight={700} noWrap>
                    {item.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                      {item.category_name}
                    </Typography>
                    {item.barcode && (
                      <>
                        <Typography variant="caption" color="text.disabled">·</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                          {item.barcode}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Stack>
                <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ flexShrink: 0 }}>
                  {formatCurrency(item.usual_price)}
                </Typography>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}
