import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Pagination,
  Box
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useLiveQuery } from 'dexie-react-hooks';

import PageHeader from '../../components/PageHeader';
import { useAppContext } from '../../context/AppContext';
import { db, queueMutation } from '../../lib/db';



import { useBarcodeLookup } from '../../hooks/useBarcodeLookup';

import InventoryEditor from './components/InventoryEditor';
import InventoryTable from './components/InventoryTable';
import InventoryMobileCards from './components/InventoryMobileCards';
import InventoryActionMenu from './components/InventoryActionMenu';

const initialFormValues = {
  name: '',
  category_id: '',
  usual_price: '',
  barcode: ''
};

const PAGE_SIZE = 10;

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
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  
  const { lookup } = useBarcodeLookup();
  const { showSnackbar } = useAppContext();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const categoryMap = useMemo(
    () =>
      categories.reduce((accumulator, category) => {
        accumulator[category.id] = category.name;
        return accumulator;
      }, {}),
    [categories]
  );

  const allRows = useMemo(
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

  const filteredRows = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return allRows;
    
    return allRows.filter(row => 
      String(row.name || '').toLowerCase().includes(query) ||
      (row.barcode && String(row.barcode).toLowerCase().includes(query)) ||
      String(row.category_name || '').toLowerCase().includes(query)
    );
  }, [allRows, searchQuery]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  function handleOpenAddDialog() {
    setEditingItem(null);
    setValues(initialFormValues);
    setErrors({});
    setScannerOpen(false);
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
    setScannerOpen(false);
    setDialogOpen(true);
    handleCloseMenu();
  }

  function handleCloseDialog() {
    if (busy) {
      return;
    }

    setDialogOpen(false);
    setScannerOpen(false);
    setEditingItem(null);
    setValues(initialFormValues);
    setErrors({});
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  const handleScanSuccess = useCallback(async (barcode) => {
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
  }, [lookup]);

  async function handleSave() {
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setBusy(true);
    try {
      const normalizedItem = normalizeInventoryItem(values, editingItem);
      const action = editingItem ? 'update' : 'create';

      await db.inventoryItems.put(normalizedItem);
      await queueMutation('inventoryItems', action, normalizedItem);

      showSnackbar(`Inventory item ${editingItem ? 'updated' : 'saved'} locally and queued for sync.`, 'success');
      handleCloseDialog();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(item) {
    handleCloseMenu();
    await db.inventoryItems.delete(item.id);
    await queueMutation('inventoryItems', 'delete', { id: item.id });

    showSnackbar('Inventory item deleted locally and queued for sync.', 'success');
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
          dialogOpen ? null : (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenAddDialog}
              sx={{ borderRadius: 1, fontSize: '12px' }}
            >
              Add Item
            </Button>
          )
        }
      />

      {dialogOpen ? (
        <InventoryEditor 
          editingItem={editingItem}
          values={values}
          errors={errors}
          busy={busy}
          categories={categories}
          scannerOpen={scannerOpen}
          setScannerOpen={setScannerOpen}
          onClose={handleCloseDialog}
          onChange={handleChange}
          onSave={handleSave}
          onScanSuccess={handleScanSuccess}
        />
      ) : null}

      <Card>
        <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, category, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon color="action" />
                  </InputAdornment>
                ),
                sx: { fontSize: "12px" }
              }}
            />
          </Box>

          {!categories.length ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No categories found. Add category rows in Google Sheets first so inventory items can be categorized.
            </Alert>
          ) : null}

          {!filteredRows.length ? (
            <Stack spacing={1} sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="h6">
                {searchQuery ? 'No items match your search' : 'No inventory items yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery 
                  ? 'Try adjusting your search query or clear the filter.' 
                  : 'Start by adding your staple products so trips and price history become more useful.'}
              </Typography>
              {searchQuery && (
                <Box sx={{ mt: 1 }}>
                  <Button variant="text" onClick={() => setSearchQuery('')}>
                    Clear Filter
                  </Button>
                </Box>
              )}
            </Stack>
          ) : (
            <>
              {isMobile ? (
                <InventoryMobileCards rows={paginatedRows} onOpenEdit={handleOpenEditDialog} />
              ) : (
                <InventoryTable rows={paginatedRows} onOpenMenu={handleOpenMenu} />
              )}

              <Stack 
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ mt: 3 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredRows.length)} of{' '}
                  {filteredRows.length} items
                </Typography>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={(_, p) => setPage(p)} 
                  color="primary"
                />
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <InventoryActionMenu 
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
        item={menuItem}
      />
    </>
  );
}
