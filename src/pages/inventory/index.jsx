import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import { useLiveQuery } from 'dexie-react-hooks';
import PageHeader from '../../components/PageHeader';
import BarcodeScannerDialog from '../../components/BarcodeScannerDialog';
import { db } from '../../lib/db';
import { formatCurrency } from '../../utils/formatCurrency';
import { useBarcodeLookup } from '../../hooks/useBarcodeLookup';

const initialFormValues = {
  name: '',
  category_id: '',
  usual_price: '',
  barcode: ''
};

function normalizeInventoryItem(values, existingItem) {
  return {
    id: existingItem?.id || crypto.randomUUID(),
    name: String(values.name || '').trim(),
    category_id: String(values.category_id || '').trim(),
    usual_price: values.usual_price === '' ? 0 : Number(values.usual_price),
    barcode: String(values.barcode || '').trim(),
    created_at: existingItem?.created_at || new Date().toISOString()
  };
}

function validate(values) {
  const nextErrors = {};

  if (!String(values.name || '').trim()) {
    nextErrors.name = 'Item name is required.';
  }

  if (!String(values.category_id || '').trim()) {
    nextErrors.category_id = 'Category is required.';
  }

  if (values.usual_price === '' || Number(values.usual_price) < 0) {
    nextErrors.usual_price = 'Usual price must be zero or greater.';
  }

  return nextErrors;
}

export default function InventoryPage() {
  const inventoryItems = useLiveQuery(() => db.inventoryItems.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []) || [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [values, setValues] = useState(initialFormValues);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuItem, setMenuItem] = useState(null);
  const { lookup } = useBarcodeLookup();

  const categoryMap = useMemo(
    () =>
      categories.reduce((accumulator, category) => {
        accumulator[category.id] = category.name;
        return accumulator;
      }, {}),
    [categories]
  );

  const rows = useMemo(
    () =>
      inventoryItems
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((item) => ({
          ...item,
          category_name: categoryMap[item.category_id] || 'Uncategorized'
        })),
    [categoryMap, inventoryItems]
  );

  function handleOpenAddDialog() {
    setEditingItem(null);
    setValues(initialFormValues);
    setErrors({});
    setDialogOpen(true);
  }

  function handleOpenEditDialog(item) {
    setEditingItem(item);
    setValues({
      name: item.name || '',
      category_id: item.category_id || '',
      usual_price: String(item.usual_price ?? ''),
      barcode: item.barcode || ''
    });
    setErrors({});
    setDialogOpen(true);
    handleCloseMenu();
  }

  function handleCloseDialog() {
    if (busy) {
      return;
    }

    setDialogOpen(false);
    setEditingItem(null);
    setValues(initialFormValues);
    setErrors({});
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleScanSuccess(barcode) {
    setValues((current) => ({ ...current, barcode }));
    
    setBusy(true);
    try {
      const productInfo = await lookup(barcode);
      if (productInfo) {
        setValues((current) => ({
          ...current,
          name: productInfo.name || current.name,
          usual_price: productInfo.price ? String(productInfo.price) : current.usual_price,
          category_id: productInfo.category?.id || current.category_id
        }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setBusy(true);
    try {
      await db.inventoryItems.put(normalizeInventoryItem(values, editingItem));
      handleCloseDialog();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item) {
    handleCloseMenu();
    await db.inventoryItems.delete(item.id);
  }

  function handleOpenMenu(event, item) {
    setMenuAnchor(event.currentTarget);
    setMenuItem(item);
  }

  function handleCloseMenu() {
    setMenuAnchor(null);
    setMenuItem(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Inventory"
        description="Manage reusable grocery items and their usual prices."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleOpenAddDialog}>
            Add Item
          </Button>
        }
      />

      <Card>
        <CardContent>
          {!categories.length ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No categories found. Add category rows in Google Sheets first so inventory items can be categorized.
            </Alert>
          ) : null}

          {!rows.length ? (
            <Stack spacing={1}>
              <Typography variant="h6">No inventory items yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Start by adding your staple products so trips and price history become more useful.
              </Typography>
            </Stack>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Usual Price</TableCell>
                  <TableCell align="right">Actions</TableCell>
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
                            Barcode: {item.barcode}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell>{formatCurrency(item.usual_price)}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(event) => handleOpenMenu(event, item)}>
                        <MoreVertRoundedIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Barcode"
              name="barcode"
              value={values.barcode}
              onChange={handleChange}
              placeholder="Scan or enter manually"
              disabled={busy}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setScannerOpen(true)} edge="end" color="primary">
                      <QrCodeScannerRoundedIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Name"
              name="name"
              value={values.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
              disabled={busy}
              required
            />
            <TextField
              select
              label="Category"
              name="category_id"
              value={values.category_id}
              onChange={handleChange}
              error={Boolean(errors.category_id)}
              helperText={errors.category_id}
              disabled={busy}
              required
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Usual Price"
              name="usual_price"
              type="number"
              value={values.usual_price}
              onChange={handleChange}
              error={Boolean(errors.usual_price)}
              helperText={errors.usual_price}
              disabled={busy}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={busy}>
            {busy ? 'Processing...' : editingItem ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => menuItem && handleOpenEditDialog(menuItem)}>Edit</MenuItem>
        <MenuItem onClick={() => menuItem && handleDelete(menuItem)}>Delete</MenuItem>
      </Menu>

      <BarcodeScannerDialog 
        open={scannerOpen} 
        onClose={() => setScannerOpen(false)} 
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
