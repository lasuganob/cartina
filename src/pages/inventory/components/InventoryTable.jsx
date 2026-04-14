import {
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function InventoryTable({ rows, onOpenMenu }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Usual Price</TableCell>
          <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((item) => (
          <TableRow key={item.id} hover>
            <TableCell>
              <Stack spacing={0.5}>
                <Typography variant="body2" fontWeight="bold">
                  {item.name}
                </Typography>
                {item.barcode && (
                  <Typography variant="caption" color="text.secondary">
                    #{item.barcode}
                  </Typography>
                )}
              </Stack>
            </TableCell>
            <TableCell>{item.category_name}</TableCell>
            <TableCell>{formatCurrency(item.usual_price)}</TableCell>
            <TableCell align="right">
              <IconButton onClick={(event) => onOpenMenu(event, item)}>
                <MoreVertRoundedIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
