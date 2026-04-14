import { Menu, MenuItem } from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

export default function InventoryActionMenu({
  anchorEl,
  open,
  onClose,
  onEdit,
  onDelete,
  item
}) {
  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuItem onClick={() => item && onEdit(item)}><EditRoundedIcon sx={{ mr: 2 }} />Edit</MenuItem>
      <MenuItem onClick={() => item && onDelete(item)} sx={{ color: 'error.main' }}><DeleteRoundedIcon sx={{ mr: 2 }} /> Delete</MenuItem>
    </Menu>
  );
}
